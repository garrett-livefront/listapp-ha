import asyncio

import pytest
from aiohttp import ClientError
from homeassistant.config_entries import SOURCE_REAUTH, ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_entry_oauth2_flow
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.listapp.const import API_BASE_URL, DOMAIN, OAUTH_TOKEN_URL
from custom_components.listapp.oauth import ListAppOAuth2Implementation, async_ensure_implementation

from .conftest import register_lists
from .helpers import groceries


def _has_reauth_flow(hass: HomeAssistant) -> bool:
    return any(
        flow["context"]["source"] == SOURCE_REAUTH
        for flow in hass.config_entries.flow.async_progress()
    )


async def _setup(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


async def test_setup_and_unload(hass: HomeAssistant, setup_integration: MockConfigEntry) -> None:
    assert setup_integration.state is ConfigEntryState.LOADED
    assert ListAppOAuth2Implementation(hass).name == "ListApp"
    assert not _has_reauth_flow(hass)

    assert await hass.config_entries.async_unload(setup_integration.entry_id)

    assert setup_integration.state is ConfigEntryState.NOT_LOADED


async def test_unauthorized_starts_reauth(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, config_entry: MockConfigEntry
) -> None:
    aioclient_mock.get(f"{API_BASE_URL}/lists", status=401)

    await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.SETUP_ERROR
    assert _has_reauth_flow(hass)


@pytest.mark.parametrize("mock", [{"status": 503}, {"exc": ClientError()}, {"exc": TimeoutError()}])
async def test_unavailable_retries_without_reauth(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    config_entry: MockConfigEntry,
    mock: dict,
) -> None:
    aioclient_mock.get(f"{API_BASE_URL}/lists", **mock)

    await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.SETUP_RETRY
    assert not _has_reauth_flow(hass)


@pytest.mark.parametrize("token_expires_in", [-60])
async def test_expired_token_is_refreshed(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, config_entry: MockConfigEntry
) -> None:
    aioclient_mock.post(
        OAUTH_TOKEN_URL,
        json={"access_token": "refreshed", "refresh_token": "rotated", "expires_in": 3600},
    )
    register_lists(aioclient_mock, [groceries()])

    await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.LOADED
    assert config_entry.data["token"]["access_token"] == "refreshed"
    assert config_entry.data["token"]["refresh_token"] == "rotated"


@pytest.mark.parametrize("token_expires_in", [-60])
@pytest.mark.parametrize(
    ("status", "state", "reauth"),
    [(400, ConfigEntryState.SETUP_ERROR, True), (503, ConfigEntryState.SETUP_RETRY, False)],
)
async def test_refresh_failures(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    config_entry: MockConfigEntry,
    status: int,
    state: ConfigEntryState,
    reauth: bool,
) -> None:
    aioclient_mock.post(OAUTH_TOKEN_URL, status=status, json={"error": "invalid_grant"})

    await _setup(hass, config_entry)

    assert config_entry.state is state
    assert _has_reauth_flow(hass) is reauth


@pytest.mark.parametrize("token_expires_in", [-60])
async def test_refresh_timeout_retries_without_reauth(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, config_entry: MockConfigEntry
) -> None:
    aioclient_mock.post(OAUTH_TOKEN_URL, exc=TimeoutError())

    await _setup(hass, config_entry)

    assert config_entry.state is ConfigEntryState.SETUP_RETRY
    assert not _has_reauth_flow(hass)


async def test_concurrent_registration_keeps_one_implementation(hass: HomeAssistant) -> None:
    await asyncio.gather(*(async_ensure_implementation(hass) for _ in range(3)))
    first = (await config_entry_oauth2_flow.async_get_implementations(hass, DOMAIN))[DOMAIN]

    await async_ensure_implementation(hass)

    implementations = await config_entry_oauth2_flow.async_get_implementations(hass, DOMAIN)
    assert implementations[DOMAIN] is first
