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

`const.py` holds `API_BASE_URL` and `OAUTH_BASE_URL`. Production hosts (decision D9, 2026-09-14):
`API_BASE_URL` is `https://listapp.radhangs.com/api/v1`; `OAUTH_BASE_URL` is
`https://listapp.radhangs.com/ha`, with the reverse proxy stripping `/ha` before it reaches Hydra
(so the authorize/token URLs are `.../ha/oauth2/auth` and `.../ha/oauth2/token`). See the plan:
https://forge.radhangs.com/listapp-ha-integration-plan-b2h9rr/

There's deliberately no user-facing URL field: this integration talks to one service. For local
development, the environment variables `LISTAPP_API_BASE_URL` and `LISTAPP_OAUTH_BASE_URL`
override both, and they're read when the integration module is imported. See the README.

## Entities

- **One `todo` entity per selected list** (see [List picker](#list-picker)), each filled from
  `GET /lists/{id}`. `unique_id` is `<account id>_<list id>`, so the same shared list linked through
  two accounts gives two distinct entities.
- **One service device per account**, named "ListApp", so entity IDs come out as
  `todo.listapp_<list title>`. The entry title is the account email, to tell entries apart.
- **Lists disappear, but never appear, on their own.** A selected list that is deleted or whose
  access is revoked (a 404 on poll, or `list.deleted`/`member.deleted` on the stream) is dropped
  from the selection and its entity removed from the registry, so there are no orphaned
  `unavailable` entities, including lists deleted while Home Assistant was stopped. A newly shared
  list only appears once it's picked in the options flow.
- **Writes:** create (appended at `max(position) + 1`), update (rename, check, uncheck), delete,
  and move (sends the full order to `PUT /items/reorder`). Each write asks the coordinator for a
  debounced refresh.

### <a id="roles"></a>Viewer lists are read-only up front

`ListAppList.my_role` (`"OWNER" | "EDITOR" | "VIEWER" | None`) is the caller's own role, from
`ListResponse.myRole` (listapp-api#106; `listapp-api` `docs/oauth.md#my-role`). `ListAppCoordinator.can_write_list`
combines it with the global read-only option/scope: a `VIEWER` list gets `TodoListEntityFeature(0)`,
same as global read-only, and `OWNER`/`EDITOR` behave as before.

- **REST responses always set `my_role`** (`GET /lists/{id}` via `ListAppClient._parse_list`), so
  every poll and refresh has the current value.
- **`list.updated` never carries a role** (the event fans one payload out to every member — a role
  baked in would be the publisher's, not the recipient's) and the coordinator's handler for it
  never touches `my_role`, so a null there can't clear a role already known from REST.
- **A role change arrives as `member.upserted` naming the account.** When the payload carries a
  `role`, the coordinator updates it directly; when it doesn't, the coordinator schedules a
  refresh instead of guessing.
- **A poll already in flight when a demotion lands can't revert it, but a later poll can still
  recover from a missed event.** The direct update records the role in `_role_overrides` along
  with a poll generation counter; `_async_update_data` reapplies the override only onto polls that
  had already started before the event landed. Any poll that *starts* afterward is trusted
  outright, override cleared, even if it disagrees — so the override can't get stuck forever
  contradicting a role change whose event never arrived. (Copilot review comments on PR #5.)
- **A missing `myRole` field** (an older server) parses as `None`, which `can_write_list` treats
  like "unknown" — same as H2: the write is attempted and a 403/404 raises "may be view-only".
- **`supported_features` updates on the next coordinator refresh with no reload.** `TodoListEntity`
  re-reads it every time `CoordinatorEntity` writes new state, which HA already does on every
  coordinator update — the same mechanism the global read-only option already relied on.

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

H2 polled every 60 seconds for every list the account could reach. H3 replaces discovery-by-poll
with a user-chosen selection and live updates over one SSE connection; `iot_class` is `cloud_push`.

### <a id="list-picker"></a>List picker

Entities exist only for lists the user selects, at setup (`config_flow.py`'s `select_lists` step,
after linking the account) and in the options flow (added to the existing `init` step, alongside
read-only mode). Both share `_lists_schema()`, a `cv.multi_select` built from `GET /lists`, requiring at least one
(checked in the step handler — wrapping `cv.multi_select` in `vol.All` breaks HA's form
serialization) and capped at 25 (`MAX_SELECTED_LISTS`) — server-enforced too (`listapp-api` `docs/realtime-updates.md#ha-item-stream`).
Exceeding it re-shows the form with a `too_many_lists` error rather than truncating silently.

- **At setup, a failed `GET /lists` aborts** (`oauth_unauthorized` for a 401, `cannot_connect`
  otherwise). Creating the entry with an empty selection would stick, because the H2 migration only
  runs for entries with no selection at all.
- **In the options flow, the picker is optional.** When the entry isn't loaded (setup retry or
  error, so there's no client) or `GET /lists` fails, the form shows only read-only mode and
  submitting it keeps the stored selection. Read-only mode stays changeable during an outage, and
  an empty option set can't wipe or invalidate the selection. The default also drops stored ids
  that `GET /lists` no longer returns. (Copilot review comments on PR #4.)

**H2 migration.** An H2-era entry has no `CONF_SELECTED_LISTS` option. `__init__.py`'s
`_async_migrate_selection` runs once per entry, on the first H3 setup: if the option is absent, it
fetches `GET /lists` and writes the first 25 ids as the selection via
`hass.config_entries.async_update_entry`, so the entry looks exactly like a freshly-created H3 entry
from then on and the migration never runs again for it.

### Stream client (`stream.py`)

One `aiohttp` SSE reader per config entry (`ListAppEventStream`), started in `async_setup_entry`
after the first refresh and cancelled via `entry.async_on_unload` — covers both unload and reload.
It runs as an entry background task (`entry.async_create_background_task`), so HA tracks it and
cancels it on shutdown. It isn't started at all when no list is selected — there's nothing to
stream, and the server would answer the empty `lists=` with a 400 that logs as a rejected selection.

- **Parsing** (`parse_sse`) follows the SSE field rules: `data:` lines join with `\n` before
  dispatch, `event:` sets the type for that one event (default `message`), lines starting with `:`
  are comments (including the server's `: heartbeat` frames) and are skipped, and a blank line
  dispatches. Bytes are decoded with `errors="replace"`, so a garbled frame reaches the coordinator
  as undecodable JSON and is skipped instead of killing the reader.
- **Heartbeat timeout** is `aiohttp.ClientTimeout(sock_read=...)` at 2.5x the server's 25s
  heartbeat period, not a manual watchdog — aiohttp already raises `TimeoutError` when no bytes
  arrive in that window, which is indistinguishable from a dead connection for our purposes.
- **401** → `on_auth_failed`, wired to `config_entry.async_start_reauth`. **400** (malformed/too-many
  selection — shouldn't happen given the picker's own cap, but the server is the source of truth) →
  `on_selection_rejected`, logged once, and the loop stops retrying so a broken selection doesn't
  spin. Everything else retryable (503, network errors, a clean close, the heartbeat timeout) →
  exponential backoff with jitter, the jittered delay capped at `STREAM_BACKOFF_MAX_SECONDS` (60s), resetting to
  `STREAM_BACKOFF_INITIAL_SECONDS` (1s) after any successful connection. Any other exception is a
  last-resort catch: logged at WARNING and retried on the same backoff, so an unforeseen bug degrades
  to reconnects rather than a silently dead stream. `CancelledError` isn't an `Exception`, so
  `stop()` still ends the loop. Tests that wait on background tasks stop the stream first.
- The access token is refreshed via the same `OAuth2Session`-backed closure the REST client uses,
  called fresh before every (re)connect attempt. A refused refresh (`ListAppAuthError`) is a 401;
  any other refresh failure retries with backoff, so a token-endpoint outage never starts reauth.
  Tokens never appear in a log line.
- **The `lists=` query is rebuilt on every (re)connect** from the coordinator's current
  `_active_ids`, not fixed at construction. A list dropped mid-stream (deleted, revoked, 404) would
  otherwise be resent on reconnect, and the server's `400` for it stops the stream for every other
  list until a reload. (Copilot review comment on PR #4, round 3.)
- **A selection that empties at runtime stops the loop quietly instead of connecting.** At runtime
  the selection can only shrink (`list.deleted`, `member.deleted`, a 404 on poll) — growing it goes
  through the options flow, which reloads the entry and starts a fresh stream — so there's no
  scenario where an empty selection here is transient. Connecting anyway would just draw the same
  server `400` as an over-full selection, but logged as an error on every reconnect instead of once.
  (Copilot review on PR #6.)
- **Connect timeout** is `REQUEST_TIMEOUT_SECONDS`, separate from the read timeout, so a stalled
  DNS lookup or TCP connect enters backoff instead of hanging the task.

### <a id="event-frames"></a>Event frames

Verified against `listapp-api` `hacs-integration` (`SelectedListEventRoutes.kt`, `ListEventBus.kt`),
not inferred. Each frame's SSE `event:` is the type, and `data:` is the whole `ListChangeEvent`
envelope, not the bare payload:

```json
{"listId": "…", "type": "item.deleted", "payload": {"id": "…"}, "originUserId": "…", "updatedAt": "…"}
```

- The list id comes from the envelope. Only `item.upserted` (`ListItemResponse`) and `list.updated`
  (`ListResponse`) payloads carry one of their own; `item.deleted`/`list.deleted` are `DeletedRef`
  `{id}`, `member.deleted` is `MemberDeletedRef` `{id, userId}` where `id` is the *membership* id,
  and `items.reordered` is `ReorderedItemsRef` `{items: [{id, position}]}`.
- `AppJson` pretty-prints, so the envelope spans several `data:` lines. Ktor also writes `data:`
  before `event:` and ends lines with `\r\n`; the parser handles all three.
- `list.updated`'s `myRole` is always null (listapp-api#106) — see [Roles](#roles) for why the
  coordinator ignores it there instead of reading it.
- `originUserId` is ignored: Home Assistant has no optimistic update to de-duplicate against.

`tests/helpers.py` builds fixtures from those Kotlin field names and encodes frames the way Ktor
does, so a test can't agree with a wrong guess about the shape.

### Applying events (`coordinator.py`)

`item.upserted`/`item.deleted`/`items.reordered` and `list.updated` mutate the coordinator's data
directly (safe: the payload carries everything the entity needs). `list.deleted`, and
`member.deleted` naming the connected account, remove that list from `data` and from the coordinator's
working selection (`_active_ids`), so the safety-net poll stops expecting it too — the todo platform's
existing `sync_entities` listener does the rest (see "Lists appear and disappear" above).
`member.upserted` naming the connected account updates `my_role` — see [Roles](#roles).

**Batching.** Each valid event is queued and schedules `_flush_batch` via `hass.loop.call_later`
if one isn't already pending (`STREAM_BURST_SECONDS` = 0.5s), so a burst lands as one
`async_set_updated_data` call. The queue holds the events, not a snapshot of the data: the flush
replays them onto whatever `data` is current, so a safety-net poll finishing mid-batch isn't
overwritten by a stale copy. Each event is also trial-applied to a scratch copy when it arrives,
so a malformed payload is dropped then and can't fail the flush. (Copilot review comment on PR #4.)

- **Replay can briefly re-apply an event a poll already superseded, deliberately.** If a poll
  returns a newer edit before an older queued event flushes, the flush writes the older value. It
  isn't corrected with `updatedAt` or a poll/flush lock, because the newer edit also arrives on the
  stream as its own event, queued after the older one and replayed after it, so the data converges
  within the same burst or the next one. Only a *dropped* newer event leaves the stale value, and
  that's the same exposure as any missed event, which the safety-net poll exists for. (Copilot
  review comment on PR #4, round 2.)
- **A poll result is filtered against `_active_ids` when it returns**, not only when it starts, so a
  `list.deleted`/`member.deleted` that lands while the requests are in flight isn't undone by the
  poll re-adding that list. (Copilot review comment on PR #4, round 2.)

### Safety-net poll

`update_interval` switches with the stream's connection state: `POLL_INTERVAL_STREAMING` (15
minutes) while connected, `POLL_INTERVAL_FALLBACK` (60 seconds, H2's old interval) whenever it
isn't — including while backing off, and permanently for a `400`-rejected selection. Setting
`update_interval` alone doesn't move a refresh HA has already scheduled, so a change also calls
`_schedule_refresh()`; without it, a dropped stream could wait out the rest of a 15-minute timer. The poll only
ever re-fetches `_active_ids`, never rediscovers new lists; picking up newly-shared lists is a
picker/options-flow action, not something polling or the stream does automatically (`docs` for the
server route: newly-shared lists are deliberately not added mid-stream either).

## Review outcomes from PR #3 (H2)

Recorded here since they're answered questions worth not re-litigating:

- **`translations/en.json`, no `strings.json`.** Custom integrations ship translated strings
  directly; `strings.json` is the source file HA core integrations generate translations *from*, and
  `hassfest` doesn't require it for a custom component.
- **`todo.update_item` and unchecking.** HA's todo entity platform fills in the item's current
  status before calling the integration's `async_update_todo_item` when a service call only supplies
  a rename, so renaming an item never unchecks it as a side effect.
- **Token refresh and `scope`.** HA's OAuth2 implementation merges a refreshed token into the stored
  one rather than replacing it, so a refresh response that omits `scope` (some issuers do) doesn't
  lose it — the previously granted scope survives.
- **Entity-registry removal unloads the live entity.** Calling `registry.async_remove` on an entity
  backed by a currently-loaded platform also removes it from the running entity platform, not just
  the registry — `sync_entities` doesn't need to also touch the live entity itself.
