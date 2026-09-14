import asyncio
import json

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.listapp.const import (
    POLL_INTERVAL_FALLBACK,
    POLL_INTERVAL_STREAMING,
)
from custom_components.listapp.stream import StreamEvent

from .helpers import ACCOUNT_ID, BREAD_ID, GROCERIES_ID, MILK_ID, OTHER_ACCOUNT_ID


async def _emit(coordinator, event: str, payload: dict) -> None:
    coordinator._handle_stream_event(StreamEvent(event=event, data=json.dumps(payload)))


async def test_stream_already_started_after_setup(setup_integration: MockConfigEntry) -> None:
    coordinator = setup_integration.runtime_data
    assert coordinator._stream is not None


async def test_item_upserted_and_batching_coalesces(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    updates = []
    coordinator.async_add_listener(lambda: updates.append(dict(coordinator.data)))

    await _emit(
        coordinator,
        "item.upserted",
        {
            "id": "9c2e0000-0000-4000-8000-000000000099",
            "listId": GROCERIES_ID,
            "content": "Butter",
            "isChecked": False,
            "position": 5,
        },
    )
    await _emit(
        coordinator,
        "item.deleted",
        {"id": MILK_ID, "listId": GROCERIES_ID},
    )
    assert not updates

    await asyncio.sleep(0.6)

    assert len(updates) == 1
    items = {item.id: item for item in updates[0][GROCERIES_ID].items}
    assert "9c2e0000-0000-4000-8000-000000000099" in items
    assert MILK_ID not in items


async def test_items_reordered(hass: HomeAssistant, setup_integration: MockConfigEntry) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(
        coordinator,
        "items.reordered",
        {
            "listId": GROCERIES_ID,
            "items": [{"id": MILK_ID, "position": 9}, {"id": BREAD_ID, "position": 0}],
        },
    )
    await asyncio.sleep(0.6)

    items = coordinator.data[GROCERIES_ID].items
    assert items[0].id == BREAD_ID
    assert items[-1].id == MILK_ID


async def test_list_updated_renames(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(
        coordinator,
        "list.updated",
        {"id": GROCERIES_ID, "title": "Shopping", "ownerId": ACCOUNT_ID},
    )
    await asyncio.sleep(0.6)

    assert coordinator.data[GROCERIES_ID].title == "Shopping"


async def test_list_deleted_removes_list(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(coordinator, "list.deleted", {"id": GROCERIES_ID})
    await asyncio.sleep(0.6)

    assert GROCERIES_ID not in coordinator.data
    assert GROCERIES_ID not in coordinator._active_ids


async def test_member_deleted_for_self_removes_list(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(coordinator, "member.deleted", {"listId": GROCERIES_ID, "userId": ACCOUNT_ID})
    await asyncio.sleep(0.6)

    assert GROCERIES_ID not in coordinator.data


async def test_member_deleted_for_other_user_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(coordinator, "member.deleted", {"listId": GROCERIES_ID, "userId": OTHER_ACCOUNT_ID})
    await asyncio.sleep(0.6)

    assert GROCERIES_ID in coordinator.data


async def test_unknown_event_type_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    coordinator._handle_stream_event(StreamEvent(event="member.upserted", data="{}"))
    await asyncio.sleep(0.6)
    # No crash, no pending batch left dangling.
    assert coordinator._pending is None


async def test_unparsable_payload_is_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    coordinator._handle_stream_event(StreamEvent(event="item.deleted", data="not json"))
    await asyncio.sleep(0.6)
    assert coordinator._pending is None


async def test_stream_state_change_switches_poll_interval(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    coordinator._handle_stream_state_change(True)
    assert coordinator.update_interval == POLL_INTERVAL_STREAMING

    coordinator._handle_stream_state_change(False)
    assert coordinator.update_interval == POLL_INTERVAL_FALLBACK


async def test_unload_cancels_stream_task(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    stream = coordinator._stream
    assert stream is not None

    assert await hass.config_entries.async_unload(setup_integration.entry_id)

    assert stream._task is None
    assert coordinator._stream is None
