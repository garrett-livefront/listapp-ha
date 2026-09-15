# Lovelace card

A branded "Listapp list" card, design variant 1b "quiet rail", ships **inside** this integration so a
single HACS install gives users both the entities and the card — no separate HACS frontend
repository or manual resource add. Plan and decisions:
<https://forge.radhangs.com/listapp-ha-integration-plan-b2h9rr/>.

Slice 1 (`card-data-registration`) shipped the attribute contract and delivery. Slice 2 (`card-ui`)
is the card itself. Slice 3 adds the visual editor; slice 4 the README section and screenshots.

All card-facing strings (the picker name/description, dialogs, empty and error states) use
"Listapp" — the in-product brand casing — even where the integration's own docs and translations
say "ListApp" (Copilot review comment on PR #14).

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
- The URL carries `?v=<content hash>` for cache busting, computed once at registration from the
  bundle file's own bytes (`hashlib.sha256(...).hexdigest()[:12]`), not the integration version.
  `manifest.json` doesn't move on every slice that touches the card, but a version-keyed URL only
  invalidates the browser cache when it does — an installation that cached an earlier bundle at
  `?v=0.1.0` would keep serving it across an upgrade that changes the JS without a version bump.
  Hashing the bundle ties the URL to what's actually shipped. `StaticPathConfig` is registered with
  `cache_headers=True` — the versioned URL, not a no-cache header, is what invalidates the bundle on
  update, so the static path should cache long-lived like any other bundled asset (Copilot review
  comment on PR #13; the hash-vs-version-bump choice is a Copilot review comment on PR #14).
- `manifest.json` depends on `frontend` and `http` (previously just `auth`), since both must be set
  up before `async_register_frontend` runs.

### Why not a separate resource install step

A HACS "plugin" repository (or a `lovelace_resources` entry the user adds by hand) would mean two
HACS installs, or a manual step, to get the card. Bundling in the integration and self-registering
gets both from one install — same reasoning as HA's own "local brand images" approach for the
`brand/` directory.

## Architecture

Source lives in `frontend/` at the repo root (Lit 3 + TypeScript, bundled by esbuild). The build
output is **committed** at `custom_components/listapp/frontend/listapp-list-card.js` because HACS
installs straight from the git repository — there is nowhere for a bundler to run on the user's
instance. The bundle is a single dependency-free ES module (~58 KB minified, ~20 KB gzipped, of
which Lit is roughly two thirds).

| Module | Role |
| --- | --- |
| `src/listapp-list-card.ts` | the `LitElement`; rendering, subscriptions, event handlers, styles |
| `src/model.ts` | pure state derivation: split/collapse items, viewer gating, card state, availability classification, move → `previous_uid` |
| `src/config.ts` | option defaults and validation, `getStubConfig` |
| `src/color.ts` | `avatarColor` port, palette (accent / glyph / ink / tint) and contrast maths |
| `src/icons.ts` + `src/icons.generated.ts` | lucide path data for the 26 list icons and the card's UI glyphs |
| `src/ha.ts` | the slice of the HA frontend API the card touches: types, service and websocket helpers, `navigate` |
| `src/strings.ts` | every user-facing string (English only — see [Open questions](#open-questions)) |

Everything in `model.ts`, `config.ts`, `color.ts` and `icons.ts` is DOM-free and unit-tested under
`frontend/test/` with vitest in node. The element itself is verified in the [harness](#harness).

### Behaviour mirrors the stock to-do card

The card adapts Home Assistant's `hui-todo-list-card` (Apache-2.0; credited in `NOTICE`) rather than
inventing its own semantics, so the item operations it supports behave exactly as they do in the
stock card (due dates, descriptions and the stock card's display-order option are not in this slice):

- Items come from the websocket subscription `todo/item/subscribe` (re-subscribed when the entity
  changes, unsubscribed on disconnect), not from polling `todo/item/list`.
- Checking/unchecking calls `todo.update_item` with `status` after an optimistic local status
  change (so a second tap before the subscription update toggles the new state, not the old one);
  adding calls `todo.add_item`;
  rename calls `todo.update_item` with `rename`; delete and "Clear completed" call
  `todo.remove_item` with a list of uids; reorder calls the websocket `todo/item/move` with
  `previous_uid` (`undefined` for "move to top"), after an optimistic local reorder that is rolled
  back if the call rejects (unless a subscription update has replaced the items meanwhile).
- Every service call goes through `_call`, which on rejection fires HA's `hass-notification` event
  (the same toast the stock card gets from `showToast`) with "Listapp couldn't save that change.
  Try again." and re-renders so a checkbox snaps back to the real state. A rejected `add_item`
  leaves the typed text in the field, a rejected rename or delete keeps the dialog open, and a
  failed `todo/item/subscribe` clears the subscription state so the next `hass` update retries it;
  a failed `remove_item` also keeps the confirm-clear dialog open, matching the single-item delete
  path; reconnecting (`connectedCallback`) re-runs availability tracking instead of trusting a stale
  guard (Copilot review comments on PR #14).
- `unknown` is treated like `unavailable`.
- Menus are exactly the stock card's: the Active section's ⋯ offers "Reorder items" / "Done
  reordering" only when the entity supports `MOVE_TODO_ITEM`; the Completed section's ⋯ offers
  "Clear completed" (with a confirmation) only when it supports `DELETE_TODO_ITEM`. There is no
  header menu and no footer. Reorder mode also ends if the entity loses `MOVE_TODO_ITEM` mid-session
  (a role demotion), not just when the active list empties (Copilot review comment on PR #14).
- `getCardSize` grows with the visible rows; `getGridOptions` reports 12 columns (min 6) and
  `rows: "auto"` so the sections view sizes it to content.

### Why no `ha-*` elements

Custom cards can only rely on HA elements that are guaranteed to be defined on every dashboard.
`ha-card` is; `ha-checkbox`, `ha-textfield`, `ha-sortable`, `ha-dropdown`, `ha-dialog` and the
to-do item edit dialog are lazily loaded by HA's own panels and may not exist when this card
renders. Rather than race that, the card uses native controls styled with HA's theme variables:

- a real `<input type="checkbox">` inside a 44 px `<label>` (the box is a styled sibling span);
- a native `<input>` + `<button type="submit">` for the add row;
- a native `<dialog>` (`showModal`) for the edit and confirm dialogs, styled like `ha-dialog`;
- HTML5 drag-and-drop for reorder, with a focusable grip button that moves the item with
  ArrowUp/ArrowDown so reorder is keyboard-accessible (the stock `ha-sortable` is pointer-only);
- a small absolutely-positioned menu for ⋯, closed on outside click or Escape.

If HA later exposes a stable public element set for custom cards, swapping these is contained to
`listapp-list-card.ts`.

## Options

YAML only in this slice; the visual editor is slice 3. `getStubConfig` picks the first
`todo.listapp_*` entity so the card picker preview works. The picker calls it with only `hass`
(no `entities`/`fallback` arguments), so it falls back to `hass.states` rather than requiring
them (Copilot review comment on PR #14).

| Option | Default | Notes |
| --- | --- | --- |
| `entity` | required | a well-formed `todo.<object_id>` entity id; anything else throws in `setConfig` |
| `title` | entity's friendly name | override |
| `use_list_color` | `true` | `false` uses the theme's `--primary-color` as the accent |
| `show_title` | `true` | `false` hides the title text only; the icon tile and subline stay (as in the design) |
| `show_add` | `true` | the add field; always hidden for viewers regardless |
| `show_completed` | `true` | the Completed section |
| `show_progress` | `true` | the progress bar under the header |
| `collapse_to` | `0` (off) | show N active items and a "Show N more" disclosure; must be a non-negative integer |
| `item_tap_action` | `toggle` | `toggle` checks/unchecks on tap; `edit` opens the rename/delete dialog. The checkbox itself always toggles |

## States

Derived in `model.ts#deriveView`, in priority order:

| State | When | Shows |
| --- | --- | --- |
| `missing` | entity not in `hass.states` | warning row "Entity not found" |
| `unavailable_auth` | entity `unavailable`/`unknown` **and** a `listapp` reauth flow is in progress (or the config entry is in `setup_error` with an auth-flavoured reason) | replaces header and body: warning triangle, "List unavailable", "Listapp needs you to sign in again…", **Sign in** |
| `unavailable_transient` | `unavailable`/`unknown` otherwise | same layout with a cloud-off icon, "Can't reach Listapp right now", **Check integration** |
| `loading` | subscribed, no message yet | header only |
| `empty` | zero items | check-square tile, "Nothing on this list", "Add the first item above, or ask Assist to add one." (with `show_add: false`: "Ask Assist or the Listapp app to add the first item."; viewers see "Nothing has been added yet.") |
| `all_done` | items but no active | accent circle with a check, "All done", "Every item on this list is checked off." or "N completed items are hidden." when `show_completed: false` |
| `list` | otherwise | Active and Completed sections |

**Viewer** is `role == "viewer"` **or** `supported_features` lacking `CREATE_TODO_ITEM` or
`UPDATE_TODO_ITEM`. Viewers get no add field, no menus, no checkbox interaction (the input is
`disabled`), no hover tint, no reorder, and the subline reads "N items · view only". Both signals
are checked because the integration's `supported_features` is what HA actually enforces, while
`role` is what ListApp says; if they ever disagree the card errs on the read-only side.

### Auth vs transient unavailability

The entity state alone can't tell the two apart — both are `unavailable`. On entering that state the
card calls `config_entries/get` (domain `listapp`) and `config_entries/flow/progress` and classifies
(`model.ts#classifyAvailability`): a flow with `handler == "listapp"` and `context.source ==
"reauth"` means auth; failing that, a `setup_error` entry whose `reason` mentions auth/token/sign
in; otherwise transient. Both checks are scoped to the entity's own config entry — looked up once per
entity via `config/entity_registry/get` — so with two ListApp accounts linked, a reauth on account A
doesn't put account B's cards into the auth state (Copilot review comment on PR #14). If the registry
lookup fails the scope widens to any `listapp` entry. It re-checks every 30 s while unavailable and
resets when the entity recovers. If the websocket calls themselves fail, it falls back to transient.
The unavailable layouts replace the header entirely (the design's choice), so there is no
"Unavailable" subline. The integration
starts the reauth flow itself (`ConfigEntryAuthFailed` and `todo.py`'s `_async_write`), so the flow
check is the authoritative signal.

**Sign in** and **Check integration** both navigate to `/config/integrations/integration/listapp`
via `history.pushState` + a `location-changed` event — the same mechanism HA's own `navigate()`
uses. That page shows the "Reconfigure"/reauth banner for the entry, which is what HA does for any
entry needing reauth. Deep-linking straight into the reauth flow dialog isn't exposed to custom
cards.

### Wide layout

A `ResizeObserver` on the host adds `.wide` at ≥ 560 px, which lays each item list out as a
two-column CSS grid (row-major, so DOM order still equals list order for drag-and-drop). Header,
progress, add field and section labels stay full width. There is no inner scroller at any width.

## Colour

Accent = the entity's `color` attribute when it parses as hex; otherwise `avatarColor(list_id)`,
ported **verbatim** from listapp-mobile `lib/avatar.ts` so a list with no saved colour looks the
same in HA as in the app. `frontend/test/color.test.ts` pins eleven seed → colour vectors computed
by running the mobile function under node, including one long enough to overflow int32 (the `| 0`
matters). If the mobile palette or hash changes, those vectors fail here.

From the accent, `color.ts#buildPalette` derives:

- **glyph** — the colour of white-on-accent content (tile icon, checked tick, the Sign in and Save
  button labels). White is used when it reaches WCAG 3:1 against the accent, else a near-black
  `#1c1917`. 3:1 is the graphics threshold; the 14 px/700 button labels on mid-tone accents such as
  `#3b82f6` (white at ~3.7:1) sit below the 4.5:1 text threshold. Kept deliberately so the buttons
  match the design's accent-filled look (Copilot review comment on PR #14, flagged to Garrett). Of the
  app's 14 colours, white fails on lime `#84cc16`, yellow `#eab308`, amber `#f59e0b`, green
  `#22c55e`, teal `#14b8a6`, cyan `#06b6d4`, sky `#0ea5e9` and orange `#f97316` — so those eight
  get a dark glyph. This is a deliberate departure from the design's "white glyph" and is tested.
- **ink** — accent-coloured text and icons on the card background ("Show N more", the +, links).
  Dark themes lighten the accent by 38 % as the design does. Light themes darken it in 12 % steps
  until it reaches 4.5:1 against `--card-background-color` (or reaches black), which for the app's
  palette only affects the light accents above (yellow becomes an olive, lime a moss green).
- **tint** — the accent at 18 % alpha (dark) or 10 % (light) for the empty-state tile.
- **field / hover / track** — the neutral surfaces the design draws as fixed greys (add field
  background, row and menu hover, progress track). They are translucent black or white at the
  design's alpha, so they sit on whatever `--card-background-color` the theme has instead of
  hard-coding a grey.

Dark mode is `hass.themes.darkMode`, falling back to `prefers-color-scheme`; the card background is
read from the computed `--card-background-color`. With `use_list_color: false` the accent is the
computed `--primary-color` (fallback `#03a9f4`).

## Icons

The `icon` attribute holds one of the 26 lucide keys the mobile app allows
(`lib/list-appearance.ts`). `frontend/scripts/gen-icons.mjs` reads those icons' node data from the
pinned `lucide` npm package and writes `src/icons.generated.ts` (also the 14 UI glyphs the card
uses), so the SVG paths are bundled and nothing is fetched at runtime. Two keys differ from lucide's
current names and are mapped in the script: the app's `home` is lucide's `house`, and `utensils` is
`utensils-crossed` (matching the app's `UtensilsCrossed` import). Unknown or null keys fall back to
`list-checks`. Lucide is ISC-licensed; the notice is in `NOTICE` and the bundle banner.

## Design fidelity

Sizes, weights, letter-spacing, radii, padding and gaps in `listapp-list-card.ts`'s styles are the
design's values verbatim (variant 1b "quiet rail", `HA Todo Card.dc.html` in the Claude Design
project): 38 px tile with an 11 px radius, 17.5 px/800 title at −0.2 px tracking, 12.5 px/600
subline, 5 px progress bar, the add field as a filled block with a 2 px accent underline and the +
on the right, 12 px/800 section labels at 1.2 px tracking, 22 px checkboxes with a 7 px radius,
15.5 px item text (600 active, 500 struck-through completed), 13.5 px/700 "Show N more". Deliberate
departures from the mock, all decided before the build: HA theme variables and font instead of the
fixed greys and Manrope; no header ⋯ and no "shared by" footer; a dark glyph on low-contrast accents;
native controls; the transient-unavailable and viewer-empty wording. The card's outer radius, border
and shadow are left to `ha-card` so it matches the neighbouring cards in any theme, rather than
forcing the mock's 16 px. The ⋯ is drawn as three 3.5 px dots in CSS, not a lucide glyph, to match
the mock's horizontal ellipsis.

## Theming

Only the accent comes from the list. Everything else is HA theme variables —
`--card-background-color`, `--primary-text-color`, `--secondary-text-color`, `--divider-color`,
`--primary-color`, `--error-color`, `--warning-color`, `--ha-card-border-radius`,
`--ha-card-box-shadow` — and the font is inherited (`--ha-card-font-family`), so the card follows
any HA theme and light/dark automatically. None of the design's fixed greys or its Manrope face are
used.

## Accessibility

Checkboxes are real inputs with `aria-label` ("Mark X done" / "not done") inside a 44 px label. The
item text is a `<button>` when tapping does something. Grip handles are buttons with a descriptive
label and ArrowUp/ArrowDown reorder, and focus stays on the moved item's handle. Menus use
`aria-haspopup`/`aria-expanded` and `role="menu"`; the progress bar is `role="progressbar"`.
Every focusable control has a visible focus ring in the accent ink.

## Build

```bash
cd frontend
npm ci
npm run build        # gen icons are separate: npm run gen:icons
npm run dev          # esbuild serve + watch → http://127.0.0.1:8000/ (the harness)
npm run lint && npm run typecheck && npm test
npm run check:fresh  # rebuilds and fails if the committed bundle/icons differ
```

`.github/workflows/card.yml` runs lint, typecheck, tests and `check:fresh` on every PR. The
freshness check is what keeps the committed bundle honest: esbuild's output is deterministic for
a given input and pinned toolchain (exact versions in `package.json`, `package-lock.json` via
`npm ci`), so a PR that changes source without rebuilding, or rebuilds with a different esbuild,
fails CI. `frontend/dev/dist/` is gitignored — the dev server builds there, never over the
committed file.

## Harness

`frontend/dev/index.html` mounts the card against a mock `hass` (`dev/harness.js`) for every state
and option, side by side in HA-like light and dark themes, at an adjustable card width. The mock
implements `states`, `themes.darkMode`, `connection.subscribeMessage`, `callWS` (config entries,
flow progress, `todo/item/move`) and `callService` (add / update / remove), mutating an in-memory
list and pushing updates to subscribers so toggling, adding, renaming, deleting, clearing and
reordering all round-trip. Query parameters: `?scenario=N` (single scenario), `?width=px`,
`?wide=1`. Slice 4 reuses it for README screenshots. It is not shipped.

## Licences

See `NOTICE`: HA frontend (Apache-2.0, behaviour adapted), Lit (BSD-3-Clause, bundled), lucide
(ISC, path data bundled; some icons Feather-derived, MIT).

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

Card unit tests (`frontend/test/`, 86 cases): state derivation and priorities, collapse, viewer
gating, option defaults and validation, the `avatarColor` vectors, glyph/ink contrast over all 14
colours, icon key mapping, availability classification, and move → `previous_uid`.

## Open questions

- **Strings are English only.** Custom cards can't add keys to `hass.localize`; shipping our own
  translations means a small i18n table keyed on `hass.language`. Not done in this slice.
- **Unavailable for other reasons.** An entity also goes `unavailable` when its list disappears
  from the coordinator (deleted or unshared). That currently reads as transient; if it should say
  something else, the coordinator would need to expose why.
