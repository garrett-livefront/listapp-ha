from __future__ import annotations

from aiohttp import ClientError
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    ConfigEntryNotReady,
    OAuth2TokenRequestReauthError,
)
from homeassistant.helpers import config_entry_oauth2_flow
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import ListAppAuthError, ListAppClient, ListAppError, ListAppUnavailableError
from .const import (
    CONF_READ_ONLY,
    CONF_SELECTED_LISTS,
    DOMAIN,
    MAX_SELECTED_LISTS,
    SCOPE_WRITE,
)
from .coordinator import ListAppConfigEntry, ListAppCoordinator
from .frontend import async_register_frontend
from .oauth import async_ensure_implementation

PLATFORMS: list[Platform] = [Platform.TODO]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def _async_migrate_selection(
    hass: HomeAssistant, entry: ListAppConfigEntry, client: ListAppClient
) -> None:
    """H2 entries predate the list picker; default them to all lists, capped at 25."""
    if CONF_SELECTED_LISTS in entry.options:
        return
    try:
        available = await client.async_get_lists()
    except ListAppAuthError as err:
        raise ConfigEntryAuthFailed(str(err)) from err
    except ListAppError as err:
        raise ConfigEntryNotReady(str(err)) from err
    selected = [lst["id"] for lst in available[:MAX_SELECTED_LISTS]]
    hass.config_entries.async_update_entry(
        entry, options={**entry.options, CONF_SELECTED_LISTS: selected}
    )


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the card before any entry sets up — see docs/card.md#delivery."""
    await async_register_frontend(hass)
    return True


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
        except (TimeoutError, ClientError) as err:
            raise ListAppUnavailableError("Could not refresh the ListApp token") from err
        return session.token["access_token"]

    read_only = entry.options.get(CONF_READ_ONLY, False)
    if (SCOPE_WRITE in entry.data["token"].get("scope", "").split()) == read_only:
        entry.async_start_reauth(hass)

    client = ListAppClient(async_get_clientsession(hass), get_access_token)
    await _async_migrate_selection(hass, entry, client)

    coordinator = ListAppCoordinator(hass, entry, client)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    coordinator.async_start_stream()
    entry.async_on_unload(coordinator.async_stop_stream)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ListAppConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
