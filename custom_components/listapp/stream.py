from __future__ import annotations

import asyncio
import contextlib
import logging
import random
from collections.abc import AsyncIterator, Awaitable, Callable
from dataclasses import dataclass
from http import HTTPStatus
from typing import TYPE_CHECKING

from aiohttp import ClientError, ClientSession, ClientTimeout, StreamReader, hdrs

from .api import ListAppAuthError, ListAppError
from .const import (
    REQUEST_TIMEOUT_SECONDS,
    STREAM_BACKOFF_INITIAL_SECONDS,
    STREAM_BACKOFF_MAX_SECONDS,
)

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class StreamEvent:
    event: str
    data: str


class _AuthFailed(Exception):
    pass


class _SelectionRejected(Exception):
    pass


class _Retryable(Exception):
    pass


class _SelectionEmpty(Exception):
    pass


async def parse_sse(content: StreamReader) -> AsyncIterator[StreamEvent]:
    """Parse an SSE byte stream into events, per the spec's field/dispatch rules."""
    event_type = "message"
    data_lines: list[str] = []
    while True:
        raw = await content.readline()
        if not raw:
            return
        line = raw.decode("utf-8", errors="replace").rstrip("\r\n")
        if line == "":
            if data_lines:
                yield StreamEvent(event=event_type, data="\n".join(data_lines))
            event_type = "message"
            data_lines = []
            continue
        if line.startswith(":"):
            continue
        field, _, value = line.partition(":")
        value = value.removeprefix(" ")
        if field == "data":
            data_lines.append(value)
        elif field == "event":
            event_type = value or "message"


class ListAppEventStream:
    """One long-lived SSE reader for a config entry's selected-lists stream."""

    def __init__(
        self,
        *,
        hass: HomeAssistant,
        entry: ConfigEntry,
        session: ClientSession,
        get_access_token: Callable[[], Awaitable[str]],
        base_url: str,
        get_list_ids: Callable[[], list[str]],
        heartbeat_timeout: float,
        on_event: Callable[[StreamEvent], None],
        on_state_change: Callable[[bool], None],
        on_auth_failed: Callable[[], None],
        on_selection_rejected: Callable[[], None],
    ) -> None:
        self._hass = hass
        self._entry = entry
        self._session = session
        self._get_access_token = get_access_token
        self._base_url = base_url
        self._get_list_ids = get_list_ids
        self._heartbeat_timeout = heartbeat_timeout
        self._on_event = on_event
        self._on_state_change = on_state_change
        self._on_auth_failed = on_auth_failed
        self._on_selection_rejected = on_selection_rejected
        self._task: asyncio.Task[None] | None = None
        self._connected = False

    def start(self) -> None:
        self._task = self._entry.async_create_background_task(
            self._hass, self._run(), "listapp_event_stream"
        )

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await self._task
        self._task = None

    async def _run(self) -> None:
        backoff = STREAM_BACKOFF_INITIAL_SECONDS
        while True:
            self._connected = False
            try:
                await self._connect_and_read()
            except _AuthFailed:
                self._on_auth_failed()
                return
            except _SelectionRejected:
                _LOGGER.error(
                    "Listapp rejected the selected lists for live updates; falling back to polling"
                )
                self._on_selection_rejected()
                return
            except _SelectionEmpty:
                # Selection can only shrink at runtime; growing it reloads the entry.
                _LOGGER.debug("Listapp live update stream has no lists selected; stopping")
                return
            except (ClientError, TimeoutError, _Retryable) as err:
                _LOGGER.debug("Listapp live update stream disconnected: %s", err)
            except Exception as err:
                _LOGGER.warning(
                    "Listapp live update stream hit an unexpected error: %s", err, exc_info=err
                )
            finally:
                self._on_state_change(False)
            if self._connected:
                backoff = STREAM_BACKOFF_INITIAL_SECONDS
            delay = backoff + random.uniform(0, backoff * 0.5)
            await asyncio.sleep(min(delay, STREAM_BACKOFF_MAX_SECONDS))
            backoff = min(backoff * 2, STREAM_BACKOFF_MAX_SECONDS)

    async def _connect_and_read(self) -> None:
        list_ids = self._get_list_ids()
        if not list_ids:
            raise _SelectionEmpty
        try:
            token = await self._get_access_token()
        except ListAppAuthError as err:
            raise _AuthFailed from err
        except ListAppError as err:
            raise _Retryable(str(err)) from err
        timeout = ClientTimeout(
            total=None, connect=REQUEST_TIMEOUT_SECONDS, sock_read=self._heartbeat_timeout
        )
        # Read per connect, so a list removed mid-stream isn't resent on reconnect.
        url = f"{self._base_url}/me/events/selected?lists={','.join(list_ids)}"
        async with self._session.get(
            url,
            headers={hdrs.AUTHORIZATION: f"Bearer {token}"},
            timeout=timeout,
        ) as response:
            if response.status == HTTPStatus.UNAUTHORIZED:
                raise _AuthFailed
            if response.status == HTTPStatus.BAD_REQUEST:
                raise _SelectionRejected
            if response.status != HTTPStatus.OK:
                raise _Retryable(f"unexpected status {response.status}")
            self._connected = True
            self._on_state_change(True)
            async for event in parse_sse(response.content):
                self._on_event(event)
