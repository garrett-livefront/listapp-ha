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
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import ListAppAuthError, ListAppClient, ListAppError
from .const import CONF_READ_ONLY, CONF_SELECTED_LISTS, DOMAIN, MAX_SELECTED_LISTS
from .oauth import async_ensure_implementation, requested_scopes


def _lists_schema(available: list[dict[str, Any]], default: list[str]) -> vol.Schema:
    options = {lst["id"]: lst["title"] for lst in available}
    field = vol.Required(CONF_SELECTED_LISTS, default=default)
    return vol.Schema({field: cv.multi_select(options)})


class ListAppFlowHandler(config_entry_oauth2_flow.AbstractOAuth2FlowHandler, domain=DOMAIN):
    DOMAIN = DOMAIN

    _oauth_data: dict[str, Any]
    _entry_title: str
    _available_lists: list[dict[str, Any]]

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

        self._oauth_data = data
        self._entry_title = me["email"]
        try:
            self._available_lists = await client.async_get_lists()
        except ListAppAuthError:
            return self.async_abort(reason="oauth_unauthorized")
        except ListAppError:
            return self.async_abort(reason="cannot_connect")
        return await self.async_step_select_lists()

    async def async_step_select_lists(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            selected = user_input[CONF_SELECTED_LISTS]
            if len(selected) > MAX_SELECTED_LISTS:
                errors[CONF_SELECTED_LISTS] = "too_many_lists"
            else:
                return self.async_create_entry(
                    title=self._entry_title,
                    data=self._oauth_data,
                    options={CONF_SELECTED_LISTS: selected},
                )

        default = [lst["id"] for lst in self._available_lists[:MAX_SELECTED_LISTS]]
        return self.async_show_form(
            step_id="select_lists",
            data_schema=_lists_schema(self._available_lists, default),
            errors=errors,
        )


class ListAppOptionsFlow(OptionsFlowWithReload):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        current = self.config_entry.options
        if user_input is not None:
            selected = user_input.get(CONF_SELECTED_LISTS)
            if selected is not None and len(selected) > MAX_SELECTED_LISTS:
                errors[CONF_SELECTED_LISTS] = "too_many_lists"
            elif selected is None and CONF_SELECTED_LISTS in current:
                # No picker shown: keep the selection — see docs/architecture.md#list-picker
                return self.async_create_entry(
                    data={**user_input, CONF_SELECTED_LISTS: current[CONF_SELECTED_LISTS]}
                )
            else:
                return self.async_create_entry(data=user_input)

        schema = vol.Schema({vol.Required(CONF_READ_ONLY, default=False): bool})
        suggested = dict(current)
        available = await self._async_available_lists()
        if available is not None:
            ids = {lst["id"] for lst in available}
            default = [
                list_id
                for list_id in current.get(
                    CONF_SELECTED_LISTS, [lst["id"] for lst in available[:MAX_SELECTED_LISTS]]
                )
                if list_id in ids
            ]
            schema = schema.extend(_lists_schema(available, default).schema)
            suggested[CONF_SELECTED_LISTS] = default
        return self.async_show_form(
            step_id="init",
            data_schema=self.add_suggested_values_to_schema(schema, suggested),
            errors=errors,
        )

    async def _async_available_lists(self) -> list[dict[str, Any]] | None:
        coordinator = getattr(self.config_entry, "runtime_data", None)
        if coordinator is None:
            return None
        try:
            return await coordinator.client.async_get_lists()
        except ListAppError:
            return None
