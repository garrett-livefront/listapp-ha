from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import Callable
from dataclasses import replace

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import (
    ListAppAuthError,
    ListAppClient,
    ListAppError,
    ListAppItem,
    ListAppList,
    ListAppNotFoundError,
)
from .const import (
    CONF_READ_ONLY,
    CONF_SELECTED_LISTS,
    DOMAIN,
    POLL_INTERVAL_FALLBACK,
    POLL_INTERVAL_STREAMING,
    SCOPE_WRITE,
    STREAM_BURST_SECONDS,
    STREAM_HEARTBEAT_TIMEOUT_SECONDS,
)
from .stream import ListAppEventStream, StreamEvent

_LOGGER = logging.getLogger(__name__)

type ListAppConfigEntry = ConfigEntry[ListAppCoordinator]


class ListAppCoordinator(DataUpdateCoordinator[dict[str, ListAppList]]):
    config_entry: ListAppConfigEntry

    def __init__(
        self, hass: HomeAssistant, entry: ListAppConfigEntry, client: ListAppClient
    ) -> None:
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=POLL_INTERVAL_FALLBACK,
        )
        self.client = client
        self._active_ids: set[str] = set(entry.options[CONF_SELECTED_LISTS])
        self._stream: ListAppEventStream | None = None
        self._pending: dict[str, ListAppList] | None = None
        self._batch_handle: asyncio.TimerHandle | None = None

    @property
    def account_id(self) -> str:
        assert self.config_entry.unique_id is not None
        return self.config_entry.unique_id

    @property
    def can_write(self) -> bool:
        if self.config_entry.options.get(CONF_READ_ONLY, False):
            return False
        granted = self.config_entry.data["token"].get("scope", "")
        return SCOPE_WRITE in granted.split()

    async def _async_fetch_list(self, list_id: str) -> ListAppList | None:
        try:
            return await self.client.async_get_list(list_id)
        except ListAppNotFoundError:
            return None

    async def _async_update_data(self) -> dict[str, ListAppList]:
        try:
            lists = await asyncio.gather(
                *(self._async_fetch_list(list_id) for list_id in self._active_ids)
            )
        except ListAppAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except ListAppError as err:
            raise UpdateFailed(str(err)) from err
        return {lst.id: lst for lst in lists if lst is not None}

    def async_start_stream(self) -> None:
        self._stream = ListAppEventStream(
            session=async_get_clientsession(self.hass),
            get_access_token=self.client.async_get_access_token,
            base_url=self.client.base_url,
            list_ids=sorted(self._active_ids),
            heartbeat_timeout=STREAM_HEARTBEAT_TIMEOUT_SECONDS,
            on_event=self._handle_stream_event,
            on_state_change=self._handle_stream_state_change,
            on_auth_failed=lambda: self.config_entry.async_start_reauth(self.hass),
            on_selection_rejected=lambda: self._handle_stream_state_change(False),
        )
        self._stream.start()

    async def async_stop_stream(self) -> None:
        if self._batch_handle is not None:
            self._batch_handle.cancel()
            self._batch_handle = None
        self._pending = None
        if self._stream is not None:
            await self._stream.stop()
            self._stream = None

    def _handle_stream_state_change(self, connected: bool) -> None:
        self.update_interval = POLL_INTERVAL_STREAMING if connected else POLL_INTERVAL_FALLBACK

    def _pending_data(self) -> dict[str, ListAppList]:
        if self._pending is None:
            self._pending = dict(self.data)
        return self._pending

    def _handle_stream_event(self, event: StreamEvent) -> None:
        handler = _EVENT_HANDLERS.get(event.event)
        if handler is None:
            return
        # Frames are a ListChangeEvent envelope — see docs/architecture.md#event-frames
        try:
            envelope = json.loads(event.data)
            handler(self, envelope["listId"], envelope["payload"])
        except (ValueError, KeyError, TypeError):
            _LOGGER.debug("Ignoring malformed ListApp %s event", event.event)
            return
        self._schedule_batch()

    def _schedule_batch(self) -> None:
        if self._batch_handle is not None:
            return
        self._batch_handle = self.hass.loop.call_later(STREAM_BURST_SECONDS, self._flush_batch)

    def _flush_batch(self) -> None:
        self._batch_handle = None
        if self._pending is not None:
            data, self._pending = self._pending, None
            self.async_set_updated_data(data)

    def _apply_item_upserted(self, list_id: str, payload: dict) -> None:
        item = ListAppItem(
            id=payload["id"],
            content=payload["content"],
            is_checked=payload["isChecked"],
            position=payload["position"],
        )
        data = self._pending_data()
        lst = data.get(list_id)
        if lst is None:
            return
        items = [existing for existing in lst.items if existing.id != item.id]
        items.append(item)
        items.sort(key=lambda existing: existing.position)
        data[lst.id] = replace(lst, items=items)

    def _apply_item_deleted(self, list_id: str, payload: dict) -> None:
        item_id = payload["id"]
        data = self._pending_data()
        lst = data.get(list_id)
        if lst is None:
            return
        items = [existing for existing in lst.items if existing.id != item_id]
        data[lst.id] = replace(lst, items=items)

    def _apply_items_reordered(self, list_id: str, payload: dict) -> None:
        positions = {entry["id"]: entry["position"] for entry in payload["items"]}
        data = self._pending_data()
        lst = data.get(list_id)
        if lst is None:
            return
        items = [
            replace(existing, position=positions.get(existing.id, existing.position))
            for existing in lst.items
        ]
        items.sort(key=lambda existing: existing.position)
        data[lst.id] = replace(lst, items=items)

    def _apply_list_updated(self, list_id: str, payload: dict) -> None:
        title, owner_id = payload["title"], payload["ownerId"]
        data = self._pending_data()
        lst = data.get(list_id)
        if lst is None:
            return
        data[lst.id] = replace(lst, title=title, owner_id=owner_id)

    def _apply_list_deleted(self, list_id: str, payload: dict) -> None:
        data = self._pending_data()
        data.pop(list_id, None)
        self._active_ids.discard(list_id)

    def _apply_member_deleted(self, list_id: str, payload: dict) -> None:
        if payload.get("userId") != self.account_id:
            return
        data = self._pending_data()
        data.pop(list_id, None)
        self._active_ids.discard(list_id)


_EVENT_HANDLERS: dict[str, Callable[[ListAppCoordinator, str, dict], None]] = {
    "item.upserted": ListAppCoordinator._apply_item_upserted,
    "item.deleted": ListAppCoordinator._apply_item_deleted,
    "items.reordered": ListAppCoordinator._apply_items_reordered,
    "list.updated": ListAppCoordinator._apply_list_updated,
    "list.deleted": ListAppCoordinator._apply_list_deleted,
    "member.deleted": ListAppCoordinator._apply_member_deleted,
}
