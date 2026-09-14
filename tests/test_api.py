import pytest
from aiohttp import ClientError
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.listapp.api import (
    ListAppAuthError,
    ListAppClient,
    ListAppError,
    ListAppForbiddenError,
    ListAppNotFoundError,
    ListAppUnavailableError,
)
from custom_components.listapp.const import API_BASE_URL

from .helpers import BREAD_ID, EGGS_ID, GROCERIES_ID, MILK_ID, groceries


@pytest.fixture
def client(hass: HomeAssistant) -> ListAppClient:
    async def token() -> str:
        return "token"

    return ListAppClient(async_get_clientsession(hass), token)


@pytest.mark.parametrize(
    ("mock", "error"),
    [
        ({"status": 401}, ListAppAuthError),
        ({"status": 403}, ListAppForbiddenError),
        ({"status": 404}, ListAppNotFoundError),
        ({"status": 409}, ListAppError),
        ({"status": 503}, ListAppUnavailableError),
        ({"exc": ClientError()}, ListAppUnavailableError),
        ({"exc": TimeoutError()}, ListAppUnavailableError),
    ],
)
async def test_error_mapping(
    aioclient_mock: AiohttpClientMocker, client: ListAppClient, mock: dict, error: type
) -> None:
    aioclient_mock.get(f"{API_BASE_URL}/me", **mock)

    with pytest.raises(ListAppError) as exc_info:
        await client.async_get_me()

    assert type(exc_info.value) is error


async def test_get_list_sorts_items_and_sends_bearer(
    aioclient_mock: AiohttpClientMocker, client: ListAppClient
) -> None:
    aioclient_mock.get(f"{API_BASE_URL}/lists/{GROCERIES_ID}", json=groceries())

    lst = await client.async_get_list(GROCERIES_ID)

    assert [item.id for item in lst.items] == [MILK_ID, BREAD_ID, EGGS_ID]
    assert aioclient_mock.mock_calls[0][3]["Authorization"] == "Bearer token"


async def test_write_bodies(aioclient_mock: AiohttpClientMocker, client: ListAppClient) -> None:
    items = f"{API_BASE_URL}/lists/{GROCERIES_ID}/items"
    aioclient_mock.patch(f"{items}/{MILK_ID}", json={})
    aioclient_mock.put(f"{items}/reorder", status=204)

    await client.async_update_item(GROCERIES_ID, MILK_ID, content=None, is_checked=True)
    await client.async_reorder_items(GROCERIES_ID, [BREAD_ID, MILK_ID])

    assert aioclient_mock.mock_calls[0][2] == {"isChecked": True}
    assert aioclient_mock.mock_calls[1][2] == {
        "items": [{"id": BREAD_ID, "position": 0}, {"id": MILK_ID, "position": 1}]
    }
