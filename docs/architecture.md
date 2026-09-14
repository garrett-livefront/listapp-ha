# Architecture

How the integration links an account, turns lists into entities, and maps API errors. The server
side lives in `listapp-api`: `docs/oauth.md` (Hydra, scopes, the resource-server rules) and the
OpenAPI spec. The plan and its decisions:
<https://forge.radhangs.com/listapp-ha-integration-plan-b2h9rr/>.

## Auth

OAuth2 authorization code with **PKCE**, against Ory Hydra, through HA's
`config_entry_oauth2_flow`.

- **The client is public and registered in code**, not through Application Credentials.
  `oauth.py` registers `LocalOAuth2ImplementationWithPkce` with client ID `listapp-home-assistant`
  and no secret. Application Credentials would make every user create and paste a client ID, which
  is exactly what the shared public client exists to avoid. Consequently the manifest does not
  depend on `application_credentials`; it depends on `auth`, which serves the
  `/auth/external/callback` view the flow returns through.
- **Registration is idempotent and happens lazily**, from both the config flow's user step and
  `async_setup_entry`. A config flow never runs the integration's `async_setup`, so registering
  there would leave a fresh install with no implementation. Re-registering would replace the
  object, and with it the PKCE verifier, under a flow that is mid-authorization.
- **The verifier is per implementation object, not per flow.** That is HA's design for
  `LocalOAuth2ImplementationWithPkce`. It stays secret to this HA instance and Hydra, so two
  concurrent flows sharing one verifier doesn't weaken anything that matters here.
- **Redirect.** HA uses `https://my.home-assistant.io/redirect/oauth` when the `my` integration is
  loaded (the default config), which is the redirect URI registered on the Hydra client.
- **Scopes.** `offline_access lists:read lists:write` by default. Read-only mode (options) requests
  `offline_access lists:read`. Scopes are chosen by the flow handler's `extra_authorize_data`, not
  the implementation, because the implementation is shared across entries.
- **Unique ID** is the ListApp user id from `GET /me`, so an account can't be linked twice, and a
  reauth with a different account aborts with `wrong_account`.
- **Reauth** starts on a 401 from the API, or when Hydra refuses a refresh (HA maps any 4xx from the
  token endpoint to `OAuth2TokenRequestReauthError`).
- **Read-only mode changes trigger reauth from `async_setup_entry`**, not from the options flow.
  The options flow reloads the entry, and a reauth started inside it was lost in that reload. On
  every setup, the entry checks the token's granted scope against the option. A mismatch in either
  direction starts reauth, and that also recovers a user who dismissed the reauth prompt. Until
  reauth completes, writes follow the *stricter* of the option and the token.

## <a id="endpoints"></a>Endpoints

`const.py` holds `API_BASE_URL` and `OAUTH_BASE_URL`. **Production hosts are not decided**, so
`OAUTH_BASE_URL` (`https://auth.listapp.radhangs.com`) is a placeholder that follows the example in
`listapp-api/docs/oauth.md`.

There's deliberately no user-facing URL field: this integration talks to one service. For local
development, the environment variables `LISTAPP_API_BASE_URL` and `LISTAPP_OAUTH_BASE_URL`
override both, and they're read when the integration module is imported. See the README.

## Entities

- **One `todo` entity per list** the account can reach (`GET /lists`), each filled from
  `GET /lists/{id}`. `unique_id` is `<account id>_<list id>`, so the same shared list linked through
  two accounts gives two distinct entities.
- **One service device per account**, named "ListApp", so entity IDs come out as
  `todo.listapp_<list title>`. The entry title is the account email, to tell entries apart.
- **Lists appear and disappear with polling.** New list IDs add entities. Vanished ones are removed
  from the entity registry, so there are no orphaned `unavailable` entities left behind — including
  lists deleted while Home Assistant was stopped, which the first refresh reconciles. A list
  deleted between the two requests is skipped rather than failing the whole refresh.
- **Writes:** create (appended at `max(position) + 1`), update (rename, check, uncheck), delete,
  and move (sends the full order to `PUT /items/reorder`). Each write asks the coordinator for a
  debounced refresh.

### Viewer lists can't be detected in advance

The settled decision is that viewer-role lists are read-only, but the API doesn't expose the
caller's role. `ListResponse` has `ownerId` and `members` without roles, and
`GET /lists/{id}/members` isn't on the OAuth allowlist. So every list advertises write features
when the token allows writing, and a viewer's write is refused by the server with **404**. The API
hides viewer lists as not found. The integration raises a `HomeAssistantError` saying the list may
be view-only. To mark viewer lists read-only up front, the API needs to add the caller's role to
`ListResponse`, and that's an API slice.

## Error mapping

The API client raises its own exceptions. The coordinator and the entities map them to HA's.

| API result | During refresh / setup | During a write |
| --- | --- | --- |
| 401, or a 4xx on token refresh | `ConfigEntryAuthFailed` (reauth) | reauth started, `HomeAssistantError` |
| 403 (missing scope) / 404 | 404 on one list: skipped | `HomeAssistantError` "refused / view-only" |
| 5xx, network error, timeout, 5xx/429 on token refresh | `UpdateFailed` (`ConfigEntryNotReady` at setup) | `HomeAssistantError` "try later" |

**A 503 never triggers reauth.** `listapp-api` answers 503 when Hydra introspection is down, so
treating it as auth failure would push every user through consent during an outage.

Read-only mode (scope or option) clears the entity's write features, so HA refuses those service
calls with a `ServiceValidationError` before any request is made.

## What H3 adds

H2 polls every 60 seconds (`UPDATE_INTERVAL`). H3 replaces that with live updates. It adds a list
picker at setup, one account SSE stream for the selected lists (`/me/events` with item events),
about 0.5 s of batching before entity updates, a catch-up sync after reconnects, and a slow
safety-net poll. `iot_class` goes back to `cloud_push` then.
