from __future__ import annotations

from collections.abc import Awaitable, Callable
from uuid import uuid4

from homeassistant.components.todo import (
    DOMAIN as TODO_DOMAIN,
)
from homeassistant.components.todo import (
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .api import (
    ListAppAuthError,
    ListAppError,
    ListAppForbiddenError,
    ListAppList,
    ListAppNotFoundError,
)
from .const import ATTR_COLOR, ATTR_ICON, ATTR_LIST_ID, ATTR_ROLE, DOMAIN, KNOWN_ROLES
from .coordinator import ListAppConfigEntry, ListAppCoordinator

PARALLEL_UPDATES = 1


def _device_identifier(account_id: str, list_id: str) -> tuple[str, str]:
    return (DOMAIN, f"{account_id}_{list_id}")


def _get_device(
    devices: dr.DeviceRegistry, entry_id: str, identifier: tuple[str, str]
) -> dr.DeviceEntry | None:
    # async_get_device_by_identifier doesn't exist on the min-supported HA (docs/testing.md),
    # which only has the now-deprecated async_get_device.
    if lookup := getattr(devices, "async_get_device_by_identifier", None):
        return lookup(identifier, entry_id)
    return devices.async_get_device(identifiers={identifier})


WRITE_FEATURES = (
    TodoListEntityFeature.CREATE_TODO_ITEM
    | TodoListEntityFeature.UPDATE_TODO_ITEM
    | TodoListEntityFeature.DELETE_TODO_ITEM
    | TodoListEntityFeature.MOVE_TODO_ITEM
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ListAppConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    coordinator = entry.runtime_data
    registry = er.async_get(hass)
    devices = dr.async_get(hass)
    known: set[str] = set()
    registered = {
        registry_entry.unique_id.removeprefix(f"{coordinator.account_id}_")
        for registry_entry in er.async_entries_for_config_entry(registry, entry.entry_id)
        if registry_entry.domain == TODO_DOMAIN
    }

    # H3 moved from one account-level device to one device per list; clean up the orphan.
    if legacy_device := _get_device(devices, entry.entry_id, (DOMAIN, coordinator.account_id)):
        devices.async_remove_device(legacy_device.id)

    @callback
    def sync_entities() -> None:
        current = set(coordinator.data)
        if added := current - known:
            known.update(added)
            async_add_entities(ListAppTodoEntity(coordinator, list_id) for list_id in added)
        for list_id in current:
            devices.async_get_or_create(
                config_entry_id=entry.entry_id,
                identifiers={_device_identifier(coordinator.account_id, list_id)},
                name=coordinator.data[list_id].title,
                manufacturer="Listapp",
                entry_type=DeviceEntryType.SERVICE,
            )
        stale = (known | registered) - current
        registered.clear()
        for list_id in stale:
            known.discard(list_id)
            unique_id = f"{coordinator.account_id}_{list_id}"
            if entity_id := registry.async_get_entity_id(TODO_DOMAIN, DOMAIN, unique_id):
                registry.async_remove(entity_id)
            device_identifier = _device_identifier(coordinator.account_id, list_id)
            if device := _get_device(devices, entry.entry_id, device_identifier):
                devices.async_remove_device(device.id)

    sync_entities()
    entry.async_on_unload(coordinator.async_add_listener(sync_entities))


class ListAppTodoEntity(CoordinatorEntity[ListAppCoordinator], TodoListEntity):
    _attr_has_entity_name = True
    # The card reads these live; recording them would just bloat history. See docs/card.md.
    _unrecorded_attributes = frozenset({ATTR_LIST_ID, ATTR_COLOR, ATTR_ICON, ATTR_ROLE})

    def __init__(self, coordinator: ListAppCoordinator, list_id: str) -> None:
        super().__init__(coordinator)
        self._list_id = list_id
        self._attr_unique_id = f"{coordinator.account_id}_{list_id}"
        self._attr_device_info = DeviceInfo(
            identifiers={_device_identifier(coordinator.account_id, list_id)},
            name=self._list.title if self._list else None,
            manufacturer="Listapp",
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def _list(self) -> ListAppList | None:
        return self.coordinator.data.get(self._list_id)

    @property
    def available(self) -> bool:
        return super().available and self._list is not None

    # Primary entity of a per-list device (see docs/architecture.md#entities): the friendly
    # name comes from the device name, not this entity's own name.
    _attr_name = None

    @property
    def extra_state_attributes(self) -> dict[str, str | None] | None:
        if self._list is None:
            return None
        return {
            ATTR_LIST_ID: self._list_id,
            ATTR_COLOR: self._list.color,
            ATTR_ICON: self._list.icon,
            ATTR_ROLE: self._list.my_role.lower() if self._list.my_role in KNOWN_ROLES else None,
        }

    @property
    def supported_features(self) -> TodoListEntityFeature:
        if self.coordinator.can_write_list(self._list_id):
            return WRITE_FEATURES
        return TodoListEntityFeature(0)

    @property
    def todo_items(self) -> list[TodoItem] | None:
        if self._list is None:
            return None
        return [
            TodoItem(
                uid=item.id,
                summary=item.content,
                status=TodoItemStatus.COMPLETED if item.is_checked else TodoItemStatus.NEEDS_ACTION,
            )
            for item in self._list.items
        ]

    def _item_ids(self) -> list[str]:
        return [item.id for item in self._list.items] if self._list else []

    async def _async_write(self, write: Callable[[], Awaitable[None]]) -> None:
        try:
            await write()
        except ListAppAuthError as err:
            self.coordinator.config_entry.async_start_reauth(self.hass)
            raise HomeAssistantError(
                translation_domain=DOMAIN, translation_key="auth_failed"
            ) from err
        except (ListAppForbiddenError, ListAppNotFoundError) as err:
            raise HomeAssistantError(
                translation_domain=DOMAIN, translation_key="write_refused"
            ) from err
        except ListAppError as err:
            raise HomeAssistantError(
                translation_domain=DOMAIN, translation_key="write_failed"
            ) from err
        finally:
            await self.coordinator.async_request_refresh()

    async def async_create_todo_item(self, item: TodoItem) -> None:
        items = self._list.items if self._list else []
        position = max((existing.position for existing in items), default=-1) + 1
        await self._async_write(
            lambda: self.coordinator.client.async_create_item(
                self._list_id, str(uuid4()), item.summary or "", position
            )
        )

    async def async_update_todo_item(self, item: TodoItem) -> None:
        assert item.uid is not None
        await self._async_write(
            lambda: self.coordinator.client.async_update_item(
                self._list_id,
                item.uid,
                content=item.summary,
                is_checked=item.status == TodoItemStatus.COMPLETED,
            )
        )

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        async def delete_all() -> None:
            for uid in uids:
                await self.coordinator.client.async_delete_item(self._list_id, uid)

        await self._async_write(delete_all)

    async def async_move_todo_item(self, uid: str, previous_uid: str | None = None) -> None:
        order = [item_id for item_id in self._item_ids() if item_id != uid]
        if previous_uid is None:
            index = 0
        else:
            try:
                index = order.index(previous_uid) + 1
            except ValueError as err:
                raise HomeAssistantError(
                    translation_domain=DOMAIN, translation_key="write_refused"
                ) from err
        order.insert(index, uid)
        await self._async_write(
            lambda: self.coordinator.client.async_reorder_items(self._list_id, order)
        )
