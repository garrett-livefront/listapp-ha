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
    ROLE_VIEWER,
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
        self._pending: list[tuple[_EventHandler, str, dict]] = []
        self._batch_handle: asyncio.TimerHandle | None = None
        self._pending_role_refresh = False
        self._role_overrides: dict[str, str] = {}

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

    def can_write_list(self, list_id: str) -> bool:
        """Combine the global read-only option/scope with this list's own role.

        A None role means an older server that omits myRole — fall back to H2 behavior: attempt
        the write and let the server's 403/404 raise "may be view-only". See
        docs/architecture.md#roles.
        """
        if not self.can_write:
            return False
        lst = self.data.get(list_id)
        return lst is None or lst.my_role is None or lst.my_role != ROLE_VIEWER

    async def _async_fetch_list(self, list_id: str) -> ListAppList | None:
        try:
            return await self.client.async_get_list(list_id)
        except ListAppNotFoundError:
            self._active_ids.discard(list_id)
            return None

    async def _async_update_data(self) -> dict[str, ListAppList]:
        try:
            lists = await asyncio.gather(
                *(self._async_fetch_list(list_id) for list_id in list(self._active_ids))
            )
        except ListAppAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except ListAppError as err:
            raise UpdateFailed(str(err)) from err
        # Re-checked: a stream removal can land while the requests are in flight.
        result = {lst.id: lst for lst in lists if lst is not None and lst.id in self._active_ids}
        # A poll started before a member.upserted demotion can finish after it and carry a
        # stale role. Reapply any not-yet-confirmed override so it can't revert the demotion —
        # see docs/architecture.md#roles.
        for list_id, role in list(self._role_overrides.items()):
            lst = result.get(list_id)
            if lst is None:
                continue
            if lst.my_role == role:
                del self._role_overrides[list_id]
            else:
                result[list_id] = replace(lst, my_role=role)
        return result

    def async_start_stream(self) -> None:
        self._stream = ListAppEventStream(
            session=async_get_clientsession(self.hass),
            get_access_token=self.client.async_get_access_token,
            base_url=self.client.base_url,
            get_list_ids=lambda: sorted(self._active_ids),
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
        self._pending = []
        if self._stream is not None:
            await self._stream.stop()
            self._stream = None

    def _handle_stream_state_change(self, connected: bool) -> None:
        interval = POLL_INTERVAL_STREAMING if connected else POLL_INTERVAL_FALLBACK
        if interval == self.update_interval:
            return
        self.update_interval = interval
        if self._unsub_refresh is not None:
            self._schedule_refresh()

    def _handle_stream_event(self, event: StreamEvent) -> None:
        handler = _EVENT_HANDLERS.get(event.event)
        if handler is None:
            return
        # Frames are a ListChangeEvent envelope — see docs/architecture.md#event-frames
        try:
            envelope = json.loads(event.data)
            list_id, payload = envelope["listId"], envelope["payload"]
            handler(self, dict(self.data), list_id, payload)
        except (ValueError, KeyError, TypeError, AttributeError):
            _LOGGER.debug("Ignoring malformed ListApp %s event", event.event)
            return
        self._pending.append((handler, list_id, payload))
        self._schedule_batch()

    def _schedule_batch(self) -> None:
        if self._batch_handle is not None:
            return
        self._batch_handle = self.hass.loop.call_later(STREAM_BURST_SECONDS, self._flush_batch)

    def _flush_batch(self) -> None:
        # Replayed onto the latest data, so a poll landing mid-batch isn't overwritten.
        self._batch_handle = None
        ops, self._pending = self._pending, []
        data = dict(self.data)
        for handler, list_id, payload in ops:
            handler(self, data, list_id, payload)
        self.async_set_updated_data(data)
        if self._pending_role_refresh:
            self._pending_role_refresh = False
            self.hass.async_create_task(self.async_request_refresh())

    def _apply_item_upserted(self, data: dict, list_id: str, payload: dict) -> None:
        item = ListAppItem(
            id=payload["id"],
            content=payload["content"],
            is_checked=payload["isChecked"],
            position=payload["position"],
        )
        lst = data.get(list_id)
        if lst is None:
            return
        items = [existing for existing in lst.items if existing.id != item.id]
        items.append(item)
        items.sort(key=lambda existing: existing.position)
        data[lst.id] = replace(lst, items=items)

    def _apply_item_deleted(self, data: dict, list_id: str, payload: dict) -> None:
        item_id = payload["id"]
        lst = data.get(list_id)
        if lst is None:
            return
        items = [existing for existing in lst.items if existing.id != item_id]
        data[lst.id] = replace(lst, items=items)

    def _apply_items_reordered(self, data: dict, list_id: str, payload: dict) -> None:
        positions = {entry["id"]: entry["position"] for entry in payload["items"]}
        lst = data.get(list_id)
        if lst is None:
            return
        items = [
            replace(existing, position=positions.get(existing.id, existing.position))
            for existing in lst.items
        ]
        items.sort(key=lambda existing: existing.position)
        data[lst.id] = replace(lst, items=items)

    def _apply_list_updated(self, data: dict, list_id: str, payload: dict) -> None:
        title, owner_id = payload["title"], payload["ownerId"]
        lst = data.get(list_id)
        if lst is None:
            return
        data[lst.id] = replace(lst, title=title, owner_id=owner_id)

    def _apply_list_deleted(self, data: dict, list_id: str, payload: dict) -> None:
        if payload["id"] != list_id:
            raise ValueError("list.deleted names a different list")
        data.pop(list_id, None)
        self._active_ids.discard(list_id)
        self._role_overrides.pop(list_id, None)

    def _apply_member_deleted(self, data: dict, list_id: str, payload: dict) -> None:
        if payload.get("userId") != self.account_id:
            return
        data.pop(list_id, None)
        self._active_ids.discard(list_id)
        self._role_overrides.pop(list_id, None)

    def _apply_member_upserted(self, data: dict, list_id: str, payload: dict) -> None:
        if payload.get("userId") != self.account_id:
            return
        role = payload.get("role")
        if role is None:
            self._pending_role_refresh = True
            return
        # Recorded so a poll already in flight can't overwrite this with a stale role — see
        # _async_update_data and docs/architecture.md#roles.
        self._role_overrides[list_id] = role
        lst = data.get(list_id)
        if lst is not None:
            data[lst.id] = replace(lst, my_role=role)


type _EventHandler = Callable[[ListAppCoordinator, dict, str, dict], None]

_EVENT_HANDLERS: dict[str, _EventHandler] = {
    "item.upserted": ListAppCoordinator._apply_item_upserted,
    "item.deleted": ListAppCoordinator._apply_item_deleted,
    "items.reordered": ListAppCoordinator._apply_items_reordered,
    "list.updated": ListAppCoordinator._apply_list_updated,
    "list.deleted": ListAppCoordinator._apply_list_deleted,
    "member.deleted": ListAppCoordinator._apply_member_deleted,
    "member.upserted": ListAppCoordinator._apply_member_upserted,
}
