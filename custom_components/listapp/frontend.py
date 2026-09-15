from __future__ import annotations

import asyncio
import hashlib
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN

URL_BASE = "/listapp_frontend"
CARD_FILENAME = "listapp-list-card.js"
CARD_URL = f"{URL_BASE}/{CARD_FILENAME}"

_REGISTERED = "frontend_registered"
_REGISTER_LOCK = "frontend_register_lock"


def _bundle_hash(path: Path) -> str:
    """Short content hash for cache-busting — see docs/card.md#cache-busting.

    Keyed to the bundle's own bytes rather than the integration version, so a
    slice that changes the card without bumping `manifest.json` still busts
    the long-lived cache header instead of serving the previous bundle.
    """
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Serve and register the card once per HA instance, regardless of entry count.

    Guarded by a lock (not just the flag) so concurrent config entry setups can't
    both pass the flag check before either has registered — see docs/card.md.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(_REGISTERED):
        return
    lock = domain_data.setdefault(_REGISTER_LOCK, asyncio.Lock())
    async with lock:
        if domain_data.get(_REGISTERED):
            return

        path = Path(__file__).parent / "frontend" / CARD_FILENAME
        await hass.http.async_register_static_paths(
            [StaticPathConfig(CARD_URL, str(path), cache_headers=True)]
        )
        add_extra_js_url(hass, f"{CARD_URL}?v={_bundle_hash(path)}")
        domain_data[_REGISTERED] = True
