from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import DOMAIN

URL_BASE = "/listapp_frontend"
CARD_FILENAME = "listapp-list-card.js"
CARD_URL = f"{URL_BASE}/{CARD_FILENAME}"

_REGISTERED = "frontend_registered"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Serve and register the card once per HA instance, regardless of entry count."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(_REGISTERED):
        return
    domain_data[_REGISTERED] = True

    integration = await async_get_integration(hass, DOMAIN)
    path = Path(__file__).parent / "frontend" / CARD_FILENAME
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(path), cache_headers=False)]
    )
    add_extra_js_url(hass, f"{CARD_URL}?v={integration.version}")
