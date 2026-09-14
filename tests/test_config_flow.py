from unittest.mock import patch

import pytest
from homeassistant.config_entries import SOURCE_REAUTH, SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import config_entry_oauth2_flow
from pytest_homeassistant_custom_component.common import MockConfigEntry
from yarl import URL

from custom_components.listapp.const import (
    API_BASE_URL,
    CONF_READ_ONLY,
    DOMAIN,
    OAUTH_AUTHORIZE_URL,
    OAUTH_CLIENT_ID,
    OAUTH_TOKEN_URL,
)

from .helpers import FULL_SCOPE, ME, OTHER_ACCOUNT_ID, READ_SCOPE

REDIRECT_URI = "https://example.com/auth/external/callback"

pytestmark = pytest.mark.usefixtures("current_request_with_host")


async def _authorize(hass: HomeAssistant, hass_client_no_auth, result, aioclient_mock, me) -> str:
    authorize_url = URL(result["url"])
    state = config_entry_oauth2_flow._encode_jwt(
        hass, {"flow_id": result["flow_id"], "redirect_uri": REDIRECT_URI}
    )
    client = await hass_client_no_auth()
    response = await client.get(f"/auth/external/callback?code=abcd&state={state}")
    assert response.status == 200

    aioclient_mock.post(
        OAUTH_TOKEN_URL,
        json={
            "access_token": "new-access-token",
            "refresh_token": "new-refresh-token",
            "expires_in": 3600,
            "token_type": "bearer",
            "scope": authorize_url.query["scope"],
        },
    )
    aioclient_mock.get(f"{API_BASE_URL}/me", **me)
    return authorize_url.query["scope"]


async def _finish(hass: HomeAssistant, flow_id: str):
    with patch("custom_components.listapp.async_setup_entry", return_value=True):
        return await hass.config_entries.flow.async_configure(flow_id)


async def test_full_flow(hass: HomeAssistant, hass_client_no_auth, aioclient_mock) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})

    assert result["type"] is FlowResultType.EXTERNAL_STEP
    url = URL(result["url"])
    assert str(url.with_query(None)) == OAUTH_AUTHORIZE_URL
    assert url.query["client_id"] == OAUTH_CLIENT_ID
    assert url.query["code_challenge_method"] == "S256"
    assert url.query["code_challenge"]

    scope = await _authorize(hass, hass_client_no_auth, result, aioclient_mock, {"json": ME})
    result = await _finish(hass, result["flow_id"])

    assert scope == FULL_SCOPE
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "sam@example.com"
    assert result["result"].unique_id == ME["id"]
    assert result["result"].data["token"]["access_token"] == "new-access-token"
    token_request = aioclient_mock.mock_calls[0][2]
    assert token_request["client_id"] == OAUTH_CLIENT_ID
    assert "client_secret" not in token_request
    assert len(token_request["code_verifier"]) >= 43


async def test_duplicate_account_aborts(
    hass: HomeAssistant, hass_client_no_auth, aioclient_mock, config_entry: MockConfigEntry
) -> None:
    config_entry.add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    await _authorize(hass, hass_client_no_auth, result, aioclient_mock, {"json": ME})

    result = await _finish(hass, result["flow_id"])

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


@pytest.mark.parametrize(
    ("status", "reason"), [(401, "oauth_unauthorized"), (503, "cannot_connect")]
)
async def test_profile_errors_abort(
    hass: HomeAssistant, hass_client_no_auth, aioclient_mock, status: int, reason: str
) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    await _authorize(hass, hass_client_no_auth, result, aioclient_mock, {"status": status})

    result = await _finish(hass, result["flow_id"])

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == reason


@pytest.mark.parametrize(
    ("options", "expected_scope"),
    [({}, FULL_SCOPE), ({CONF_READ_ONLY: True}, READ_SCOPE)],
)
async def test_reauth_updates_token_with_scopes_from_options(
    hass: HomeAssistant,
    hass_client_no_auth,
    aioclient_mock,
    config_entry: MockConfigEntry,
    expected_scope: str,
) -> None:
    config_entry.add_to_hass(hass)
    result = await config_entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"

    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    scope = await _authorize(hass, hass_client_no_auth, result, aioclient_mock, {"json": ME})
    result = await _finish(hass, result["flow_id"])

    assert scope == expected_scope
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"
    assert config_entry.data["token"]["access_token"] == "new-access-token"
    assert config_entry.data["token"]["scope"] == expected_scope


async def test_reauth_with_another_account_aborts(
    hass: HomeAssistant, hass_client_no_auth, aioclient_mock, config_entry: MockConfigEntry
) -> None:
    config_entry.add_to_hass(hass)
    result = await config_entry.start_reauth_flow(hass)
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    other = {"json": {**ME, "id": OTHER_ACCOUNT_ID}}
    await _authorize(hass, hass_client_no_auth, result, aioclient_mock, other)

    result = await _finish(hass, result["flow_id"])

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "wrong_account"
    assert config_entry.data["token"]["access_token"] == "test-access-token"


def _reauth_flows(hass: HomeAssistant) -> list:
    return [
        flow
        for flow in hass.config_entries.flow.async_progress()
        if flow["context"]["source"] == SOURCE_REAUTH
    ]


@pytest.mark.parametrize(("read_only", "expect_reauth"), [(True, True), (False, False)])
async def test_options_read_only_toggle(
    hass: HomeAssistant, setup_integration: MockConfigEntry, read_only: bool, expect_reauth: bool
) -> None:
    result = await hass.config_entries.options.async_init(setup_integration.entry_id)
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_READ_ONLY: read_only}
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert setup_integration.options == {CONF_READ_ONLY: read_only}
    assert bool(_reauth_flows(hass)) is expect_reauth
