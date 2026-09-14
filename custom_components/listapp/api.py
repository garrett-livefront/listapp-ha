from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

from aiohttp import ClientError, ClientSession, hdrs

from .const import API_BASE_URL, REQUEST_TIMEOUT_SECONDS


class ListAppError(Exception):
    pass


class ListAppAuthError(ListAppError):
    pass


class ListAppForbiddenError(ListAppError):
    pass


class ListAppNotFoundError(ListAppError):
    pass


class ListAppUnavailableError(ListAppError):
    pass


@dataclass(frozen=True, slots=True)
class ListAppItem:
    id: str
    content: str
    is_checked: bool
    position: int


@dataclass(frozen=True, slots=True)
class ListAppList:
    id: str
    owner_id: str
    title: str
    items: list[ListAppItem]
    # Caller's own role, "OWNER" | "EDITOR" | "VIEWER". None means unknown — an older server
    # that omits myRole, never a real role. See docs/architecture.md#roles.
    my_role: str | None = None


def _parse_list(data: dict[str, Any]) -> ListAppList:
    items = [
        ListAppItem(
            id=item["id"],
            content=item["content"],
            is_checked=item["isChecked"],
            position=item["position"],
        )
        for item in data["items"]
    ]
    items.sort(key=lambda item: item.position)
    return ListAppList(
        id=data["id"],
        owner_id=data["ownerId"],
        title=data["title"],
        items=items,
        my_role=data.get("myRole"),
    )


class ListAppClient:
    def __init__(
        self,
        session: ClientSession,
        get_access_token: Callable[[], Awaitable[str]],
        base_url: str = API_BASE_URL,
    ) -> None:
        self._session = session
        self._get_access_token = get_access_token
        self._base_url = base_url

    @property
    def base_url(self) -> str:
        return self._base_url

    async def async_get_access_token(self) -> str:
        return await self._get_access_token()

    async def _request(self, method: str, path: str, json: Any = None) -> Any:
        token = await self._get_access_token()
        try:
            async with asyncio.timeout(REQUEST_TIMEOUT_SECONDS):
                response = await self._session.request(
                    method,
                    f"{self._base_url}{path}",
                    json=json,
                    headers={hdrs.AUTHORIZATION: f"Bearer {token}"},
                )
                status = response.status
                if status == HTTPStatus.UNAUTHORIZED:
                    raise ListAppAuthError(f"{method} {path} was refused as unauthenticated")
                if status == HTTPStatus.FORBIDDEN:
                    raise ListAppForbiddenError(f"{method} {path} is not allowed for this token")
                if status == HTTPStatus.NOT_FOUND:
                    raise ListAppNotFoundError(f"{method} {path} was not found")
                if status >= HTTPStatus.INTERNAL_SERVER_ERROR:
                    raise ListAppUnavailableError(f"{method} {path} failed with {status}")
                if status >= HTTPStatus.BAD_REQUEST:
                    raise ListAppError(f"{method} {path} failed with {status}")
                if status == HTTPStatus.NO_CONTENT:
                    return None
                return await response.json()
        except (TimeoutError, ClientError) as err:
            raise ListAppUnavailableError(f"{method} {path} could not reach ListApp") from err

    async def async_get_me(self) -> dict[str, Any]:
        return await self._request(hdrs.METH_GET, "/me")

    async def async_get_lists(self) -> list[dict[str, Any]]:
        return await self._request(hdrs.METH_GET, "/lists")

    async def async_get_list(self, list_id: str) -> ListAppList:
        return _parse_list(await self._request(hdrs.METH_GET, f"/lists/{list_id}"))

    async def async_create_item(
        self, list_id: str, item_id: str, content: str, position: int
    ) -> None:
        body = {"id": item_id, "content": content, "position": position}
        await self._request(hdrs.METH_POST, f"/lists/{list_id}/items", body)

    async def async_update_item(
        self, list_id: str, item_id: str, *, content: str | None, is_checked: bool
    ) -> None:
        body: dict[str, Any] = {"isChecked": is_checked}
        if content is not None:
            body["content"] = content
        await self._request(hdrs.METH_PATCH, f"/lists/{list_id}/items/{item_id}", body)

    async def async_delete_item(self, list_id: str, item_id: str) -> None:
        await self._request(hdrs.METH_DELETE, f"/lists/{list_id}/items/{item_id}")

    async def async_reorder_items(self, list_id: str, item_ids: list[str]) -> None:
        body = {"items": [{"id": item_id, "position": i} for i, item_id in enumerate(item_ids)]}
        await self._request(hdrs.METH_PUT, f"/lists/{list_id}/items/reorder", body)
