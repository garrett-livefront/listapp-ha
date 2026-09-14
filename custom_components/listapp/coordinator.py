from __future__ import annotations

import asyncio
import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import ListAppAuthError, ListAppClient, ListAppError, ListAppList, ListAppNotFoundError
from .const import CONF_READ_ONLY, DOMAIN, SCOPE_WRITE, UPDATE_INTERVAL

_LOGGER = logging.getLogger(__name__)

type ListAppConfigEntry = ConfigEntry[ListAppCoordinator]


class ListAppCoordinator(DataUpdateCoordinator[dict[str, ListAppList]]):
    config_entry: ListAppConfigEntry

    def __init__(
        self, hass: HomeAssistant, entry: ListAppConfigEntry, client: ListAppClient
    ) -> None:
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=UPDATE_INTERVAL,
        )
        self.client = client

    @property
    def account_id(self) -> str:
        assert self.config_entry.unique_id is not None
        return self.config_entry.unique_id

    @property
    def can_write(self) -> bool:
        if self.config_entry.options.get(CONF_READ_ONLY, False):
            return False
        granted = self.config_entry.data["token"].get("scope", "")
        return SCOPE_WRITE in granted.split()

    async def _async_fetch_list(self, list_id: str) -> ListAppList | None:
        try:
            return await self.client.async_get_list(list_id)
        except ListAppNotFoundError:
            return None

    async def _async_update_data(self) -> dict[str, ListAppList]:
        try:
            summaries = await self.client.async_get_lists()
            lists = await asyncio.gather(
                *(self._async_fetch_list(summary["id"]) for summary in summaries)
            )
        except ListAppAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except ListAppError as err:
            raise UpdateFailed(str(err)) from err
        return {lst.id: lst for lst in lists if lst is not None}
