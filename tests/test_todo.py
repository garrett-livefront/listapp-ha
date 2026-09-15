import asyncio
import json
from datetime import timedelta
from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.todo import DOMAIN as TODO_DOMAIN
from homeassistant.config_entries import SOURCE_REAUTH
from homeassistant.const import ATTR_ENTITY_ID, ATTR_SUPPORTED_FEATURES
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.listapp.const import API_BASE_URL, CONF_READ_ONLY, DOMAIN, UPDATE_INTERVAL
from custom_components.listapp.stream import StreamEvent

from .conftest import register_lists
from .helpers import (
    ACCOUNT_ID,
    BREAD_ID,
    CHORES_ID,
    EGGS_ID,
    GROCERIES_ID,
    MILK_ID,
    READ_SCOPE,
    groceries,
    item_payload,
    list_change_event,
    list_payload,
    member_upserted_ref,
    todo_entity_id,
)

ITEMS_URL = f"{API_BASE_URL}/lists/{GROCERIES_ID}/items"


@pytest.fixture
def entity_id(hass: HomeAssistant, setup_integration: MockConfigEntry) -> str:
    entity_id = todo_entity_id(hass, GROCERIES_ID)
    assert entity_id is not None
    return entity_id


def _calls(aioclient_mock: AiohttpClientMocker, method: str) -> list[tuple]:
    return [call for call in aioclient_mock.mock_calls if call[0] == method]


async def _call(hass: HomeAssistant, service: str, entity_id: str, **data: Any) -> None:
    await hass.services.async_call(
        TODO_DOMAIN, service, data, target={ATTR_ENTITY_ID: entity_id}, blocking=True
    )


async def test_entity_state_and_items(hass: HomeAssistant, entity_id: str) -> None:
    state = hass.states.get(entity_id)
    assert entity_id == "todo.listapp_groceries"
    assert state.state == "2"
    assert state.attributes[ATTR_SUPPORTED_FEATURES] == 15

    response = await hass.services.async_call(
        TODO_DOMAIN,
        "get_items",
        target={ATTR_ENTITY_ID: entity_id},
        blocking=True,
        return_response=True,
    )

    items = response[entity_id]["items"]
    assert [item["summary"] for item in items] == ["Milk", "Bread", "Eggs"]
    assert items[2]["status"] == "completed"


async def test_create_item_appends(hass: HomeAssistant, entity_id: str, aioclient_mock) -> None:
    aioclient_mock.post(ITEMS_URL, status=201, json={})

    await _call(hass, "add_item", entity_id, item="Butter")

    body = _calls(aioclient_mock, "POST")[0][2]
    assert body["content"] == "Butter"
    assert body["position"] == 3
    assert len(body["id"]) == 36


async def test_update_item_checks_and_renames(
    hass: HomeAssistant, entity_id: str, aioclient_mock
) -> None:
    aioclient_mock.patch(f"{ITEMS_URL}/{MILK_ID}", json={})

    await _call(hass, "update_item", entity_id, item=MILK_ID, rename="Oat milk", status="completed")

    assert _calls(aioclient_mock, "PATCH")[0][2] == {"isChecked": True, "content": "Oat milk"}


async def test_delete_items(hass: HomeAssistant, entity_id: str, aioclient_mock) -> None:
    aioclient_mock.delete(f"{ITEMS_URL}/{MILK_ID}", status=204)
    aioclient_mock.delete(f"{ITEMS_URL}/{BREAD_ID}", status=204)

    await _call(hass, "remove_item", entity_id, item=[MILK_ID, BREAD_ID])

    assert len(_calls(aioclient_mock, "DELETE")) == 2


@pytest.mark.parametrize(
    ("previous_uid", "expected"),
    [(EGGS_ID, [BREAD_ID, EGGS_ID, MILK_ID]), (None, [MILK_ID, BREAD_ID, EGGS_ID])],
)
async def test_move_item(
    hass: HomeAssistant,
    entity_id: str,
    aioclient_mock,
    hass_ws_client,
    previous_uid: str | None,
    expected: list[str],
) -> None:
    aioclient_mock.put(f"{ITEMS_URL}/reorder", status=204)
    client = await hass_ws_client(hass)

    message = {"type": "todo/item/move", "entity_id": entity_id, "uid": MILK_ID}
    if previous_uid is not None:
        message["previous_uid"] = previous_uid
    await client.send_json_auto_id(message)
    response = await client.receive_json()

    assert response["success"]
    body = _calls(aioclient_mock, "PUT")[0][2]
    assert [item["id"] for item in body["items"]] == expected


@pytest.mark.parametrize("previous_uid", ["not-a-real-id", MILK_ID])
async def test_move_item_invalid_previous_uid_is_refused(
    hass: HomeAssistant, entity_id: str, aioclient_mock, hass_ws_client, previous_uid: str
) -> None:
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": "todo/item/move",
            "entity_id": entity_id,
            "uid": MILK_ID,
            "previous_uid": previous_uid,
        }
    )
    response = await client.receive_json()

    assert not response["success"]
    assert response["error"]["code"] == "failed"
    assert not _calls(aioclient_mock, "PUT")


@pytest.mark.parametrize(
    ("scope", "options"),
    [
        (READ_SCOPE, {}),
        ("offline_access lists:read lists:write", {CONF_READ_ONLY: True}),
        (None, {}),
    ],
)
async def test_read_only_refuses_writes(
    hass: HomeAssistant, entity_id: str, aioclient_mock
) -> None:
    assert hass.states.get(entity_id).attributes[ATTR_SUPPORTED_FEATURES] == 0

    with pytest.raises(ServiceValidationError):
        await _call(hass, "add_item", entity_id, item="Butter")

    assert not _calls(aioclient_mock, "POST")


@pytest.mark.parametrize(
    ("status", "translation_key"),
    [(404, "write_refused"), (403, "write_refused"), (503, "write_failed"), (401, "auth_failed")],
)
async def test_write_errors(
    hass: HomeAssistant, entity_id: str, aioclient_mock, status: int, translation_key: str
) -> None:
    aioclient_mock.post(ITEMS_URL, status=status)

    with pytest.raises(HomeAssistantError) as exc_info:
        await _call(hass, "add_item", entity_id, item="Butter")

    assert exc_info.value.translation_key == translation_key
    reauth = [
        flow
        for flow in hass.config_entries.flow.async_progress()
        if flow["context"]["source"] == SOURCE_REAUTH
    ]
    assert bool(reauth) is (status == 401)


@pytest.mark.parametrize(
    ("role", "read_only_option", "expected_features"),
    [
        ("OWNER", False, 15),
        ("EDITOR", False, 15),
        ("VIEWER", False, 0),
        ("OWNER", True, 0),
        ("EDITOR", True, 0),
        ("VIEWER", True, 0),
        (None, False, 15),  # missing myRole: fall back to H2, don't restrict up front
    ],
)
async def test_supported_features_follow_role_and_read_only_option(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    config_entry: MockConfigEntry,
    role: str | None,
    read_only_option: bool,
    expected_features: int,
) -> None:
    config_entry.add_to_hass(hass)
    hass.config_entries.async_update_entry(config_entry, options={CONF_READ_ONLY: read_only_option})
    register_lists(aioclient_mock, [list_payload(GROCERIES_ID, "Groceries", [], my_role=role)])
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    state = hass.states.get(todo_entity_id(hass, GROCERIES_ID))
    assert state.attributes[ATTR_SUPPORTED_FEATURES] == expected_features


async def test_viewer_write_refused_without_api_call(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    config_entry: MockConfigEntry,
) -> None:
    items = [item_payload(MILK_ID, "Milk", 0)]
    register_lists(
        aioclient_mock, [list_payload(GROCERIES_ID, "Groceries", items, my_role="VIEWER")]
    )
    config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    entity_id = todo_entity_id(hass, GROCERIES_ID)
    aioclient_mock.clear_requests()

    with pytest.raises(ServiceValidationError):
        await _call(hass, "add_item", entity_id, item="Butter")

    assert not aioclient_mock.mock_calls


async def test_role_demotion_updates_supported_features(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    config_entry: MockConfigEntry,
) -> None:
    register_lists(aioclient_mock, [list_payload(GROCERIES_ID, "Groceries", [], my_role="EDITOR")])
    config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    entity_id = todo_entity_id(hass, GROCERIES_ID)
    assert hass.states.get(entity_id).attributes[ATTR_SUPPORTED_FEATURES] == 15

    coordinator = config_entry.runtime_data
    coordinator._handle_stream_event(
        StreamEvent(
            event="member.upserted",
            data=json.dumps(
                list_change_event(
                    "member.upserted",
                    GROCERIES_ID,
                    member_upserted_ref("membership-1", ACCOUNT_ID, "VIEWER"),
                )
            ),
        )
    )
    await asyncio.sleep(0.6)
    await hass.async_block_till_done()

    assert hass.states.get(entity_id).attributes[ATTR_SUPPORTED_FEATURES] == 0


@pytest.mark.parametrize(
    ("role", "expected_role", "color", "icon"),
    [
        ("OWNER", "owner", "#ff0000", "shopping-cart"),
        ("EDITOR", "editor", None, None),
        ("VIEWER", "viewer", "#00ff00", None),
        (None, None, None, "list"),
    ],
)
async def test_extra_state_attributes(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    config_entry: MockConfigEntry,
    role: str | None,
    expected_role: str | None,
    color: str | None,
    icon: str | None,
) -> None:
    register_lists(
        aioclient_mock,
        [list_payload(GROCERIES_ID, "Groceries", [], my_role=role, color=color, icon=icon)],
    )
    config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    state = hass.states.get(todo_entity_id(hass, GROCERIES_ID))
    assert state.attributes["list_id"] == GROCERIES_ID
    assert state.attributes["color"] == color
    assert state.attributes["icon"] == icon
    assert state.attributes["role"] == expected_role


async def test_extra_state_attributes_update_after_refresh(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    config_entry: MockConfigEntry,
) -> None:
    register_lists(aioclient_mock, [list_payload(GROCERIES_ID, "Groceries", [])])
    config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    entity_id = todo_entity_id(hass, GROCERIES_ID)
    assert hass.states.get(entity_id).attributes["color"] is None

    aioclient_mock.clear_requests()
    aioclient_mock.get(
        f"{API_BASE_URL}/lists/{GROCERIES_ID}",
        json=list_payload(GROCERIES_ID, "Groceries", [], color="#123456", icon="cart"),
    )
    await config_entry.runtime_data.async_request_refresh()
    await hass.async_block_till_done()

    assert hass.states.get(entity_id).attributes["color"] == "#123456"
    assert hass.states.get(entity_id).attributes["icon"] == "cart"


async def test_extra_state_attributes_update_from_stream_event(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    config_entry: MockConfigEntry,
) -> None:
    register_lists(aioclient_mock, [list_payload(GROCERIES_ID, "Groceries", [])])
    config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    entity_id = todo_entity_id(hass, GROCERIES_ID)
    coordinator = config_entry.runtime_data

    summary = {
        k: v
        for k, v in list_payload(
            GROCERIES_ID, "Groceries", [], color="#abcdef", icon="basket"
        ).items()
        if k != "items"
    }
    summary["myRole"] = None
    coordinator._handle_stream_event(
        StreamEvent(
            event="list.updated",
            data=json.dumps(list_change_event("list.updated", GROCERIES_ID, summary)),
        )
    )
    await asyncio.sleep(0.6)
    await hass.async_block_till_done()

    assert hass.states.get(entity_id).attributes["color"] == "#abcdef"
    assert hass.states.get(entity_id).attributes["icon"] == "basket"


async def test_list_removed_on_poll_404(
    hass: HomeAssistant,
    entity_id: str,
    aioclient_mock: AiohttpClientMocker,
    freezer: FrozenDateTimeFactory,
) -> None:
    # A selected list can vanish between polls (deleted, or access revoked); the poll
    # already skips 404s (test_list_gone_between_requests_is_skipped), and this is that
    # same behavior for the safety-net poll, not the initial fetch.
    aioclient_mock.clear_requests()
    aioclient_mock.get(f"{API_BASE_URL}/lists/{GROCERIES_ID}", status=404)
    await hass.config_entries.async_entries(DOMAIN)[0].runtime_data.async_stop_stream()

    freezer.tick(UPDATE_INTERVAL + timedelta(seconds=1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert todo_entity_id(hass, GROCERIES_ID) is None
    assert hass.states.get(entity_id) is None
    assert GROCERIES_ID not in hass.config_entries.async_entries(DOMAIN)[0].runtime_data._active_ids


async def test_orphan_from_previous_run_is_removed(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, config_entry: MockConfigEntry
) -> None:
    config_entry.add_to_hass(hass)
    registry = er.async_get(hass)
    registry.async_get_or_create(
        TODO_DOMAIN, DOMAIN, f"{ACCOUNT_ID}_{CHORES_ID}", config_entry=config_entry
    )
    register_lists(aioclient_mock, [groceries()])

    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert todo_entity_id(hass, CHORES_ID) is None
    assert todo_entity_id(hass, GROCERIES_ID) is not None


async def test_list_gone_between_requests_is_skipped(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, config_entry: MockConfigEntry
) -> None:
    summaries = [{"id": GROCERIES_ID}, {"id": CHORES_ID}]
    aioclient_mock.get(f"{API_BASE_URL}/lists", json=summaries)
    aioclient_mock.get(f"{API_BASE_URL}/lists/{GROCERIES_ID}", json=groceries())
    aioclient_mock.get(f"{API_BASE_URL}/lists/{CHORES_ID}", status=404)
    aioclient_mock.get(f"{API_BASE_URL}/me/events/selected", content=b"")

    config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert todo_entity_id(hass, GROCERIES_ID) is not None
    assert todo_entity_id(hass, CHORES_ID) is None
