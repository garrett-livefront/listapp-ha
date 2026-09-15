import asyncio
import json
from dataclasses import replace

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.listapp.const import (
    API_BASE_URL,
    CONF_SELECTED_LISTS,
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
    # myRole is explicitly null on list.updated (not merely absent) — see
    # docs/architecture.md#roles.
    summary = {k: v for k, v in list_payload(GROCERIES_ID, "Shopping", []).items() if k != "items"}
    summary["myRole"] = None
    await _emit(coordinator, "list.updated", GROCERIES_ID, summary)
    await asyncio.sleep(0.6)

    assert coordinator.data[GROCERIES_ID].title == "Shopping"
    assert coordinator.data[GROCERIES_ID].items
    assert coordinator.data[GROCERIES_ID].my_role == "OWNER"


async def test_list_updated_changes_color_and_icon(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    assert coordinator.data[GROCERIES_ID].color is None
    assert coordinator.data[GROCERIES_ID].icon is None
    summary = {
        k: v
        for k, v in list_payload(
            GROCERIES_ID, "Groceries", [], color="#ff0000", icon="shopping-cart"
        ).items()
        if k != "items"
    }
    summary["myRole"] = None
    await _emit(coordinator, "list.updated", GROCERIES_ID, summary)
    await asyncio.sleep(0.6)

    assert coordinator.data[GROCERIES_ID].color == "#ff0000"
    assert coordinator.data[GROCERIES_ID].icon == "shopping-cart"


async def test_list_updated_preserves_color_and_icon_when_keys_absent(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    summary = {
        k: v
        for k, v in list_payload(
            GROCERIES_ID, "Groceries", [], color="#ff0000", icon="shopping-cart"
        ).items()
        if k != "items"
    }
    summary["myRole"] = None
    await _emit(coordinator, "list.updated", GROCERIES_ID, summary)
    await asyncio.sleep(0.6)
    assert coordinator.data[GROCERIES_ID].color == "#ff0000"
    assert coordinator.data[GROCERIES_ID].icon == "shopping-cart"

    # A payload that omits color/icon entirely (older or partial event) must not
    # be treated as clearing them.
    partial = {k: v for k, v in summary.items() if k not in ("color", "icon")}
    await _emit(coordinator, "list.updated", GROCERIES_ID, partial)
    await asyncio.sleep(0.6)

    assert coordinator.data[GROCERIES_ID].color == "#ff0000"
    assert coordinator.data[GROCERIES_ID].icon == "shopping-cart"


async def test_list_updated_clears_color_and_icon_on_explicit_null(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    summary = {
        k: v
        for k, v in list_payload(
            GROCERIES_ID, "Groceries", [], color="#ff0000", icon="shopping-cart"
        ).items()
        if k != "items"
    }
    summary["myRole"] = None
    await _emit(coordinator, "list.updated", GROCERIES_ID, summary)
    await asyncio.sleep(0.6)
    assert coordinator.data[GROCERIES_ID].color == "#ff0000"

    cleared = {**summary, "color": None, "icon": None}
    await _emit(coordinator, "list.updated", GROCERIES_ID, cleared)
    await asyncio.sleep(0.6)

    assert coordinator.data[GROCERIES_ID].color is None
    assert coordinator.data[GROCERIES_ID].icon is None


async def test_stale_poll_cannot_revert_a_color_icon_update(
    hass: HomeAssistant, setup_integration: MockConfigEntry, monkeypatch
) -> None:
    """A poll already fetching when list.updated arrives can't overwrite its color/icon.

    Same in-flight-poll race as role demotions — Copilot review comment on PR #13, see
    docs/architecture.md#roles.
    """
    coordinator = setup_integration.runtime_data
    stale = coordinator.data[GROCERIES_ID]
    assert stale.color is None
    assert stale.icon is None

    async def get_list(list_id: str):
        summary = {
            k: v
            for k, v in list_payload(
                GROCERIES_ID, "Groceries", [], color="#ff0000", icon="shopping-cart"
            ).items()
            if k != "items"
        }
        summary["myRole"] = None
        await _emit(coordinator, "list.updated", GROCERIES_ID, summary)
        await asyncio.sleep(0.6)
        return stale

    monkeypatch.setattr(coordinator.client, "async_get_list", get_list)

    result = await coordinator._async_update_data()

    assert result[GROCERIES_ID].color == "#ff0000"
    assert result[GROCERIES_ID].icon == "shopping-cart"


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


async def test_stream_stops_quietly_when_selection_empties(
    hass: HomeAssistant,
    setup_integration: MockConfigEntry,
    mock_api: AiohttpClientMocker,
    caplog,
) -> None:
    # The stream is already running with STREAM_BACKOFF_INITIAL_SECONDS (1s) captured at
    # start, so this waits out a real reconnect cycle rather than patching the backoff.
    coordinator = setup_integration.runtime_data
    calls_before = len(mock_api.mock_calls)

    await _emit(coordinator, "list.deleted", GROCERIES_ID, deleted_ref(GROCERIES_ID))
    with caplog.at_level("DEBUG"):
        await asyncio.sleep(1.6)

    assert coordinator._active_ids == set()
    stream_calls = [
        call for call in mock_api.mock_calls[calls_before:] if "events/selected" in str(call[1])
    ]
    assert stream_calls == []
    assert not any(record.levelname == "ERROR" for record in caplog.records)
    assert coordinator._stream._task is not None and coordinator._stream._task.done()


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


async def test_stream_stops_quietly_when_last_member_removed(
    hass: HomeAssistant,
    setup_integration: MockConfigEntry,
    mock_api: AiohttpClientMocker,
) -> None:
    coordinator = setup_integration.runtime_data
    calls_before = len(mock_api.mock_calls)

    await _emit(
        coordinator, "member.deleted", GROCERIES_ID, member_deleted_ref(MEMBERSHIP_ID, ACCOUNT_ID)
    )
    await asyncio.sleep(1.6)

    assert coordinator._active_ids == set()
    stream_calls = [
        call for call in mock_api.mock_calls[calls_before:] if "events/selected" in str(call[1])
    ]
    assert stream_calls == []


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


async def test_member_upserted_for_already_removed_list_ignored(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    """A late member.upserted for a list already gone doesn't schedule a refresh or set an
    override.

    Copilot review comment on PR #5 — see docs/architecture.md#roles.
    """
    coordinator = setup_integration.runtime_data
    await _emit(coordinator, "list.deleted", GROCERIES_ID, deleted_ref(GROCERIES_ID))
    await _emit(
        coordinator,
        "member.upserted",
        GROCERIES_ID,
        member_upserted_ref(MEMBERSHIP_ID, ACCOUNT_ID, "VIEWER"),
    )
    await asyncio.sleep(0.6)

    assert GROCERIES_ID not in coordinator.data
    assert coordinator._role_overrides == {}
    assert coordinator._pending_role_refresh is False


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
    await coordinator.async_stop_stream()
    await hass.async_block_till_done(wait_background_tasks=True)

    assert coordinator.data[GROCERIES_ID].my_role == "EDITOR"


async def test_stale_poll_cannot_revert_a_demotion(
    hass: HomeAssistant, setup_integration: MockConfigEntry, monkeypatch
) -> None:
    """A poll already fetching when a demotion event arrives can't overwrite it.

    Copilot review comment on PR #5 — see docs/architecture.md#roles.
    """
    coordinator = setup_integration.runtime_data
    stale = coordinator.data[GROCERIES_ID]
    assert stale.my_role == "OWNER"

    async def get_list(list_id: str):
        # The event lands while this fetch (started before it) is still in flight.
        await _emit(
            coordinator,
            "member.upserted",
            GROCERIES_ID,
            member_upserted_ref(MEMBERSHIP_ID, ACCOUNT_ID, "VIEWER"),
        )
        await asyncio.sleep(0.6)
        return stale

    monkeypatch.setattr(coordinator.client, "async_get_list", get_list)

    result = await coordinator._async_update_data()

    assert result[GROCERIES_ID].my_role == "VIEWER"


async def test_poll_started_after_the_event_wins_outright(
    hass: HomeAssistant, setup_integration: MockConfigEntry, aioclient_mock
) -> None:
    """A poll that starts after the event is trusted even if it disagrees.

    Otherwise a missed follow-up event (a later promotion) would leave the coordinator stuck
    contradicting the server forever. See docs/architecture.md#roles.
    """
    coordinator = setup_integration.runtime_data
    await _emit(
        coordinator,
        "member.upserted",
        GROCERIES_ID,
        member_upserted_ref(MEMBERSHIP_ID, ACCOUNT_ID, "VIEWER"),
    )
    await asyncio.sleep(0.6)
    assert coordinator.data[GROCERIES_ID].my_role == "VIEWER"

    aioclient_mock.clear_requests()
    aioclient_mock.get(
        f"{coordinator.client.base_url}/lists/{GROCERIES_ID}",
        json=list_payload(GROCERIES_ID, "Groceries", [], my_role="EDITOR"),
    )
    result = await coordinator._async_update_data()

    assert result[GROCERIES_ID].my_role == "EDITOR"
    assert coordinator._role_overrides == {}


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


async def test_periodic_poll_401_triggers_reauth(
    hass: HomeAssistant, setup_integration: MockConfigEntry, aioclient_mock
) -> None:
    from homeassistant.exceptions import ConfigEntryAuthFailed

    coordinator = setup_integration.runtime_data
    aioclient_mock.clear_requests()
    aioclient_mock.get(f"{API_BASE_URL}/lists/{GROCERIES_ID}", status=401)

    with pytest.raises(ConfigEntryAuthFailed):
        await coordinator._async_update_data()


async def test_periodic_poll_5xx_raises_update_failed(
    hass: HomeAssistant, setup_integration: MockConfigEntry, aioclient_mock
) -> None:
    from homeassistant.helpers.update_coordinator import UpdateFailed

    coordinator = setup_integration.runtime_data
    aioclient_mock.clear_requests()
    aioclient_mock.get(f"{API_BASE_URL}/lists/{GROCERIES_ID}", status=503)

    with pytest.raises(UpdateFailed):
        await coordinator._async_update_data()


async def test_stop_stream_with_pending_batch_cancels_cleanly(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    coordinator = setup_integration.runtime_data
    await _emit(coordinator, "item.deleted", GROCERIES_ID, deleted_ref(MILK_ID))
    assert coordinator._batch_handle is not None

    await coordinator.async_stop_stream()

    assert coordinator._batch_handle is None
    assert coordinator._pending == []
    assert coordinator._stream is None


async def test_start_stream_skips_when_no_active_lists(
    hass: HomeAssistant, config_entry: MockConfigEntry, aioclient_mock, caplog
) -> None:
    config_entry.add_to_hass(hass)
    hass.config_entries.async_update_entry(config_entry, options={CONF_SELECTED_LISTS: []})
    aioclient_mock.get(f"{API_BASE_URL}/lists", json=[])

    with caplog.at_level("ERROR"):
        assert await hass.config_entries.async_setup(config_entry.entry_id)
        await hass.async_block_till_done()

    coordinator = config_entry.runtime_data
    assert coordinator._stream is None
    assert "rejected the selected lists" not in caplog.text
