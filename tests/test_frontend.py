import asyncio
import time
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.listapp.const import DOMAIN
from custom_components.listapp.frontend import CARD_URL, async_register_frontend

from .conftest import register_lists
from .helpers import ACCOUNT_ID, FULL_SCOPE, OTHER_ACCOUNT_ID, groceries


def _entry(unique_id: str, title: str) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        title=title,
        unique_id=unique_id,
        data={
            "auth_implementation": DOMAIN,
            "token": {
                "access_token": f"{unique_id}-token",
                "refresh_token": f"{unique_id}-refresh",
                "token_type": "bearer",
                "expires_in": 3600,
                "expires_at": time.time() + 3600,
                "scope": FULL_SCOPE,
            },
        },
        options={},
    )


async def test_registers_static_path_and_extra_js_once(hass: HomeAssistant) -> None:
    hass.http = AsyncMock()
    with patch("custom_components.listapp.frontend.add_extra_js_url") as add_extra_js_url:
        await async_register_frontend(hass)
        await async_register_frontend(hass)

        assert hass.http.async_register_static_paths.call_count == 1
        assert add_extra_js_url.call_count == 1
        url = add_extra_js_url.call_args[0][1]
        assert url.startswith(f"{CARD_URL}?v=")


async def test_concurrent_calls_register_exactly_once(hass: HomeAssistant) -> None:
    hass.http = AsyncMock()

    async def slow_register(*args, **kwargs):
        await asyncio.sleep(0.05)

    hass.http.async_register_static_paths.side_effect = slow_register

    with patch("custom_components.listapp.frontend.add_extra_js_url") as add_extra_js_url:
        await asyncio.gather(
            async_register_frontend(hass),
            async_register_frontend(hass),
            async_register_frontend(hass),
        )

        assert hass.http.async_register_static_paths.call_count == 1
        assert add_extra_js_url.call_count == 1


async def test_failed_registration_can_be_retried(hass: HomeAssistant) -> None:
    hass.http = AsyncMock()
    hass.http.async_register_static_paths.side_effect = OSError("boom")

    with patch("custom_components.listapp.frontend.add_extra_js_url") as add_extra_js_url:
        with pytest.raises(OSError):
            await async_register_frontend(hass)

        hass.http.async_register_static_paths.side_effect = None
        await async_register_frontend(hass)

        assert hass.http.async_register_static_paths.call_count == 2
        assert add_extra_js_url.call_count == 1


async def test_registered_once_across_two_entries_and_a_reload(
    hass: HomeAssistant, aioclient_mock
) -> None:
    # Pre-load http/frontend so their own static-path registrations happen before we patch —
    # otherwise the count below would include theirs, not just ours.
    assert await async_setup_component(hass, "http", {})
    assert await async_setup_component(hass, "frontend", {})
    entry_a = _entry(ACCOUNT_ID, "a@example.com")
    entry_b = _entry(OTHER_ACCOUNT_ID, "b@example.com")
    register_lists(aioclient_mock, [groceries()])
    entry_a.add_to_hass(hass)
    entry_b.add_to_hass(hass)

    with (
        patch("custom_components.listapp.frontend.add_extra_js_url") as add_extra_js_url,
        patch.object(
            hass.http, "async_register_static_paths", new_callable=AsyncMock
        ) as register_static_paths,
    ):
        # Setting up the first entry also loads the second — HA sets up every not-yet-loaded
        # entry of a domain once its component is set up for the first time.
        assert await hass.config_entries.async_setup(entry_a.entry_id)
        await hass.async_block_till_done()
        assert entry_b.state is ConfigEntryState.LOADED
        assert await hass.config_entries.async_reload(entry_a.entry_id)
        await hass.async_block_till_done()

        assert register_static_paths.call_count == 1
        assert add_extra_js_url.call_count == 1

    assert await hass.config_entries.async_unload(entry_a.entry_id)
    assert await hass.config_entries.async_unload(entry_b.entry_id)
