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
    CONF_SELECTED_LISTS,
    DOMAIN,
    OAUTH_AUTHORIZE_URL,
    OAUTH_CLIENT_ID,
    OAUTH_TOKEN_URL,
)

from .conftest import register_lists
from .helpers import (
    FULL_SCOPE,
    GROCERIES_ID,
    ME,
    OTHER_ACCOUNT_ID,
    READ_SCOPE,
    groceries,
    list_payload,
)

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


async def _finish(hass: HomeAssistant, flow_id: str, selected: list[str] | None = None):
    with patch("custom_components.listapp.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_configure(flow_id)
        if result["type"] is FlowResultType.FORM and result["step_id"] == "select_lists":
            result = await hass.config_entries.flow.async_configure(
                flow_id,
                {CONF_SELECTED_LISTS: selected if selected is not None else [GROCERIES_ID]},
            )
        return result


async def _finish_to_picker(hass: HomeAssistant, flow_id: str):
    with patch("custom_components.listapp.async_setup_entry", return_value=True):
        return await hass.config_entries.flow.async_configure(flow_id)


async def test_full_flow(hass: HomeAssistant, hass_client_no_auth, aioclient_mock) -> None:
    register_lists(aioclient_mock, [groceries()])
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})

    assert result["type"] is FlowResultType.EXTERNAL_STEP
    url = URL(result["url"])
    assert str(url.with_query(None)) == OAUTH_AUTHORIZE_URL
    assert url.query["client_id"] == OAUTH_CLIENT_ID
    assert url.query["code_challenge_method"] == "S256"
    assert url.query["code_challenge"]

    scope = await _authorize(hass, hass_client_no_auth, result, aioclient_mock, {"json": ME})
    picker = await _finish_to_picker(hass, result["flow_id"])
    assert picker["step_id"] == "select_lists"
    validator = next(v for k, v in picker["data_schema"].schema.items() if k == CONF_SELECTED_LISTS)
    assert validator.options == {GROCERIES_ID: "Groceries"}
    with patch("custom_components.listapp.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SELECTED_LISTS: [GROCERIES_ID]}
        )

    assert scope == FULL_SCOPE
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "sam@example.com"
    assert result["result"].unique_id == ME["id"]
    assert result["result"].data["token"]["access_token"] == "new-access-token"
    assert result["result"].options == {CONF_SELECTED_LISTS: [GROCERIES_ID]}
    token_request = aioclient_mock.mock_calls[0][2]
    assert token_request["client_id"] == OAUTH_CLIENT_ID
    assert "client_secret" not in token_request
    assert len(token_request["code_verifier"]) >= 43


async def test_too_many_lists_rejected(
    hass: HomeAssistant, hass_client_no_auth, aioclient_mock
) -> None:
    many = [list_payload(f"1f7b0000-0000-4000-8000-{i:012d}", f"List {i}", []) for i in range(30)]
    register_lists(aioclient_mock, many)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    await _authorize(hass, hass_client_no_auth, result, aioclient_mock, {"json": ME})
    await _finish_to_picker(hass, result["flow_id"])

    result = await _finish(hass, result["flow_id"], selected=[lst["id"] for lst in many])

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_SELECTED_LISTS: "too_many_lists"}


async def test_empty_selection_rejected(
    hass: HomeAssistant, hass_client_no_auth, aioclient_mock
) -> None:
    register_lists(aioclient_mock, [groceries()])
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    await _authorize(hass, hass_client_no_auth, result, aioclient_mock, {"json": ME})
    await _finish_to_picker(hass, result["flow_id"])

    result = await _finish(hass, result["flow_id"], selected=[])

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_SELECTED_LISTS: "empty_selection"}


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
    ("status", "reason"), [(401, "oauth_unauthorized"), (503, "cannot_connect")]
)
async def test_list_fetch_errors_abort(
    hass: HomeAssistant, hass_client_no_auth, aioclient_mock, status: int, reason: str
) -> None:
    aioclient_mock.get(f"{API_BASE_URL}/lists", status=status)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    await _authorize(hass, hass_client_no_auth, result, aioclient_mock, {"json": ME})

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
        result["flow_id"], {CONF_READ_ONLY: read_only, CONF_SELECTED_LISTS: [GROCERIES_ID]}
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert setup_integration.options == {
        CONF_READ_ONLY: read_only,
        CONF_SELECTED_LISTS: [GROCERIES_ID],
    }
    assert bool(_reauth_flows(hass)) is expect_reauth


async def test_options_too_many_lists_rejected(
    hass: HomeAssistant, setup_integration: MockConfigEntry, aioclient_mock
) -> None:
    many = [list_payload(f"1f7b0000-0000-4000-8000-{i:012d}", f"List {i}", []) for i in range(30)]
    aioclient_mock.clear_requests()
    register_lists(aioclient_mock, many)
    result = await hass.config_entries.options.async_init(setup_integration.entry_id)

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {CONF_READ_ONLY: False, CONF_SELECTED_LISTS: [lst["id"] for lst in many]},
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_SELECTED_LISTS: "too_many_lists"}


async def test_options_empty_selection_rejected(
    hass: HomeAssistant, setup_integration: MockConfigEntry, aioclient_mock
) -> None:
    result = await hass.config_entries.options.async_init(setup_integration.entry_id)

    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_READ_ONLY: False, CONF_SELECTED_LISTS: []}
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_SELECTED_LISTS: "empty_selection"}


async def test_options_keep_selection_when_lists_unavailable(
    hass: HomeAssistant, setup_integration: MockConfigEntry, aioclient_mock
) -> None:
    aioclient_mock.clear_requests()
    aioclient_mock.get(f"{API_BASE_URL}/lists", status=503)
    result = await hass.config_entries.options.async_init(setup_integration.entry_id)
    assert CONF_SELECTED_LISTS not in result["data_schema"].schema

    with patch("custom_components.listapp.async_setup_entry", return_value=True):
        result = await hass.config_entries.options.async_configure(
            result["flow_id"], {CONF_READ_ONLY: False}
        )
        await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert setup_integration.options == {
        CONF_READ_ONLY: False,
        CONF_SELECTED_LISTS: [GROCERIES_ID],
    }


@pytest.mark.parametrize("options", [{}, {CONF_SELECTED_LISTS: [GROCERIES_ID]}])
async def test_options_on_unloaded_entry(
    hass: HomeAssistant, config_entry: MockConfigEntry, options: dict
) -> None:
    config_entry.add_to_hass(hass)
    result = await hass.config_entries.options.async_init(config_entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    assert CONF_SELECTED_LISTS not in result["data_schema"].schema

    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_READ_ONLY: False}
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert config_entry.options == {CONF_READ_ONLY: False, **options}


async def test_options_default_drops_lists_no_longer_available(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    stale = "1f7b0000-0000-4000-8000-0000000000ff"
    hass.config_entries.async_update_entry(
        setup_integration, options={CONF_SELECTED_LISTS: [GROCERIES_ID, stale]}
    )
    result = await hass.config_entries.options.async_init(setup_integration.entry_id)

    field = next(k for k in result["data_schema"].schema if k == CONF_SELECTED_LISTS)
    assert field.description["suggested_value"] == [GROCERIES_ID]
