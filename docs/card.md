# Lovelace card

A branded "Listapp list" card, design variant 1b "quiet rail", ships **inside** this integration so a
single HACS install gives users both the entities and the card — no separate HACS frontend
repository or manual resource add. Plan and decisions:
<https://forge.radhangs.com/listapp-ha-integration-plan-b2h9rr/>.

Slice 1 (`card-data-registration`) shipped the attribute contract and delivery. Slice 2 (`card-ui`)
is the card itself. Slice 3 adds the visual editor; slice 4 the README section and screenshots.

All card-facing strings (the picker name/description, dialogs, empty and error states) use
"Listapp" — the in-product brand casing (Copilot review comment on PR #14) — which the
2026-09-15 branding sweep also brought the rest of this repo's user-facing text into line with.

## Attribute contract

Each list's `todo` entity exposes on `extra_state_attributes`:

| Attribute | Type | Source |
| --- | --- | --- |
| `list_id` | `str` | the list's id |
| `list_color` | `str \| None` | `ListResponse.color` (a hex string), or `None` |
| `list_icon` | `str \| None` | `ListResponse.icon` (an icon key, e.g. `shopping-cart`), or `None` |
| `role` | `str \| None` | `my_role` lower-cased when it's `OWNER`/`EDITOR`/`VIEWER`, else `None` |

`list_color`/`list_icon` were `color`/`icon` until PR #23 — `icon` collides with HA's reserved
attribute, which broke the entity icon everywhere but the card; see
[Roles](architecture.md#roles) for the fallout and the fix. No back-compat alias: old names appear
nowhere in the final state.

No owner/sharer name is exposed — the card doesn't show "shared by" (Garrett decided this; see the
plan). Names are snake_case and stable; the card depends on them, so a rename here is a breaking
change for the card.

`list_color` and `list_icon` follow the same path as `title` and `my_role` already do (`api.py`'s
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
an `asyncio.Lock` in the same dict serializes concurrent setups so two callers can't both pass the
flag check before either has registered (Copilot review comment on PR #13).

### <a id="integration-level"></a>Why registration is at integration level, not per entry

`__init__.py`'s domain-level `async_setup` awaits `async_register_frontend`; `async_setup_entry`
does not. HA runs `async_setup` for the domain to completion before it sets up any of the domain's
config entries, so the static path and the extra-JS URL exist before anything that can be slow or
fail has run.

Registering from `async_setup_entry` instead — how this shipped originally — produced
"Configuration error" on every Listapp card after each HA restart or integration update, and an
endless spinner in the card picker, until the user manually reloaded the page (hit by Garrett and a
second user, 2026-09-15). The window is real and not small: browsers reconnect to a restarting HA
and the frontend starts serving dashboards immediately, while entry setup does an OAuth token
refresh, `_async_migrate_selection`, and `async_config_entry_first_refresh()` — three network calls
— before it finishes. A dashboard requesting `/listapp_frontend/listapp-list-card.js` inside that
window gets a 404, and **a failed ES module import is permanent for that page session**: the browser
caches the failure, the custom element never defines, and `hui-card` renders "Configuration error"
forever. Nothing re-fires when the entry finally loads. That asymmetry — a late registration costs a
broken page until reload, an early one costs nothing — is why this belongs as early as possible.

The same reasoning rules out gating it on anything else: the card asset is static and
account-independent, so an entry stuck in a reauth loop or retrying `ConfigEntryNotReady` must still
leave the card registered. It also can't sit behind a network call.

Ordering is safe by construction: `async_setup` only touches `hass.data[DOMAIN]`, `hass.http` and
the frontend's URL list, none of which the device or entity registries read — unlike the
registration ordering inside `async_setup_entry`, which does matter (see PR #20).

One accepted limitation: HA only sets a domain's component up when it has at least one config entry
(YAML is refused — `CONFIG_SCHEMA` is `cv.config_entry_only_config_schema`), so a fresh install with
zero entries doesn't register the card. There's nothing to show at that point, and adding the first
entry sets the component up, `async_setup` first.

- The whole `custom_components/listapp/frontend/` directory is served under `/listapp_frontend/` via
  `hass.http.async_register_static_paths` (`StaticPathConfig`), the same mechanism popular custom
  card integrations (and HA core) use to serve bundled files without a separate static file server.
  The directory, not the single entry file, is registered because the entry dynamically imports its
  sibling `listapp-list-card-impl.js`, which has to be reachable at the same base URL — see
  [Fast registration](#fast-registration).
- `homeassistant.components.frontend.add_extra_js_url` registers it as a global frontend resource,
  so every dashboard loads it automatically — the user never adds a Lovelace resource by hand.
- The URL carries `?v=<content hash>` for cache busting, computed once at registration from the
  bytes of **every** `*.js` in the frontend directory (`hashlib.sha256(...).hexdigest()[:12]`), not
  the integration version — so a change confined to the implementation chunk still busts the entry's
  cached URL. See [Cache busting across two files](#cache-busting).
  `manifest.json` doesn't move on every slice that touches the card, but a version-keyed URL only
  invalidates the browser cache when it does — an installation that cached an earlier bundle at
  `?v=0.1.0` would keep serving it across an upgrade that changes the JS without a version bump.
  Hashing the bundle ties the URL to what's actually shipped. `StaticPathConfig` is registered with
  `cache_headers=True` — the versioned URL, not a no-cache header, is what invalidates the bundle on
  update, so the static path should cache long-lived like any other bundled asset (Copilot review
  comment on PR #13; the hash-vs-version-bump choice is a Copilot review comment on PR #14).
- `manifest.json` depends on `frontend` and `http` (previously just `auth`), since both must be set
  up before `async_register_frontend` runs — which is also what makes calling it from `async_setup`
  safe.

### Why not a separate resource install step

A HACS "plugin" repository (or a `lovelace_resources` entry the user adds by hand) would mean two
HACS installs, or a manual step, to get the card. Bundling in the integration and self-registering
gets both from one install — same reasoning as HA's own "local brand images" approach for the
`brand/` directory.

## <a id="fast-registration"></a>Fast registration and the 2 s deadline

Fix for the intermittent "Configuration error after restart" Garrett and a second user hit on
2026-09-15 — the residue left after [integration-level registration](#integration-level) (PR #22)
closed the 404 window.

HA's `src/panels/lovelace/create-element/create-element-base.ts` decides whether a card is broken on
a **timer**. In `_customCreate()`, when `customElements.get(tag)` is undefined it builds an error
card, hides it with `display:none`, starts `setTimeout(..., TIMEOUT)` with `const TIMEOUT = 2000`,
and calls `customElements.whenDefined(tag).then(...)` which clears that timer and fires
`ll-rebuild`. So the tag winning the race is invisible to the user; losing it un-hides
"Configuration error". HA does still rebuild if the element defines later, but the visible damage is
done — on Garrett's instance the card stayed wrong until a hard refresh.

The old bundle was a single ~74 KB module calling `customElements.define` on its last line, so the
whole of Lit, the card, the icons and the editor had to be fetched *and evaluated* before the tag
existed. On a cold, just-restarted instance that regularly exceeded 2 s.

The entry module is now **3.2 KB** and does only what has to happen before the deadline: define
`listapp-list-card` and `listapp-list-card-editor`, push to `window.customCards`, and carry
`getStubConfig`/`getConfigElement` plus `resolveConfig` (all of `config.ts`, which is
dependency-free). The ~73 KB implementation moves to `listapp-list-card-impl.js`, pulled in by a
dynamic `import()` after the tags are already registered.

### Why not a Lovelace resource

Switching from `add_extra_js_url` to a Lovelace resource does not help: resources aren't awaited
either. `ha-panel-lovelace.ts` calls `loadLovelaceResources(...)` inside a `.then`, so dashboard
rendering races resource evaluation exactly as it races ours. The deadline is the problem, not the
delivery mechanism.

### The wrapper

`src/entry.ts` registers a thin `HTMLElement` that **hosts** the real element as a light-DOM child
once the chunk arrives, rather than upgrading in place. Hosting was chosen because the alternative —
defining the tag as a stub and later swapping its prototype — isn't something custom elements
support: a tag's class is fixed at `define` time, so an upgrade-in-place would mean re-defining a
registered tag, which throws. Light DOM (not a shadow root) keeps theme custom properties
inheriting as before and lets the editor's `config-changed` events bubble to HA untouched.

The wrapper has to behave correctly in the window before the implementation exists:

- `setConfig` runs `resolveConfig` **synchronously**, so a genuinely bad config still throws from
  `setConfig` the way HA expects, then stores the raw config for the implementation.
- The `hass` setter stores the latest value and replays it onto the implementation at mount, so a
  `hass` set during the gap isn't lost.
- `getCardSize()` mirrors the size the implementation reports **while items are loading**, which is
  the state the chunk actually mounts into: `1 + (show_header ? 1 : 0)`, because the progress bar
  and the add form are both suppressed during loading and there are no item rows yet. It falls back
  to the implementation's no-config answer of 3 when there is no config, or when the entity isn't in
  `hass.states` (the implementation's `missing` state, also 3). An earlier revision returned a flat
  3, which silently collapsed to 2 the instant the chunk mounted — the exact layout shift this
  wrapper exists to avoid (Copilot review comment on PR #24). The one case still not mirrored is
  `unavailable_auth` / `unavailable_transient`, where the implementation returns 3 and the wrapper
  says 2: those are derived from an availability probe the entry can't run without pulling the API
  client into the size-budgeted bundle, and they cost one row in an error state rather than on every
  normal load. `getGridOptions()` returns the exact `{ columns: 12, min_columns: 6 }` the
  implementation returns. Both delegate once the chunk has landed.
- Nothing is rendered during the gap. An empty card for a few hundred milliseconds beats a spinner
  or a placeholder that resizes.
- A rejected import (offline, or the chunk 404ing) is caught and replaced with a readable notice
  rather than an element that never paints.

One `import()` is shared by every card on the dashboard and by the editor — the module-level promise
is memoised, so ten Listapp cards fetch the chunk once.

`npm run build` enforces the win rather than trusting it: the build fails if the entry ever gains a
*static* import of the implementation, loses its dynamic one, or grows past an 8 KB budget.

### <a id="cache-busting"></a>Cache busting across two files

The implementation is built first; its content hash is baked into the entry as
`./listapp-list-card-impl.js?v=<hash>`, so the chunk gets its own cache-busting query and the entry's
bytes change whenever the chunk does. `frontend.py` then hashes **every** `*.js` in the directory for
the entry's own `?v=`, which makes a chunk-only change bust the entry too. `StaticPathConfig` now
registers the whole `frontend/` directory rather than the single file, since the entry's sibling
chunk has to be reachable at the same base URL.

## <a id="registry-patching"></a>Registry patching and verified registration

The "Configuration error until another reload" failure survived [fast
registration](#fast-registration), intermittently after an HA restart or hard reload. Measured live
on Garrett's instance on 2026-09-15, in the failed state, which rules the deadline out as the cause:

- The entry module `/listapp_frontend/listapp-list-card.js` was fetched at **123 ms**, took **251
  ms**, transferred **1857 bytes**, HTTP **200** — an order of magnitude inside the 2 s deadline, and
  not a 404.
- **22 s later** `customElements.get('listapp-list-card')` was `undefined`, and so were
  `listapp-list-card-impl` and `listapp-list-card-editor` — but `window.customCards` **did** contain
  our entry. The push happens after the `define` calls, so the module ran past them, defined nothing,
  and threw nothing.
- The tag was genuinely free: `customElements.define('listapp-list-card', class extends HTMLElement
  {})` succeeded by hand in that state.
- `await import('/listapp_frontend/listapp-list-card.js?probe=<ts>')` on the same page then defined
  all three tags immediately. The entry itself only registers the two host tags; the third
  (`listapp-list-card-impl`) followed a moment later, because the re-imported entry's hosts mounted
  and pulled in the implementation chunk, which registers it. Both defines took on the retry — the
  point of the observation is that nothing about the page had changed but the timing.
- The registry was patched: `Function.prototype.toString.call(customElements.define)` and `.get` were
  both non-native, `Object.getPrototypeOf(customElements).constructor.name` was `"x"` (minified), and
  `Element.prototype.attachShadow` was patched too — though `customElements instanceof
  CustomElementRegistry` still held. A detached iframe on the same page reported a **native**
  `define`, so the patch is installed on the main window specifically. The shape of it — registry
  plus `attachShadow` — is a **scoped custom element registry polyfill**, which HA's own frontend
  ships. A second user sees the same failure.

  **card-mod was suspected first and is not the culprit** — recorded here so the wrong diagnosis
  doesn't get made twice. card-mod patches the *prototypes of already-defined* HA elements via
  `whenDefined`/`get`; it never wraps `define`. The guard below is therefore written against any
  registry wrapper, including HA's own scoped-registry polyfill, and its warning deliberately names
  no specific add-on.

So a third-party wrapper around `customElements.define` can swallow a call: no exception, no
definition. The 2 s-deadline explanation does **not** cover this — that one requires the tag to be
undefined *at render time and then defined later*, and it is driven by how long the bundle takes to
arrive and evaluate. Here the bundle arrived in 251 ms, evaluated to completion, and the tag was
still undefined 22 s afterwards. Shrinking or speeding up the entry could never have fixed it.

The entry therefore **verifies after every `define` with `get`** rather than assuming it took, and
retries: a microtask, then tasks at 0 ms, 100 ms and 500 ms — five attempts in total, then it stops
and `console.warn`s once, naming registry patching as the likely cause so the next person doesn't
re-measure all of the above. The delays are short because the re-import probe defined the tags
instantly: the patch's window is transient, not permanent, so spacing attempts out further buys
nothing and risks landing after HA has already rendered the error card.

The same guard covers the **implementation** tags. `listapp-list-card-impl` and
`listapp-list-card-editor-impl` are registered by the lazily imported chunk, long after the entry
ran, so a wrapper still swallowing calls at that moment would leave the host mounting an
`HTMLUnknownElement` and calling `setConfig` on it — the guarded entry would report success and the
card would still break. `src/register.ts` holds the shared retry, and all four defines go through
it. The host also waits for its implementation tag (`whenDefined`) before mounting, so a define that
only takes on the third attempt still yields a working card rather than a dead one; past the wait it
shows the same readable notice as a failed chunk load. That wait is 2 s, which is not the retry
chain's own span: five attempts at a microtask then 0, 100 and 500 ms exhaust in roughly 600 ms. The
two are deliberately independent, because the chunk's chain only starts once the chunk has been
fetched and evaluated, which can be well after the host started waiting.
The warning is module state, so each bundle warns at most once however many tags were swallowed.
*(Both were Copilot review comments on PR #27.)*

`window.customCards` is only pushed **once both `listapp-list-card` and `listapp-list-card-editor`
resolve** — a card advertised with no editor is configurable from the picker only into an error.
Originally it was pushed once the card tag alone resolved; Copilot's review of PR #27 pointed out the
editor half, and the stricter gate matches the trade already chosen here. Advertising the
card to the picker while no element exists is precisely what turned a silent failure into HA's
context-free "Configuration error" — the card appeared installed and every dashboard using it broke.
An unlisted card is the better failure: the console warning explains it, and a reload fixes it.

### Why not borrow a pristine registry from an iframe

A same-origin `<iframe>` does have an unpatched `customElements` — measured on the affected page, a
detached iframe reports a native `define` while the main window's is wrapped — and it was evaluated,
but it can't help here and is deliberately not shipped. A registry is per-window: defining the tag in the iframe
registers it in *that* document, so `document.createElement('listapp-list-card')` in HA's document
still gets an `HTMLUnknownElement`. Stealing the iframe's native `define` and invoking it against the
main registry (`iframeDefine.call(window.customElements, ...)`) isn't a way around it either — the
native method reaches the registry through internal slots the patched object no longer backs
directly, and the constructor would belong to the iframe's realm, so its `HTMLElement` prototype
chain doesn't match the host document's. Retrying the host registry is the only approach that
actually defines the tag where HA will look for it.

## Architecture

Source lives in `frontend/` at the repo root (Lit 3 + TypeScript, bundled by esbuild). The build
output is **committed** because HACS installs straight from the git repository — there is nowhere
for a bundler to run on the user's instance. It builds to two dependency-free ES modules, and
**both** are committed and shipped:
`custom_components/listapp/frontend/listapp-list-card.js` (a ~3.3 KB entry that registers the tags)
and `custom_components/listapp/frontend/listapp-list-card-impl.js` (a ~73 KB, ~20 KB gzipped — of
which Lit is roughly two thirds — implementation chunk the entry imports dynamically). Shipping the
entry without its sibling would leave the lazy import 404ing at runtime, so `check:fresh` guards
both files; see [Fast registration](#fast-registration) for why the split exists.

| Module | Role |
| --- | --- |
| `src/entry.ts` | the built entry: registers the tags, lazy-loads and delegates to the implementation |
| `src/tags.ts` | the tag names, so `entry.ts` can reference them without importing Lit |
| `src/listapp-list-card.ts` | the `LitElement`; rendering, subscriptions, event handlers, styles |
| `src/model.ts` | pure state derivation: split/collapse items, viewer gating, card state, availability classification, move → `previous_uid` |
| `src/config.ts` | option defaults and validation, `getStubConfig` |
| `src/color.ts` | `avatarColor` port, palette (accent / glyph / ink / tint) and contrast maths |
| `src/icons.ts` + `src/icons.generated.ts` | lucide path data for the 26 list icons and the card's UI glyphs |
| `src/ha.ts` | the slice of the HA frontend API the card touches: types, service and websocket helpers, `navigate` |
| `src/strings.ts` | every user-facing string (English only — see [Open questions](#open-questions)) |

Everything in `model.ts`, `config.ts`, `color.ts` and `icons.ts` is DOM-free and unit-tested under
`frontend/test/` with vitest in node. The element itself has lifecycle and race tests in
`frontend/test/card.test.ts` under happy-dom, and is checked visually in the [harness](#harness).

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
  failed `todo/item/subscribe` schedules a retry (see [Subscription retry](#subscription-retry));
  a failed `remove_item` also keeps the confirm-clear dialog open, matching the single-item delete
  path; reconnecting (`connectedCallback`) re-runs availability tracking instead of trusting a stale
  guard (Copilot review comments on PR #14).
- `unknown` is treated like `unavailable`.
- Menus extend the stock card's: the Active section's ⋯ offers "Reorder items" / "Done
  reordering" only when the entity supports `MOVE_TODO_ITEM`. The Completed section's ⋯ offers
  "Uncheck all" (with a confirmation showing the count) when the entity supports
  `UPDATE_TODO_ITEM`, and "Clear completed" (with a confirmation) when it supports
  `DELETE_TODO_ITEM` — the two are gated independently, so an editor without delete permission
  still sees Uncheck all (Garrett decided 2026-09-15; see [Uncheck all](#uncheck-all)). There is no
  footer. Reorder mode also ends if the entity loses `MOVE_TODO_ITEM` mid-session (a role
  demotion), not just when the active list empties (Copilot review comment on PR #14). When the
  Completed section itself doesn't render, both bulk actions move into the Active menu instead —
  see [Menu consolidation](#menu-consolidation).
- `getCardSize` grows with the visible rows; `getGridOptions` reports 12 columns (min 6) and omits
  `rows` so the sections view sizes to content — HA's grid API takes a numeric row count, not
  `"auto"` (Copilot review comment on PR #14).

### Optimistic updates

Toggle and move apply their change to `_items` before the service call and undo it if the call
rejects. The undo is **targeted**, not a snapshot restore: a toggle puts back that one item's
previous status in whatever `_items` is *now*; a move restores the previous order but keeps each
item's current status. That matters when two mutations overlap and both fail — the common offline
case, where a user taps two checkboxes in a row — because a whole-array snapshot from the first
would either clobber the second's optimistic state or (the earlier generation-counter approach)
leave the first toggle stuck on screen until the next subscription push. Both undos are skipped
if `_itemsVersion` moved, i.e. a subscription push replaced the list between the optimistic apply
and the rejection: the server's list is the truth and already reflects the outcome. A successful
call always produces a push, so a success that overlaps a failure protects itself the same way.

A drop or arrow-key move for an item that's no longer active (checked off by someone else during
the drag) is ignored rather than sent as a move-to-top of a completed item.

### Subscription retry

A rejected `todo/item/subscribe` used to clear `_unsub`/`_subscribedEntity` and let `willUpdate`
re-subscribe on the next `hass` update. That is both too eager and too passive: `hass` changes on
*any* state change anywhere in Home Assistant, so a persistently failing subscription retried many
times a minute on a busy instance (only one in flight at a time, so it was self-limiting but noisy),
while on a quiet instance recovery depended on unrelated traffic arriving at all.

The failure path now keeps the subscription state as-is — so `willUpdate` sees nothing to do — and
schedules a retry with `setTimeout`: 2 s, 4 s, 8 s, 16 s, then 30 s for every further failure. The
**first** attempt is never delayed; the delay only applies between retries. `_retryAttempts` resets
on a subscribe that resolves and whenever the subscribed entity changes (`_retryEntity`), so a
recovered card that fails again later starts from 2 s rather than the capped delay. There is no
jitter: a single card per entity has nothing to stampede, and a deterministic schedule is what makes
the backoff testable under fake timers.

The pending timer is cleared in `_unsubscribe`, which covers disconnect, an entity change, and the
entity vanishing — a disconnected card never resubscribes, and the retry callback also re-checks
`isConnected` before firing. `_unsubscribe` also bumps `_subscriptionGeneration`, so an attempt that
was already in flight when teardown happened cannot schedule a *new* timer when it rejects moments
later: without that bump the generation check still matched, and a card that had just been
disconnected — or whose entity had just disappeared — started a retry chain nothing would cancel
(Copilot review comment on PR #18).

### In-flight guard

Add, rename, delete and Clear-completed are one-at-a-time writes: a second submit or click while
the first is still pending is ignored, and the dialog's action buttons are disabled meanwhile
(`_pending`). Without it a double-click on the confirm dialog's Delete fired two `remove_item`
calls — the second rejected with "item not found", toasted a spurious "couldn't save", and kept
the dialog open for items that were already gone; a double Enter in the add field created the
item twice (Copilot review comment on PR #14). Toggle and move are deliberately *not* serialised:
a second tap before the first resolves is meant to toggle the optimistic state back (see above).
Clear-completed also re-filters its uids against the live list when confirmed, so an item someone
unchecked while the dialog was open survives.

### Uncheck all

Garrett decided (2026-09-15) that the Completed menu also offers "Uncheck all": every completed
item goes back to `needs_action` in place — nothing is deleted, unlike Clear completed. It gets its
own confirmation dialog showing the count, the same as Clear completed, rather than firing
immediately; re-confirmed against the live list at confirm time so an item unchecked while the
dialog was open isn't re-sent. It only needs `UPDATE_TODO_ITEM`, not `DELETE_TODO_ITEM`, so it's
gated separately from Clear completed.

The `update_item` calls go out **in parallel** (`Promise.all`), not one at a time: each uid is an
independent service call with no ordering dependency, unlike a move, so a long completed list waits
on one round-trip instead of N in series. It follows the same in-flight guard and optimistic
update/targeted-rollback pattern as the rest of the card (`_pending`, `_itemsVersion`): the affected
items flip to `needs_action` immediately, and only the ones whose call actually failed roll back.

### Menu consolidation

With `show_completed: false`, or with the Completed section otherwise not rendered (no completed
items, or mid-reorder), there's nowhere to host its ⋯ menu. Rather than special-casing the header
(the previous `show_header: false` fix in PR #19) with a dedicated single-row bar, both Clear
completed and Uncheck all move into the Active section's own ⋯ menu whenever the Completed section
isn't rendered — one rule (`_consolidateCompleted`) instead of a header exception and a bar, and it
keeps working with `show_header: false` for free since the Active menu doesn't depend on the header.
The all-done state (no active items) gets a menu-only header row of its own so the actions stay
reachable even with nothing active to attach the menu to; `getCardSize()` counts that row only in
that case, since normally the actions fold into the Active section's existing header row at no
extra size.

### Lifecycle

Disconnecting closes any open dialog or menu. A modal `<dialog>` drops out of the top layer when
its host leaves the document without firing `close`, so `_dialog` would otherwise stay set across
a reconnect (moving the card in the dashboard editor) with nothing visible to close. Reconnecting
also re-subscribes, re-observes width and re-runs availability tracking; the outside-click
listener is attached and detached with the element.

### Menu direction

The ⋯ menu is absolutely positioned inside `ha-card`, which has `overflow: hidden`, so a menu that
opens downward from the Completed section's header — always at the bottom of the card — gets
clipped whenever there's less than a row of items below it. That menu opens upward (`.menu.up`),
which is always safe because the Completed section is never first: the header, and either the
Active section or the all-done tile, sit above it. The Active section's menu — including when it
hosts the consolidated bulk actions — opens downward as before. The direction is decided by where the menu is
rendered rather than measured at open time, so it's deterministic and testable (Copilot review
comment on PR #14).

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

Configurable via YAML or the visual editor (below). `getStubConfig` picks the first `todo.` entity
carrying a `list_id` attribute (not a `todo.listapp_*` name match — users can rename entity ids) so
the card picker preview works. The picker calls it with only `hass` (no `entities`/`fallback`
arguments), so it falls back to `hass.states` rather than requiring them (Copilot review comment on
PR #14).

| Option | Default | Notes |
| --- | --- | --- |
| `entity` | required | a well-formed `todo.<object_id>` entity id; anything else throws in `setConfig` |
| `title` | entity's friendly name | override |
| `use_list_color` | `true` | `false` uses the theme's `--primary-color` as the accent |
| `show_header` | `true` | `false` hides the whole header block — icon tile, title and subline — and forces the progress bar off too, regardless of `show_progress` |
| `show_add` | `true` | the add field; always hidden for viewers regardless |
| `show_completed` | `true` | the Completed section |
| `show_progress` | `true` | the progress bar under the header; ignored (forced off) while `show_header` is `false` |
| `collapse_to` | `0` (off) | show N active items and a "Show N more" disclosure; must be a non-negative integer |
| `item_tap_action` | `toggle` | `toggle` checks/unchecks on tap; `edit` opens the rename/delete dialog. The checkbox itself always toggles |

### `show_header` (renamed from `show_title`)

`show_title` only hid the `<h2>`, leaving the icon tile, subline and progress bar visible — not
what "show header" suggests. Renamed to `show_header` and widened to hide the entire header block
(icon tile, title, subline) plus the progress bar underneath it, regardless of `show_progress`. The
card was still unreleased (no GitHub release published) when this changed, so `show_title` is a
hard error in `resolveConfig` rather than a silent legacy alias — nothing shipped depended on the
old name.

**Viewer subline, decided:** the subline is also how a viewer learns a list is view-only ("N items ·
view only"). Garrett decided (2026-09-15) that hiding the header hides that marker too, with no
special case to keep it visible — the card is already fully non-interactive for a viewer (no add
field, no toggling, no menus) regardless of `show_header`, so the text was reinforcing a state the
UI already enforces, not the only signal of it. A config that says "hide the header" hides the whole
header.

**Clear completed and Uncheck all stay reachable.** With `show_completed: false`, or `show_header:
false` + `show_completed: false` together, the Completed section's menu never renders — see [Menu
consolidation](#menu-consolidation) for where the actions move instead.

## Editor

`getConfigElement` returns `listapp-list-card-editor` (`src/editor.ts`), mirroring HA's stock
`hui-todo-list-card-editor.ts` (Apache-2.0; see `NOTICE`). It renders an `ha-form` when that element
is defined — true inside the card-editor dialog, though not guaranteed on a bare dashboard — and
falls back to native theme-styled controls otherwise, waiting on `customElements.whenDefined` in
case `ha-form` hasn't loaded yet. Fields: entity (restricted to `todo.` entities carrying `list_id`,
falling back to every `todo.` entity), title override, the five booleans, `collapse_to`, and
`item_tap_action`. A hint under the entity picker notes the add field is always hidden for
view-only lists regardless of `show_add`, once a viewer entity is selected. The `show_progress`
control is disabled (`ha-form`'s `disabled` on the schema row; the native fallback path disables its
own checkbox) while `show_header` is off, since the toggle would have no effect.

Each edit fires `config-changed` (`{ config }`, bubbling and composed, matching stock editors).
`fromFormData` (`src/editor.ts`) omits any key still at its default so the emitted YAML stays clean
— the same behaviour `stubConfig`/`resolveConfig` already relies on for round-tripping.

## States

Derived in `model.ts#deriveView`, in priority order:

| State | When | Shows |
| --- | --- | --- |
| `missing` | entity not in `hass.states` | warning row "Entity not found" |
| `unavailable_auth` | entity `unavailable`/`unknown` **and** a `listapp` reauth flow is in progress (or the config entry is in `setup_error` with an auth-flavoured reason) | replaces header and body: warning triangle, "List unavailable", "Listapp needs you to sign in again…", **Sign in** |
| `unavailable_transient` | `unavailable`/`unknown` otherwise | same layout with a cloud-off icon, "Can't reach Listapp right now", **Check integration** |
| `loading` | subscribed, no message yet | header only (nothing at all if `show_header: false`) |
| `empty` | zero items | check-square tile, "Nothing on this list", "Add the first item above, or ask Assist to add one." (with `show_add: false`: "Ask Assist or the Listapp app to add the first item."; viewers see "Nothing has been added yet.") |
| `all_done` | items but no active | accent circle with a check, "All done", "Every item on this list is checked off." or "N completed items are hidden." when `show_completed: false` |
| `list` | otherwise | Active and Completed sections |

**Viewer** is `role == "viewer"` **or** `supported_features` lacking `CREATE_TODO_ITEM` or
`UPDATE_TODO_ITEM`. Viewers get no add field, no menus, no checkbox interaction (the input is
`disabled`), no hover tint, no reorder, and (while `show_header` is on) the subline reads "N items ·
view only" — `show_header: false` drops that marker along with the rest of the header, see
"show_header" below. Both signals
are checked because the integration's `supported_features` is what HA actually enforces, while
`role` is what Listapp says; if they ever disagree the card errs on the read-only side.

### Auth vs transient unavailability

The entity state alone can't tell the two apart — both are `unavailable`. On entering that state the
card calls `config_entries/get` (domain `listapp`) and `config_entries/flow/progress` and classifies
(`model.ts#classifyAvailability`): a flow with `handler == "listapp"` and `context.source ==
"reauth"` means auth; failing that, a `setup_error` entry whose `reason` mentions auth/token/sign
in; otherwise transient. Both checks are scoped to the entity's own config entry — looked up once per
entity via `config/entity_registry/get` — so with two Listapp accounts linked, a reauth on account A
doesn't put account B's cards into the auth state (Copilot review comment on PR #14). If the registry
lookup fails the scope widens to any `listapp` entry. Only a *current* lookup is cached: the
round-trip can outlive the cache it was meant to fill (`willUpdate` clears `_entryIdFor`/`_entryId`
when the entity vanishes, e.g. on a config-entry reload), so `_entryIdGeneration` — the same
generation-counter pattern `_subscriptionGeneration` and `_availabilityGeneration` use — discards a
result whose lookup is no longer the current one, leaving the next check to re-read the registry
instead of trusting an id from before the reload. It re-checks every 30 s while unavailable and
resets when the entity recovers. If the websocket calls themselves fail, it falls back to transient.
The unavailable layouts replace the header entirely (the design's choice), so there is no
"Unavailable" subline. The integration
starts the reauth flow itself (`ConfigEntryAuthFailed` and `todo.py`'s `_async_write`), so the flow
check is the authoritative signal.

**Known gap:** `config_entries/flow/progress` is admin-only. For a non-admin dashboard user the
`Promise.all` in `_checkAvailability` rejects and the catch path classifies every unavailable entity
as transient, so that user never sees the auth/Sign-in state even during a real reauth (Copilot
review comment on PR #14, flagged to Garrett — not fixed in this PR). Needs a user-readable signal
or an admin-only fallback that degrades more specifically than "assume transient".

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

Accent = the entity's `list_color` attribute when it parses as hex; otherwise `avatarColor(list_id)`,
ported **verbatim** from listapp-mobile `lib/avatar.ts` so a list with no saved colour looks the
same in HA as in the app. `frontend/test/color.test.ts` pins eleven seed → colour vectors computed
by running the mobile function under node, including one long enough to overflow int32 (the `| 0`
matters). If the mobile palette or hash changes, those vectors fail here.

From the accent, `color.ts#buildPalette` derives:

- **glyph** — the colour of white-on-accent content (tile icon, checked tick, accent-filled button
  labels). Always white, matching HA's stock to-do card and the design's top tile. Garrett decided
  (2026-09-15) to accept the contrast this costs rather than run a dark-glyph fallback: white falls
  below the WCAG 3:1 graphics threshold on 8 of the app's 14 list colours (worst cases lime
  `#84cc16` at 1.98:1 and yellow `#eab308` at 1.92:1; his own teal `#14b8a6` sits at 2.49:1). He has
  already accepted the same trade in the mobile app, and plans a separate accent colour in the
  palette later so brand colour and contrast can both be met. This does **not** pass 3:1 on those
  eight colours; `frontend/test/color.test.ts` pins the always-white behaviour rather than a
  contrast floor.
- **ink** — accent-coloured text and icons on the card background ("Show N more", the +, links).
  Dark themes lighten the accent by 38 % as the design does. Light themes darken any accent that
  doesn't already reach 4.5:1 against `--card-background-color`, in 12 % steps until it does (or
  reaches black) — not just the light accents above; `#3b82f6`, for instance, is also below 4.5:1
  on white and gets darkened the same way (Copilot review comment on PR #14).
- **tint** — the accent at 18 % alpha (dark) or 10 % (light) for the empty-state tile.
- **field / hover / track** — the neutral surfaces the design draws as fixed greys (add field
  background, row and menu hover, progress track). They are translucent black or white at the
  design's alpha, so they sit on whatever `--card-background-color` the theme has instead of
  hard-coding a grey.

Dark mode is `hass.themes.darkMode`, falling back to `prefers-color-scheme`; the card background is
read from the computed `--card-background-color`. With `use_list_color: false` the accent is the
computed `--primary-color` (fallback `#03a9f4`).

## Icons

The `list_icon` attribute holds one of the 26 lucide keys the mobile app allows
(`lib/list-appearance.ts`). `frontend/scripts/gen-icons.mjs` reads those icons' node data from the
pinned `lucide` npm package and writes `src/icons.generated.ts` (also the 14 UI glyphs the card
uses), so the SVG paths are bundled and nothing is fetched at runtime. Two keys differ from lucide's
current names and are mapped in the script: the app's `home` is lucide's `house`, and `utensils` is
`utensils-crossed` (matching the app's `UtensilsCrossed` import). Unknown or null keys fall back to
`list-checks`. Lucide is ISC-licensed; the notice is in `NOTICE` and the bundle banner.

## Design fidelity

Sizes, weights, letter-spacing, radii, padding and gaps in `listapp-list-card.ts`'s styles are the
design's values verbatim (variant 1b "quiet rail", `HA Todo Card.dc.html` in the Claude Design
project): 38 px tile with an 11 px radius, 5 px progress bar, 13.5 px/700 "Show N more". The section
labels (`Active`, `Completed`) are the one departure from the mock: they now match stock
`hui-todo-list-card`'s `.header h2` — `--ha-font-size-m`/`--ha-font-weight-medium` (14 px/500), no
letter-spacing override, sentence case, `--primary-text-color` — instead of the mock's 12 px/800
uppercase eyebrow at 1.2 px tracking, per Garrett's feedback (2026-09-16) that the eyebrow looked out
of place once the rest of the card was matched to stock. The trailing count (`· 7`) stays
`--la-muted` so it recedes against the label. Item text, the checkbox, the glyph, and the add field
deliberately match HA's stock look instead of the mock: item text is
`--ha-font-size-m`/`--ha-font-weight-normal` (14 px/400, active and completed alike, not the mock's
15.5 px/600–500), the checkbox is 20 px with `--ha-border-radius-sm` (4 px, not the mock's 22 px/7
px), and the glyph is always white (see [Colour](#colour)). Garrett compared the card side by side
with a stock HA card and his own dashboard on a dark theme (2026-09-15) and asked for four further
adjustments in the same direction: the unchecked checkbox border now uses
`--ha-color-border-neutral-normal` (falling back to `--la-muted`/`--secondary-text-color`) instead
of `--la-muted` directly — stock `ha-checkbox` uses that dedicated neutral-border token, which in
HA's dark theme resolves noticeably dimmer than `--secondary-text-color`, which is what was making
ours read too bright; the border width was already 2 px like stock and did not change.

The title and subline block takes its **proportions** from the Listapp mobile app's list row (sized
to roughly match the height of the 38 px icon tile beside it) but its **typography** from Home
Assistant — normal weight, HA's own font-size and line-height tokens — rather than from either the
mock or from `ha-card`'s own header. Garrett decided this (2026-09-16) after comparing the card
against a stock to-do card and the mobile app side by side: `ha-card`'s `<h1 class="card-header">`
is 24 px/400 with −0.012em letter-spacing and a 2 line-height, and was deliberately *not* reused
here, because a 24 px heading plus a subline cannot sit inside a 38 px tile's height. Size is the
dial, not weight — the block uses `--ha-font-size-xl` (20 px) for the title and `--ha-font-size-s`
(12 px) for the subline, both `--ha-font-weight-normal` (400) and `--ha-line-height-condensed`
(1.2), no letter-spacing override. That's `24 + 3 + 14.4 ≈ 41px` against the 38 px tile — the
closest fit available from HA's own scale. The subline kept its colour (`--la-muted`). The add
field moved from its previous filled block with 13 px/14 px padding, 15.5 px/500 text, and
a 10 px radius on the top corners only to stock's size and shape: `hui-todo-list-card`'s add row is an `ha-input` whose default (material) appearance
is 56 px tall with `0 var(--ha-space-4)` (16 px) padding and 14 px/400 text
(`--ha-font-size-m`/`--ha-font-weight-normal`, same as item text), and its filled part is rounded
`var(--ha-border-radius-sm)` (4 px) on the **top corners only**, square on the bottom — the same
Material-filled-textfield shape ours already used, just at the stock radius value instead of the
mock's 10 px. Our field's colours are unchanged: `--la-field` background and the `--la-accent`
underline are Garrett's call, not stock's. Other deliberate departures from the mock,
all decided before the build: HA theme variables and font instead of the fixed greys and Manrope; no
"shared by" footer, and no header ⋯ menu at all; native controls; the transient-unavailable and
viewer-empty wording. The card's outer radius, border and shadow are left to `ha-card` so it matches
the neighbouring cards in any theme, rather than forcing the mock's 16 px. The ⋯ is drawn as three
3.5 px dots stacked vertically in CSS, not a lucide glyph, matching the stock card's vertical kebab
rather than the mock's horizontal ellipsis.

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

The missing-entity notice and the "Delete" confirm-dialog button both use a theme colour
(`--warning-color`, `--error-color`) directly as text-on-fill, which on the default fallback values
falls short of 4.5:1 for 14 px text — the same category of tradeoff as the `.primary` button glyph
above. Garrett decided (2026-09-15) to leave both as-is: they're the user's own theme values, and
the card doesn't run a runtime contrast fixup on them (Copilot review comments on PR #14).

## Build

```bash
cd frontend
npm ci
npm run build        # gen icons are separate: npm run gen:icons
npm run dev          # esbuild serve + watch → http://127.0.0.1:8000/ (the harness)
npm run lint && npm run typecheck && npm test
npm run check:fresh  # rebuilds and fails if any committed bundle file or the icons differ
```

`npm run build` emits **both** `listapp-list-card.js` and `listapp-list-card-impl.js`; both are
committed, and `check:fresh` compares every file in the output directory (flagging a file that is
emitted but uncommitted, or committed but no longer emitted) rather than just the entry.

`check:fresh` builds into a scratch directory and compares, rather than rebuilding over the
committed output. Rebuilding in place can't detect a file that is committed but no longer emitted:
nothing deletes it, so it appears unchanged in both the before and after snapshots and the stale
branch never fires. That matters more after the split, because `frontend.py` serves the whole
directory and folds every `*.js` into the entry's `?v=` — an orphaned chunk would be served
indefinitely and would skew the cache-busting hash (Copilot review comment on PR #24).

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
`?wide=1`. The "editor" checkbox mounts `listapp-list-card-editor` for the current scenario and
echoes each `config-changed` back into a `<pre>`, so editor changes can be watched live against the
mock `hass`. Slice 4 reuses the card side of the harness for README screenshots. It is not shipped.

## Licences

See `NOTICE`: HA frontend (Apache-2.0, behaviour adapted), Lit (BSD-3-Clause, bundled), lucide
(ISC, path data bundled; some icons Feather-derived, MIT).

## Testing

`tests/test_frontend.py` covers the "once per instance" guarantee directly: calling
`async_register_frontend` twice registers the static path and the extra JS URL exactly once, and
setting up two config entries plus a reload of one of them still registers exactly once. It also
pins the integration-level timing above: registered by `async_setup` with no config entry at all,
still exactly once when an entry is added afterwards, and still registered when an entry fails with
`ConfigEntryNotReady`. It pins
static-path registration via `HomeAssistantHTTP.async_register_static_paths`, patched only after
the real `http`/`frontend` components have done their own (unrelated) static-path registrations, so
the count reflects only this integration's call.

`tests/test_coordinator.py` and `tests/test_todo.py` cover `list_color`/`list_icon` through a poll, a
coordinator refresh, and a `list.updated` SSE event, for owner/editor/viewer lists with and without
color/icon set.

Running the frontend component in tests requires `home-assistant-frontend` (the `frontend`
component's own pinned requirement) — see `requirements_test.txt` and `test.yml`'s minimum-HA
matrix, which pins the same package to the version the 2026.3 plugin's `frontend` component
requires.

Card unit tests (`frontend/test/`): state derivation and priorities, collapse, viewer gating, option
defaults and validation, the `avatarColor` vectors, glyph/ink contrast over all 14 colours, icon key
mapping, availability classification, move → `previous_uid`, rename preserving status, and the
editor's entity selection (including the `list_id`-attribute filter over a name match), form/config
round-trip, default-omission, and its native/`ha-form` rendering and `config-changed` emission
(`frontend/test/editor.test.ts`, happy-dom). `card.test.ts` mounts the real `ListAppListCard` under
happy-dom (a per-file `@vitest-environment`; the rest of the suite stays in node) against a fake
`hass` whose `subscribeMessage`, `callService` and `callWS` can be held pending and resolved or
rejected on cue. It pins the race behaviour: unsubscribe on disconnect (including a subscription
that resolves only after disconnect), pushes for a previous entity being dropped, both overlapping
failed toggles rolling back, no rollback over a newer push, the in-flight guards, Uncheck all
(parallel batch, confirm-time re-check, permission split from Clear completed, targeted rollback on
a failed call), menu consolidation into the Active menu when Completed isn't rendered, the Completed
menu opening upward, dialog/menu closing on disconnect, a drop for an item that left the active
list, a slow availability check landing after recovery, the recheck interval stopping on disconnect,
the subscribe backoff (retrying on its own timer rather than on `hass` updates, the 30 s cap, the
reset after a successful subscribe, and cancellation on disconnect — all under fake timers), and an
entry-id lookup that lands after the entity vanished being discarded. happy-dom has no layout, so
`ResizeObserver` is stubbed and nothing asserts on geometry; `frontend/dev/harness.js` remains the
visual check and is not run in CI.

## Open questions

- **Strings are English only.** Custom cards can't add keys to `hass.localize`; shipping our own
  translations means a small i18n table keyed on `hass.language`. Not done in this slice.
- **Unavailable for other reasons.** An entity also goes `unavailable` when its list disappears
  from the coordinator (deleted or unshared). That currently reads as transient; if it should say
  something else, the coordinator would need to expose why.
