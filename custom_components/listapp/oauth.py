from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_entry_oauth2_flow

from .const import (
    DOMAIN,
    OAUTH_AUTHORIZE_URL,
    OAUTH_CLIENT_ID,
    OAUTH_TOKEN_URL,
    SCOPE_OFFLINE,
    SCOPE_READ,
    SCOPE_WRITE,
)


class ListAppOAuth2Implementation(config_entry_oauth2_flow.LocalOAuth2ImplementationWithPkce):
    def __init__(self, hass: HomeAssistant) -> None:
        super().__init__(hass, DOMAIN, OAUTH_CLIENT_ID, OAUTH_AUTHORIZE_URL, OAUTH_TOKEN_URL)

    @property
    def name(self) -> str:
        return "ListApp"


async def async_ensure_implementation(hass: HomeAssistant) -> None:
    # Registered once: replacing it would regenerate the PKCE verifier under an in-flight flow.
    if DOMAIN not in await config_entry_oauth2_flow.async_get_implementations(hass, DOMAIN):
        config_entry_oauth2_flow.async_register_implementation(
            hass, DOMAIN, ListAppOAuth2Implementation(hass)
        )


def requested_scopes(read_only: bool) -> str:
    scopes = [SCOPE_OFFLINE, SCOPE_READ] if read_only else [SCOPE_OFFLINE, SCOPE_READ, SCOPE_WRITE]
    return " ".join(scopes)
