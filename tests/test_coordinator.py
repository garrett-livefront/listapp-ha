import asyncio
import json
from dataclasses import replace

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.listapp.const import (
    POLL_INTERVAL_FALLBACK,
    POLL_INTERVAL_STREAMING,
)
from custom_components.listapp.stream import StreamEvent, parse_sse

from .helpers import (
    ACCOUNT_ID,
    BREAD_ID,
    GROCERIES_ID,
    LIST_CHANGE_EVENT_FIELDS,
    MILK_ID,
    OTHER_ACCOUNT_ID,
    deleted_ref,
    item_payload,
    ktor_sse_frame,
    list_change_event,
    list_payload,
    member_deleted_ref,
    member_upserted_ref,
    reordered_items_ref,
)

BUTTER_ID = "9c2e0000-0000-4000-8000-000000000099"
MEMBERSHIP_ID = "5a5a0000-0000-4000-8000-000000000001"


async def _emit(coordinator, event_type: str, list_id: str, payload: dict) -> None:
    envelope = list_change_event(event_type, list_id, payload)
    coordinator._handle_stream_event(StreamEvent(event=event_type, data=json.dumps(envelope)))


class _FakeContent:
    def __init__(self, data: bytes) -> None:
        self._lines = data.splitlines(keepends=True)

    async def readline(self) -> bytes:
        return self._lines.pop(0) if self._lines else b""


def test_envelope_matches_server_field_names() -> None:
    assert tuple(list_change_event("item.deleted", GROCERIES_ID, {})) == LIST_CHANGE_EVENT_FIELDS


async def test_stream_already_started_after_setup(setup_integration: MockConfigEntry) -> None:
    coordinator = setup_integration.runtime_data
    assert coordinator._stream is not None


async def test_item_upserted_and_batching_coalesces(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    updates = []
    coordinator.async_add_listener(lambda: updates.append(dict(coordinator.data)))

    await _emit(coordinator, "item.upserted", GROCERIES_ID, item_payload(BUTTER_ID, "Butter", 5))
    await _emit(coordinator, "item.deleted", GROCERIES_ID, deleted_ref(MILK_ID))
    assert not updates

    await asyncio.sleep(0.6)

    assert len(updates) == 1
    items = {item.id: item for item in updates[0][GROCERIES_ID].items}
    assert BUTTER_ID in items
    assert MILK_ID not in items


async def test_ktor_encoded_frames_apply_end_to_end(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    raw = (
        b": heartbeat\r\n\r\n"
        + ktor_sse_frame("item.deleted", GROCERIES_ID, deleted_ref(MILK_ID))
        + ktor_sse_frame("items.reordered", GROCERIES_ID, reordered_items_ref([(BREAD_ID, 9)]))
    )
    async for event in parse_sse(_FakeContent(raw)):
        coordinator._handle_stream_event(event)
    await asyncio.sleep(0.6)

    items = coordinator.data[GROCERIES_ID].items
    assert MILK_ID not in {item.id for item in items}
    assert items[-1].id == BREAD_ID


async def test_items_reordered(hass: HomeAssistant, setup_integration: MockConfigEntry) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(
        coordinator,
        "items.reordered",
        GROCERIES_ID,
        reordered_items_ref([(MILK_ID, 9), (BREAD_ID, 0)]),
    )
    await asyncio.sleep(0.6)

    items = coordinator.data[GROCERIES_ID].items
    assert items[0].id == BREAD_ID
    assert items[-1].id == MILK_ID


async def test_list_updated_renames(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    assert coordinator.data[GROCERIES_ID].my_role == "OWNER"
    # myRole is null on list.updated — see docs/architecture.md#roles.
    summary = {
        k: v
        for k, v in list_payload(GROCERIES_ID, "Shopping", [], my_role=None).items()
        if k != "items"
    }
    await _emit(coordinator, "list.updated", GROCERIES_ID, summary)
    await asyncio.sleep(0.6)

    assert coordinator.data[GROCERIES_ID].title == "Shopping"
    assert coordinator.data[GROCERIES_ID].items
    assert coordinator.data[GROCERIES_ID].my_role == "OWNER"


async def test_event_for_unselected_list_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    before = coordinator.data
    other = "1f7b0000-0000-4000-8000-0000000000ff"
    await _emit(coordinator, "item.deleted", other, deleted_ref(MILK_ID))
    await _emit(coordinator, "items.reordered", other, reordered_items_ref([]))
    await _emit(coordinator, "item.upserted", other, item_payload(BUTTER_ID, "Butter", 1))
    await _emit(coordinator, "list.updated", other, list_payload(other, "X", []))
    await asyncio.sleep(0.6)

    assert coordinator.data == before


async def test_poll_drops_list_removed_while_in_flight(
    hass: HomeAssistant, setup_integration: MockConfigEntry, monkeypatch
) -> None:
    coordinator = setup_integration.runtime_data
    fetched = coordinator.data[GROCERIES_ID]

    async def get_list(list_id: str):
        await _emit(coordinator, "list.deleted", GROCERIES_ID, deleted_ref(GROCERIES_ID))
        await asyncio.sleep(0.6)
        return fetched

    monkeypatch.setattr(coordinator.client, "async_get_list", get_list)

    assert await coordinator._async_update_data() == {}


async def test_list_deleted_removes_list(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(coordinator, "list.deleted", GROCERIES_ID, deleted_ref(GROCERIES_ID))
    await asyncio.sleep(0.6)

    assert GROCERIES_ID not in coordinator.data
    assert GROCERIES_ID not in coordinator._active_ids


async def test_member_deleted_for_self_removes_list(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(
        coordinator, "member.deleted", GROCERIES_ID, member_deleted_ref(MEMBERSHIP_ID, ACCOUNT_ID)
    )
    await asyncio.sleep(0.6)

    assert GROCERIES_ID not in coordinator.data


async def test_member_deleted_for_other_user_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    for user_id in (OTHER_ACCOUNT_ID, None):
        await _emit(
            coordinator, "member.deleted", GROCERIES_ID, member_deleted_ref(MEMBERSHIP_ID, user_id)
        )
    await asyncio.sleep(0.6)

    assert GROCERIES_ID in coordinator.data


async def test_unknown_event_type_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    coordinator._handle_stream_event(StreamEvent(event="list.muted", data="{}"))
    await asyncio.sleep(0.6)
    assert coordinator._pending == []


async def test_member_upserted_for_self_updates_role(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(
        coordinator,
        "member.upserted",
        GROCERIES_ID,
        member_upserted_ref(MEMBERSHIP_ID, ACCOUNT_ID, "VIEWER"),
    )
    await asyncio.sleep(0.6)

    assert coordinator.data[GROCERIES_ID].my_role == "VIEWER"


async def test_member_upserted_for_other_user_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(
        coordinator,
        "member.upserted",
        GROCERIES_ID,
        member_upserted_ref(MEMBERSHIP_ID, OTHER_ACCOUNT_ID, "VIEWER"),
    )
    await asyncio.sleep(0.6)

    assert coordinator.data[GROCERIES_ID].my_role == "OWNER"


async def test_member_upserted_without_role_schedules_refresh(
    hass: HomeAssistant, setup_integration: MockConfigEntry, aioclient_mock
) -> None:
    coordinator = setup_integration.runtime_data
    aioclient_mock.clear_requests()
    aioclient_mock.get(
        f"{coordinator.client.base_url}/lists/{GROCERIES_ID}",
        json=list_payload(GROCERIES_ID, "Groceries", [], my_role="EDITOR"),
    )
    await _emit(
        coordinator,
        "member.upserted",
        GROCERIES_ID,
        member_upserted_ref(MEMBERSHIP_ID, ACCOUNT_ID, None),
    )
    await asyncio.sleep(0.6)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert coordinator.data[GROCERIES_ID].my_role == "EDITOR"


async def test_malformed_frames_are_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    other_list = "1f7b0000-0000-4000-8000-0000000000ff"
    frames = [
        ("item.deleted", "not json"),
        ("item.deleted", "[]"),
        ("item.deleted", json.dumps(deleted_ref(MILK_ID))),
        ("member.deleted", json.dumps(list_change_event("member.deleted", GROCERIES_ID, []))),
        ("list.deleted", json.dumps(list_change_event("list.deleted", GROCERIES_ID, []))),
        (
            "list.deleted",
            json.dumps(list_change_event("list.deleted", GROCERIES_ID, deleted_ref(other_list))),
        ),
    ]
    for event_type, data in frames:
        coordinator._handle_stream_event(StreamEvent(event=event_type, data=data))
    await asyncio.sleep(0.6)
    assert MILK_ID in {item.id for item in coordinator.data[GROCERIES_ID].items}
    assert GROCERIES_ID in coordinator._active_ids
    assert coordinator._pending == []


async def test_batch_replays_onto_data_from_a_poll_mid_batch(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(coordinator, "item.deleted", GROCERIES_ID, deleted_ref(MILK_ID))
    polled = replace(coordinator.data[GROCERIES_ID], title="Renamed by poll")
    coordinator.async_set_updated_data({GROCERIES_ID: polled})
    await asyncio.sleep(0.6)

    lst = coordinator.data[GROCERIES_ID]
    assert lst.title == "Renamed by poll"
    assert MILK_ID not in {item.id for item in lst.items}


async def test_stream_state_change_switches_and_reschedules_poll(
    hass: HomeAssistant, setup_integration: MockConfigEntry, monkeypatch
) -> None:
    coordinator = setup_integration.runtime_data
    coordinator._handle_stream_state_change(False)
    reschedules = []
    monkeypatch.setattr(coordinator, "_schedule_refresh", lambda: reschedules.append(1))

    coordinator._handle_stream_state_change(True)
    assert coordinator.update_interval == POLL_INTERVAL_STREAMING
    coordinator._handle_stream_state_change(True)
    coordinator._handle_stream_state_change(False)
    assert coordinator.update_interval == POLL_INTERVAL_FALLBACK

    assert len(reschedules) == 2


async def test_unload_cancels_stream_task(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    stream = coordinator._stream
    assert stream is not None

    assert await hass.config_entries.async_unload(setup_integration.entry_id)

    assert stream._task is None
    assert coordinator._stream is None
