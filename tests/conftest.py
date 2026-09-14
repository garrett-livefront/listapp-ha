import time
from typing import Any

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.listapp.const import API_BASE_URL, DOMAIN

from .helpers import ACCOUNT_ID, FULL_SCOPE, groceries

pytest_plugins = "pytest_homeassistant_custom_component"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    yield


@pytest.fixture
def scope() -> str:
    return FULL_SCOPE


@pytest.fixture
def options() -> dict[str, Any]:
    return {}


@pytest.fixture
def token_expires_in() -> int:
    return 3600


@pytest.fixture
def config_entry(scope: str, options: dict[str, Any], token_expires_in: int) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        title="sam@example.com",
        unique_id=ACCOUNT_ID,
        data={
            "auth_implementation": DOMAIN,
            "token": {
                "access_token": "test-access-token",
                "refresh_token": "test-refresh-token",
                "token_type": "bearer",
                "expires_in": token_expires_in,
                "expires_at": time.time() + token_expires_in,
                "scope": scope,
            },
        },
        options=options,
    )


@pytest.fixture
def lists() -> list[dict[str, Any]]:
    return [groceries()]


def register_lists(aioclient_mock: AiohttpClientMocker, lists: list[dict[str, Any]]) -> None:
    summaries = [{key: value for key, value in lst.items() if key != "items"} for lst in lists]
    aioclient_mock.get(f"{API_BASE_URL}/lists", json=summaries)
    for lst in lists:
        aioclient_mock.get(f"{API_BASE_URL}/lists/{lst['id']}", json=lst)


@pytest.fixture
def mock_api(
    aioclient_mock: AiohttpClientMocker, lists: list[dict[str, Any]]
) -> AiohttpClientMocker:
    register_lists(aioclient_mock, lists)
    return aioclient_mock


@pytest.fixture
async def setup_integration(
    hass: HomeAssistant, config_entry: MockConfigEntry, mock_api: AiohttpClientMocker
) -> MockConfigEntry:
    config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    return config_entry
