from typing import Any

from homeassistant.components.todo import DOMAIN as TODO_DOMAIN
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

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


def list_payload(list_id: str, title: str, items: list[dict[str, Any]]) -> dict:
    return {
        "id": list_id,
        "ownerId": ACCOUNT_ID,
        "ownerDisplayName": "Sam",
        "ownerAvatarColor": None,
        "title": title,
        "createdAt": "2026-09-01T00:00:00Z",
        "updatedAt": "2026-09-01T00:00:00Z",
        "editorsCanManageSharing": False,
        "members": [],
        "items": items,
    }


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
