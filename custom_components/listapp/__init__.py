from __future__ import annotations

from aiohttp import ClientError
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import OAuth2TokenRequestReauthError
from homeassistant.helpers import config_entry_oauth2_flow
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import ListAppAuthError, ListAppClient, ListAppUnavailableError
from .const import CONF_READ_ONLY, SCOPE_WRITE
from .coordinator import ListAppConfigEntry, ListAppCoordinator
from .oauth import async_ensure_implementation

PLATFORMS: list[Platform] = [Platform.TODO]


async def async_setup_entry(hass: HomeAssistant, entry: ListAppConfigEntry) -> bool:
    await async_ensure_implementation(hass)
    implementation = await config_entry_oauth2_flow.async_get_config_entry_implementation(
        hass, entry
    )
    session = config_entry_oauth2_flow.OAuth2Session(hass, entry, implementation)

    async def get_access_token() -> str:
        try:
            await session.async_ensure_token_valid()
        except OAuth2TokenRequestReauthError as err:
            raise ListAppAuthError("ListApp refused the refresh token") from err
        except ClientError as err:
            raise ListAppUnavailableError("Could not refresh the ListApp token") from err
        return session.token["access_token"]

    read_only = entry.options.get(CONF_READ_ONLY, False)
    if (SCOPE_WRITE in entry.data["token"].get("scope", "").split()) == read_only:
        entry.async_start_reauth(hass)

    client = ListAppClient(async_get_clientsession(hass), get_access_token)
    coordinator = ListAppCoordinator(hass, entry, client)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ListAppConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
