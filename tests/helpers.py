import json
from typing import Any

from homeassistant.components.todo import DOMAIN as TODO_DOMAIN
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntry

from custom_components.listapp.const import DOMAIN

ACCOUNT_ID = "7de0c4b8-1111-4000-8000-000000000001"
OTHER_ACCOUNT_ID = "7de0c4b8-2222-4000-8000-000000000002"
GROCERIES_ID = "1f7b0000-0000-4000-8000-00000000000a"
CHORES_ID = "1f7b0000-0000-4000-8000-00000000000b"
MILK_ID = "9c2e0000-0000-4000-8000-000000000001"
BREAD_ID = "9c2e0000-0000-4000-8000-000000000002"
EGGS_ID = "9c2e0000-0000-4000-8000-000000000003"

FULL_SCOPE = "offline_access lists:read lists:write"
READ_SCOPE = "offline_access lists:read"

ME = {"id": ACCOUNT_ID, "email": "sam@example.com", "displayName": "Sam"}


def item_payload(item_id: str, content: str, position: int, checked: bool = False) -> dict:
    return {
        "id": item_id,
        "listId": GROCERIES_ID,
        "content": content,
        "isChecked": checked,
        "position": position,
        "priority": "NONE",
        "createdAt": "2026-09-01T00:00:00Z",
        "updatedAt": "2026-09-01T00:00:00Z",
    }


def list_payload(
    list_id: str,
    title: str,
    items: list[dict[str, Any]],
    my_role: str | None = "OWNER",
    color: str | None = None,
    icon: str | None = None,
) -> dict:
    payload = {
        "id": list_id,
        "ownerId": ACCOUNT_ID,
        "ownerDisplayName": "Sam",
        "ownerAvatarColor": None,
        "title": title,
        "color": color,
        "icon": icon,
        "createdAt": "2026-09-01T00:00:00Z",
        "updatedAt": "2026-09-01T00:00:00Z",
        "editorsCanManageSharing": False,
        "members": [],
        "items": items,
    }
    if my_role is not None:
        payload["myRole"] = my_role
    return payload


# Server event shapes, keyed exactly as listapp-api serializes them (hacs-integration):
# ListChangeEvent/DeletedRef/MemberDeletedRef/ReorderedItemsRef in services/ListEventBus.kt,
# ReorderItem in models/dto/ListItemDto.kt. AppJson has no naming strategy and prettyPrint on.
LIST_CHANGE_EVENT_FIELDS = ("listId", "type", "payload", "originUserId", "updatedAt")


def list_change_event(event_type: str, list_id: str, payload: dict) -> dict:
    return {
        "listId": list_id,
        "type": event_type,
        "payload": payload,
        "originUserId": OTHER_ACCOUNT_ID,
        "updatedAt": "2026-09-01T00:00:00Z",
    }


def deleted_ref(ref_id: str) -> dict:
    return {"id": ref_id}


def member_deleted_ref(member_id: str, user_id: str | None) -> dict:
    return {"id": member_id, "userId": user_id}


def member_upserted_ref(member_id: str, user_id: str | None, role: str | None) -> dict:
    ref = {"id": member_id, "userId": user_id}
    if role is not None:
        ref["role"] = role
    return ref


def reordered_items_ref(positions: list[tuple[str, int]]) -> dict:
    return {"items": [{"id": item_id, "position": position} for item_id, position in positions]}


def ktor_sse_frame(event_type: str, list_id: str, payload: dict) -> bytes:
    """Encode a frame the way Ktor's ServerSentEvent.toString does: data first, split per line."""
    data = json.dumps(list_change_event(event_type, list_id, payload), indent=4)
    lines = [f"data: {line}\r\n" for line in data.split("\n")]
    return ("".join(lines) + f"event: {event_type}\r\n\r\n").encode()


def groceries() -> dict:
    return list_payload(
        GROCERIES_ID,
        "Groceries",
        [
            item_payload(BREAD_ID, "Bread", 1),
            item_payload(MILK_ID, "Milk", 0),
            item_payload(EGGS_ID, "Eggs", 2, checked=True),
        ],
    )


def todo_entity_id(hass: HomeAssistant, list_id: str) -> str | None:
    return er.async_get(hass).async_get_entity_id(TODO_DOMAIN, DOMAIN, f"{ACCOUNT_ID}_{list_id}")


def list_device(hass: HomeAssistant, config_entry_id: str, list_id: str) -> DeviceEntry | None:
    return dr.async_get(hass).async_get_device_by_identifier(
        (DOMAIN, f"{ACCOUNT_ID}_{list_id}"), config_entry_id
    )
