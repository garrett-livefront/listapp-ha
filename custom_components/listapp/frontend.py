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
IMPL_FILENAME = "listapp-list-card-impl.js"
CARD_URL = f"{URL_BASE}/{CARD_FILENAME}"

_REGISTERED = "frontend_registered"
_REGISTER_LOCK = "frontend_register_lock"


def _frontend_dir() -> Path:
    return Path(__file__).parent / "frontend"


def _bundle_hash(directory: Path) -> str:
    """Short content hash over every emitted file — see docs/card.md#cache-busting.

    Covers the whole directory, not just the entry, so a change confined to the lazy
    implementation chunk still moves the entry's `?v=` and busts the long-lived cache header.
    """
    digest = hashlib.sha256()
    for path in sorted(directory.glob("*.js")):
        digest.update(path.name.encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()[:12]


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

        directory = _frontend_dir()
        # The directory, not the entry alone: the entry lazily imports a sibling chunk.
        await hass.http.async_register_static_paths(
            [StaticPathConfig(URL_BASE, str(directory), cache_headers=True)]
        )
        add_extra_js_url(hass, f"{CARD_URL}?v={_bundle_hash(directory)}")
        domain_data[_REGISTERED] = True
