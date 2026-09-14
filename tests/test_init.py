from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.listapp import async_setup_entry, async_unload_entry
from custom_components.listapp.const import DOMAIN


async def test_setup_entry_returns_true(hass):
    entry = MockConfigEntry(domain=DOMAIN)
    entry.add_to_hass(hass)

    assert await async_setup_entry(hass, entry) is True


async def test_unload_entry_returns_true(hass):
    entry = MockConfigEntry(domain=DOMAIN)
    entry.add_to_hass(hass)

    assert await async_unload_entry(hass, entry) is True
