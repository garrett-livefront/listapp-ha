from __future__ import annotations

import logging
from collections.abc import Mapping
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import (
    SOURCE_REAUTH,
    ConfigEntry,
    ConfigFlowResult,
    OptionsFlowWithReload,
)
from homeassistant.core import callback
from homeassistant.helpers import config_entry_oauth2_flow
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import ListAppAuthError, ListAppClient, ListAppError
from .const import CONF_READ_ONLY, DOMAIN
from .oauth import async_ensure_implementation, requested_scopes


class ListAppFlowHandler(config_entry_oauth2_flow.AbstractOAuth2FlowHandler, domain=DOMAIN):
    DOMAIN = DOMAIN

    @property
    def logger(self) -> logging.Logger:
        return logging.getLogger(__name__)

    @property
    def extra_authorize_data(self) -> dict[str, Any]:
        read_only = self.source == SOURCE_REAUTH and self._get_reauth_entry().options.get(
            CONF_READ_ONLY, False
        )
        return {"scope": requested_scopes(read_only)}

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> ListAppOptionsFlow:
        return ListAppOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        await async_ensure_implementation(self.hass)
        return await super().async_step_user(user_input)

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is None:
            return self.async_show_form(step_id="reauth_confirm")
        return await self.async_step_user()

    async def async_oauth_create_entry(self, data: dict[str, Any]) -> ConfigFlowResult:
        async def access_token() -> str:
            return data["token"]["access_token"]

        client = ListAppClient(async_get_clientsession(self.hass), access_token)
        try:
            me = await client.async_get_me()
        except ListAppAuthError:
            return self.async_abort(reason="oauth_unauthorized")
        except ListAppError:
            return self.async_abort(reason="cannot_connect")

        await self.async_set_unique_id(me["id"])
        if self.source == SOURCE_REAUTH:
            self._abort_if_unique_id_mismatch(reason="wrong_account")
            return self.async_update_reload_and_abort(self._get_reauth_entry(), data=data)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title=me["email"], data=data)


class ListAppOptionsFlow(OptionsFlowWithReload):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        schema = vol.Schema({vol.Required(CONF_READ_ONLY, default=False): bool})
        return self.async_show_form(
            step_id="init",
            data_schema=self.add_suggested_values_to_schema(schema, self.config_entry.options),
        )
