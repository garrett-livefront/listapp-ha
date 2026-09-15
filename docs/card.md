# Lovelace card

A branded "ListApp list" card, design variant "quiet rail", ships **inside** this integration so a
single HACS install gives users both the entities and the card — no separate HACS frontend
repository or manual resource add. Plan and decisions:
<https://forge.radhangs.com/listapp-ha-integration-plan-b2h9rr/>.

This slice (card-data-registration) ships the data contract and the delivery mechanism, with a
placeholder card. Slice 2 replaces the placeholder with the real "quiet rail" card.

## Attribute contract

Each `todo.listapp_<list>` entity exposes on `extra_state_attributes`:

| Attribute | Type | Source |
| --- | --- | --- |
| `list_id` | `str` | the list's id |
| `color` | `str \| None` | `ListResponse.color` (a hex string), or `None` |
| `icon` | `str \| None` | `ListResponse.icon` (an icon key, e.g. `shopping-cart`), or `None` |
| `role` | `str \| None` | `my_role` lower-cased when it's `OWNER`/`EDITOR`/`VIEWER`, else `None` |

No owner/sharer name is exposed — the card doesn't show "shared by" (Garrett decided this; see the
plan). Names are snake_case and stable; the card depends on them, so a rename here is a breaking
change for the card.

`color` and `icon` follow the same path as `title` and `my_role` already do (`api.py`'s
`_parse_list`, `ListAppCoordinator` polling, and the `list.updated` SSE handler) — see
[Roles](architecture.md#roles) for the precedent this follows, including why `list.updated`'s
`myRole` is ignored but its `color`/`icon` are applied directly (unlike role, they aren't
per-member).

`_unrecorded_attributes` excludes all four from the recorder: they're relatively static
configuration the card reads live, not history worth keeping, and including them would bloat the
recorder database for no benefit.

## Delivery

`frontend.py`'s `async_register_frontend` runs once per Home Assistant instance — guarded by a flag
in `hass.data[DOMAIN]`, which survives entry reloads and multiple config entries (there's no
per-instance "unregister" story for either `async_register_static_paths` or `add_extra_js_url`, and
HA doesn't need one: unlike a config entry's own resources, this reflects the *integration* being
installed, not any one account being linked). The flag is set only after registration succeeds, and
an `asyncio.Lock` in the same dict serializes concurrent config-entry setups so two entries can't
both pass the flag check before either has registered (Copilot review comment on PR #13).

- `custom_components/listapp/frontend/listapp-list-card.js` is served at
  `/listapp_frontend/listapp-list-card.js` via `hass.http.async_register_static_paths`
  (`StaticPathConfig`), the same mechanism popular custom card integrations (and HA core) use to
  serve a bundled file without a separate static file server.
- `homeassistant.components.frontend.add_extra_js_url` registers it as a global frontend resource,
  so every dashboard loads it automatically — the user never adds a Lovelace resource by hand.
- The URL carries `?v=<manifest version>` for cache busting: `add_extra_js_url` is called with the
  integration's `manifest.json` version (via `loader.async_get_integration`), so a HACS update that
  bumps the version invalidates any cached copy of the JS in the browser.
- `manifest.json` depends on `frontend` and `http` (previously just `auth`), since both must be set
  up before `async_register_frontend` runs.

### Why not a separate resource install step

A HACS "plugin" repository (or a `lovelace_resources` entry the user adds by hand) would mean two
HACS installs, or a manual step, to get the card. Bundling in the integration and self-registering
gets both from one install — same reasoning as HA's own "local brand images" approach for the
`brand/` directory.

## Testing

`tests/test_frontend.py` covers the "once per instance" guarantee directly: calling
`async_register_frontend` twice registers the static path and the extra JS URL exactly once, and
setting up two config entries plus a reload of one of them still registers exactly once. It pins
static-path registration via `HomeAssistantHTTP.async_register_static_paths`, patched only after
the real `http`/`frontend` components have done their own (unrelated) static-path registrations, so
the count reflects only this integration's call.

`tests/test_coordinator.py` and `tests/test_todo.py` cover `color`/`icon` through a poll, a
coordinator refresh, and a `list.updated` SSE event, for owner/editor/viewer lists with and without
color/icon set.

Running the frontend component in tests requires `home-assistant-frontend` (the `frontend`
component's own pinned requirement) — see `requirements_test.txt` and `test.yml`'s minimum-HA
matrix, which pins the same package to the version the 2026.3 plugin's `frontend` component
requires.

## The card itself is a placeholder

`listapp-list-card.js` today is a minimal, dependency-free custom element: a
`customElements.define` guard, a `window.customCards` entry so it's discoverable in the card
picker, `setConfig` requiring `entity`, and a render of the entity's friendly name, its four
attributes above, and its item count in an `ha-card`.

**Slice 2 replaces it wholesale** with the actual "quiet rail" card, built with Lit and TypeScript.
It will still be committed as a single built JS bundle in this same location — HACS installs
straight from the git repository with no build step, so there's nowhere for a bundler to run on the
user's Home Assistant instance. The bundle is built and committed as part of that slice's PR, the
same way `brand/icon.png` is generated and committed rather than built at install time.
