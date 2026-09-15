// Behaviour mirrors Home Assistant's hui-todo-list-card (Apache-2.0) — see NOTICE and docs/card.md
import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { buildPalette, HA_PRIMARY_FALLBACK, resolveListColor, type Palette } from "./color.js";
import { CARD_TYPE, resolveConfig, stubConfig, type ListAppCardConfig, type ResolvedConfig } from "./config.js";
import {
  createItem,
  deleteItems,
  fetchConfigEntries,
  fetchEntityRegistryEntry,
  fetchFlowsInProgress,
  INTEGRATION_PAGE,
  moveItem,
  navigate,
  renameItem,
  setItemStatus,
  subscribeItems,
  TodoItemStatus,
  type HomeAssistant,
  type TodoItem,
} from "./ha.js";
import { listIcon, uiIcon } from "./icons.js";
import {
  classifyAvailability,
  deriveView,
  isUnavailable,
  previousUidAfterMove,
  type Availability,
  type CardView,
} from "./model.js";
import { STRINGS as S } from "./strings.js";

const WIDE_BREAKPOINT = 560;
const AVAILABILITY_RECHECK_MS = 30_000;
// Doubling from 2s, capped at 30s — see docs/card.md#subscription-retry
const SUBSCRIBE_RETRY_BASE_MS = 2_000;
const SUBSCRIBE_RETRY_MAX_MS = 30_000;

type Dialog = { kind: "edit"; item: TodoItem } | { kind: "confirm-clear"; uids: string[] };
type Menu = "active" | "completed";

export class ListAppListCard extends LitElement {
  static getStubConfig(
    hass: HomeAssistant,
    entities: string[] = [],
    fallback: string[] = [],
  ): ListAppCardConfig {
    // The Lovelace card picker calls this with only `hass` — see docs/card.md#stub-config.
    const candidates = entities.length || fallback.length ? [...entities, ...fallback] : Object.keys(hass.states);
    return stubConfig(candidates);
  }

  @property({ attribute: false }) hass?: HomeAssistant;

  @state() private _config?: ResolvedConfig;
  @state() private _items?: TodoItem[];
  @state() private _availability: Availability = "available";
  @state() private _expanded = false;
  @state() private _reordering = false;
  @state() private _menu: Menu | null = null;
  @state() private _wide = false;
  @state() private _dialog: Dialog | null = null;
  @state() private _dragUid: string | null = null;
  @state() private _dropIndex: number | null = null;
  @state() private _pending = false;

  private _unsub?: Promise<() => void>;
  private _subscribedEntity?: string;
  private _subscriptionGeneration = 0;
  private _retryTimer?: number;
  private _retryAttempts = 0;
  private _retryEntity?: string;
  private _resize?: ResizeObserver;
  private _availabilityTimer?: number;
  private _checkedAvailabilityFor?: string;
  private _availabilityGeneration = 0;
  // Bumped on every subscription push; a failed mutation only rolls back if it hasn't moved —
  // see docs/card.md#optimistic-updates
  private _itemsVersion = 0;
  private _entryIdFor?: string;
  private _entryId?: string | null;
  private _entryIdGeneration = 0;
  private _paletteKey?: string;
  private _palette?: Palette;

  setConfig(config: ListAppCardConfig): void {
    this._config = resolveConfig(config);
    this._expanded = false;
    this._reordering = false;
    this._menu = null;
    this._closeDialog();
  }

  // Failed service calls surface through HA's own toast — see docs/card.md#behaviour-mirrors-the-stock-to-do-card
  private async _call(action: () => Promise<unknown>): Promise<boolean> {
    try {
      await action();
      return true;
    } catch (err) {
      console.warn("listapp-list-card: service call failed", err);
      this.dispatchEvent(
        new CustomEvent("hass-notification", { bubbles: true, composed: true, detail: { message: S.saveFailed } }),
      );
      this.requestUpdate();
      return false;
    }
  }

  getCardSize(): number {
    if (!this._config) {
      return 3;
    }
    const view = this._view();
    if (view.state === "missing" || view.state === "unavailable_auth" || view.state === "unavailable_transient") {
      return 3;
    }
    const columns = this._wide ? 2 : 1;
    const completedRows = view.showCompleted && !this._reordering ? view.completed.length : 0;
    const rows = Math.ceil(view.visibleActive.length / columns) + Math.ceil(completedRows / columns);
    const loading = view.state === "loading";
    // Mirror render()'s conditions: the progress bar is skipped when show_progress is off or
    // still loading, and the add form is skipped while loading — see docs/card.md.
    const header = 1 + (view.showProgress && !loading ? 1 : 0);
    const add = view.showAdd && !loading ? 1 : 0;
    return header + add + rows + 1;
  }

  getGridOptions() {
    // `rows` is a numeric cell count in HA's sections-grid API; omitting it lets the card size
    // to content, which "auto" (not a valid value) doesn't actually do — see docs/card.md.
    return { columns: 12, min_columns: 6 };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.hasUpdated) {
      this._subscribe();
      this._trackAvailability();
    }
    this._resize ??= new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      this._wide = width >= WIDE_BREAKPOINT;
    });
    this._resize.observe(this);
    document.addEventListener("click", this._onDocumentClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe();
    this._resize?.disconnect();
    document.removeEventListener("click", this._onDocumentClick);
    this._stopAvailabilityTimer();
    // Clear the guard so reconnecting re-runs tracking instead of finding a stale match.
    this._checkedAvailabilityFor = undefined;
    // A modal <dialog> leaves the top layer when its host is removed — see docs/card.md#lifecycle
    this._closeDialog();
    this._menu = null;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!this.hass || !this._config) {
      return;
    }
    const entityPresent = this._config.entity in this.hass.states;
    if (!entityPresent) {
      // The entity vanished (e.g. the config entry reloaded) — drop the stale subscription,
      // dialog/menu and cached config-entry ID so a later recreation under the same ID is
      // treated as fresh, not skipped as already-subscribed or misattributed to the old entry.
      // Idempotent, so it's safe to run on every update while the entity stays missing (this
      // also covers a subscription whose own rejection handler already cleared
      // `_subscribedEntity` before the entity disappeared).
      this._unsubscribe();
      this._items = undefined;
      this._entryIdFor = undefined;
      this._entryId = undefined;
      this._entryIdGeneration++;
      this._closeDialog();
      this._menu = null;
    } else if (this._subscribedEntity !== this._config.entity || (!this._unsub && entityPresent)) {
      this._items = undefined;
      this._subscribe();
    }
    if (changed.has("hass") || changed.has("_config")) {
      this._trackAvailability();
    }
    if (this._reordering || this._dialog || this._menu) {
      const view = this._view();
      if (this._reordering && (view.active.length === 0 || !view.canMove)) {
        this._reordering = false;
      }
      // A dialog/menu opened while writable can outlive that permission — e.g. the entity goes
      // unavailable or the list is demoted to viewer — and its Save/Delete/Clear handlers would
      // otherwise still fire against a now-unwritable list (Copilot review comment on PR #14).
      const unavailable = view.state === "unavailable_auth" || view.state === "unavailable_transient";
      if (unavailable || !view.canUpdate) {
        if (this._dialog) {
          this._closeDialog();
        }
        this._menu = null;
      }
    }
  }

  private _stateObj() {
    return this.hass && this._config ? this.hass.states[this._config.entity] : undefined;
  }

  private _view(): CardView {
    return deriveView({
      config: this._config!,
      stateObj: this._stateObj(),
      items: this._items,
      availability: this._availability,
      expanded: this._expanded,
    });
  }

  private _subscribe(): void {
    this._unsubscribe();
    if (!this.hass || !this._config || !(this._config.entity in this.hass.states)) {
      return;
    }
    const entity = this._config.entity;
    if (this._retryEntity !== entity) {
      this._retryEntity = entity;
      this._retryAttempts = 0;
    }
    const generation = ++this._subscriptionGeneration;
    this._subscribedEntity = entity;
    const attempt = subscribeItems(this.hass, entity, (update) => {
      if (this._subscriptionGeneration === generation && this._subscribedEntity === entity) {
        this._items = update.items;
        this._itemsVersion++;
      }
    })
      .then((unsub) => {
        if (this._subscriptionGeneration === generation) {
          this._retryAttempts = 0;
        }
        return unsub;
      })
      .catch((err: unknown) => {
        console.warn("listapp-list-card: item subscription failed", err);
        if (this._subscriptionGeneration === generation) {
          this._scheduleRetry();
        }
        return () => undefined;
      });
    this._unsub = attempt;
  }

  // Recovery is driven by the timer, not by the next `hass` update — see docs/card.md#subscription-retry
  private _scheduleRetry(): void {
    const delay = Math.min(SUBSCRIBE_RETRY_BASE_MS * 2 ** this._retryAttempts, SUBSCRIBE_RETRY_MAX_MS);
    this._retryAttempts++;
    this._cancelRetry();
    this._retryTimer = window.setTimeout(() => {
      this._retryTimer = undefined;
      if (this.isConnected) {
        this._subscribe();
      }
    }, delay);
  }

  private _cancelRetry(): void {
    if (this._retryTimer !== undefined) {
      window.clearTimeout(this._retryTimer);
      this._retryTimer = undefined;
    }
  }

  private _unsubscribe(): void {
    this._cancelRetry();
    this._unsub?.then((unsub) => unsub());
    this._unsub = undefined;
    this._subscribedEntity = undefined;
  }

  private _trackAvailability(): void {
    const stateObj = this._stateObj();
    if (!stateObj || !isUnavailable(stateObj)) {
      this._availability = "available";
      this._checkedAvailabilityFor = undefined;
      this._stopAvailabilityTimer();
      return;
    }
    const key = `${stateObj.entity_id}:${stateObj.state}`;
    if (this._checkedAvailabilityFor === key) {
      return;
    }
    this._checkedAvailabilityFor = key;
    this._availability = "transient";
    void this._checkAvailability();
    this._stopAvailabilityTimer();
    this._availabilityTimer = window.setInterval(() => void this._checkAvailability(), AVAILABILITY_RECHECK_MS);
  }

  private _stopAvailabilityTimer(): void {
    if (this._availabilityTimer !== undefined) {
      window.clearInterval(this._availabilityTimer);
      this._availabilityTimer = undefined;
    }
  }

  private async _checkAvailability(): Promise<void> {
    const entity = this._config?.entity;
    const key = this._checkedAvailabilityFor;
    if (!this.hass || !entity || !key) {
      return;
    }
    // A slower overlapping check (the 30s interval can start one before an earlier
    // one resolves) must not overwrite a result from a check started after it.
    const generation = ++this._availabilityGeneration;
    let availability: Availability;
    try {
      const [entries, flows, entryId] = await Promise.all([
        fetchConfigEntries(this.hass, "listapp"),
        fetchFlowsInProgress(this.hass),
        this._resolveEntryId(),
      ]);
      availability = classifyAvailability(this._stateObj(), entries, flows, entryId);
    } catch {
      availability = classifyAvailability(this._stateObj(), undefined, undefined);
    }
    if (
      this._availabilityGeneration === generation &&
      this._config?.entity === entity &&
      this._checkedAvailabilityFor === key
    ) {
      this._availability = availability;
    }
  }

  private async _resolveEntryId(): Promise<string | null | undefined> {
    const entity = this._config?.entity;
    if (!this.hass || !entity) {
      return undefined;
    }
    if (this._entryIdFor !== entity) {
      const generation = ++this._entryIdGeneration;
      try {
        const entryId = (await fetchEntityRegistryEntry(this.hass, entity)).config_entry_id ?? null;
        // Only cache a successful, still-current lookup — see docs/card.md#auth-vs-transient-unavailability.
        if (this._entryIdGeneration !== generation || this._config?.entity !== entity) {
          return undefined;
        }
        this._entryId = entryId;
        this._entryIdFor = entity;
      } catch {
        return undefined;
      }
    }
    return this._entryId;
  }

  private _resolvePalette(): Palette {
    const stateObj = this._stateObj();
    const dark = this.hass?.themes?.darkMode ?? window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const computed = getComputedStyle(this);
    const background = computed.getPropertyValue("--card-background-color").trim() || (dark ? "#1c1c1c" : "#ffffff");
    const accent = this._config!.useListColor
      ? resolveListColor(stateObj?.attributes.color, stateObj?.attributes.list_id ?? this._config!.entity)
      : computed.getPropertyValue("--primary-color").trim() || HA_PRIMARY_FALLBACK;
    const key = `${accent}|${background}|${dark}`;
    if (this._paletteKey !== key) {
      this._paletteKey = key;
      this._palette = buildPalette(accent, background, dark);
    }
    return this._palette!;
  }

  protected override render() {
    if (!this.hass || !this._config) {
      return nothing;
    }
    const view = this._view();
    const palette = this._resolvePalette();
    const vars = {
      "--la-accent": palette.accent,
      "--la-glyph": palette.glyph,
      "--la-ink": palette.ink,
      "--la-tint": palette.tint,
      "--la-field": palette.field,
      "--la-hover": palette.hover,
      "--la-track": palette.track,
    };
    return html`
      <ha-card
        style=${styleMap(vars)}
        class=${classMap({ wide: this._wide, viewer: view.viewer, reordering: this._reordering })}
      >
        ${view.state === "missing" ? this._renderMissing() : this._renderCard(view)}
        ${this._renderDialog(view)}
      </ha-card>
    `;
  }

  private _renderMissing() {
    return html`<div class="notice">${uiIcon("triangle-alert", 22)}<span>${S.missing(this._config!.entity)}</span></div>`;
  }

  private _renderCard(view: CardView) {
    const stateObj = this._stateObj()!;
    if (view.state === "unavailable_auth" || view.state === "unavailable_transient") {
      return this._renderUnavailable(view);
    }
    return html`
      ${this._renderHeader(view, stateObj.attributes.icon)}
      ${view.showProgress && view.state !== "loading" ? this._renderProgress(view) : nothing}
      ${this._renderBody(view)}
    `;
  }

  private _renderHeader(view: CardView, iconKey: string | null | undefined) {
    // With completed items hidden (show_completed: false), the Completed section — and its
    // Clear-completed menu — never renders. Surface it here instead, near the top of the card
    // where a downward-opening menu has room, rather than inside the all-done tile where
    // ha-card's `overflow: hidden` could clip it (Copilot review comment on PR #14).
    const showHiddenClear = !view.showCompleted && view.canDelete && view.completed.length > 0;
    return html`
      <header class="head">
        <div class="tile" aria-hidden="true">${listIcon(iconKey, 20)}</div>
        <div class="titles">
          ${this._config!.showTitle ? html`<h2 class="title">${view.title}</h2>` : nothing}
          <p class="subline">${view.subline}</p>
        </div>
        ${showHiddenClear ? this._renderMenu("completed", view, false) : nothing}
      </header>
    `;
  }

  private _renderProgress(view: CardView) {
    const pct = Math.round(view.progress * 100);
    return html`
      <div
        class="progress"
        role="progressbar"
        aria-label=${S.completed}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${pct}
      >
        <div class="progress-fill" style=${styleMap({ width: `${pct}%` })}></div>
      </div>
    `;
  }

  private _renderUnavailable(view: CardView) {
    const auth = view.state === "unavailable_auth";
    return html`
      <div class="state unavailable">
        <div class="warn">${uiIcon(auth ? "triangle-alert" : "cloud-off", 28)}</div>
        <h3>${auth ? S.authTitle : S.transientTitle}</h3>
        <p>${auth ? S.authBody : S.transientBody}</p>
        ${auth
          ? html`<button class="primary" @click=${this._signIn}>${S.signIn}</button>`
          : html`<button class="text" @click=${this._signIn}>${S.checkIntegration}</button>`}
      </div>
    `;
  }

  private _renderBody(view: CardView) {
    return html`
      ${view.state === "loading" ? nothing : html`${view.showAdd ? this._renderAdd() : nothing}${this._renderSections(view)}`}
    `;
  }

  private _renderAdd() {
    return html`
      <form class="add" @submit=${this._submitAdd}>
        <input
          class="add-input"
          name="summary"
          type="text"
          autocomplete="off"
          placeholder=${S.addPlaceholder}
          aria-label=${S.addPlaceholder}
        />
        <button type="submit" class="add-btn" title=${S.addButton} aria-label=${S.addButton}>
          ${uiIcon("plus", 20)}
        </button>
      </form>
    `;
  }

  private _renderSections(view: CardView) {
    if (view.state === "empty") {
      return html`
        <div class="state empty">
          <div class="state-icon">${uiIcon("square-check", 23)}</div>
          <h3>${S.emptyTitle}</h3>
          <p>${view.viewer ? S.emptyBodyViewer : view.showAdd ? S.emptyBody : S.emptyBodyNoAdd}</p>
        </div>
      `;
    }
    const activeLabel = this._reordering ? S.reorder : S.active;
    return html`
      ${view.state === "all_done"
        ? html`
            <div class="state all-done">
              <div class="state-icon done">${uiIcon("check", 24)}</div>
              <h3>${S.allDoneTitle}</h3>
              <p>${view.showCompleted ? S.allDoneBody : S.allDoneHidden(view.done)}</p>
            </div>
          `
        : html`
            <section class="section" aria-label=${S.active}>
              <div class="section-head">
                <h3>${activeLabel}<span class="count"> · ${view.active.length}</span></h3>
                ${view.canMove ? this._renderMenu("active", view, false) : nothing}
              </div>
              ${this._renderItems(view.visibleActive, view, true)}
              ${!this._reordering &&
              (view.hiddenActive > 0 || (this._expanded && this._config!.collapseTo > 0 && view.active.length > this._config!.collapseTo))
                ? html`
                    <button class="more" @click=${this._toggleExpanded} aria-expanded=${this._expanded}>
                      ${this._expanded ? S.showLess : S.showMore(view.hiddenActive)}
                      ${uiIcon(this._expanded ? "chevron-up" : "chevron-down", 15)}
                    </button>
                  `
                : nothing}
            </section>
          `}
      ${view.showCompleted && view.completed.length && !this._reordering
        ? html`
            <div class="divider" role="separator"></div>
            <section class="section completed" aria-label=${S.completed}>
              <div class="section-head">
                <h3>${S.completed}<span class="count"> · ${view.completed.length}</span></h3>
                ${view.canDelete ? this._renderMenu("completed", view, true) : nothing}
              </div>
              ${this._renderItems(view.completed, view, false)}
            </section>
          `
        : nothing}
    `;
  }

  // `up` opens the menu above its button — see docs/card.md#menu-direction
  private _renderMenu(menu: Menu, view: CardView, up: boolean) {
    const open = this._menu === menu;
    const label = menu === "active" ? S.active : S.completed;
    return html`
      <div class="menu-wrap" @keydown=${this._menuKeydown}>
        <button
          class="menu-btn"
          aria-haspopup="menu"
          aria-expanded=${open}
          aria-label=${S.menu(label)}
          title=${S.menu(label)}
          data-menu=${menu}
          @click=${this._toggleMenu}
        >
          <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
        ${open
          ? html`
              <div class=${classMap({ menu: true, up })} role="menu">
                ${menu === "active"
                  ? html`<button role="menuitem" @click=${this._toggleReorder}>
                      ${this._reordering ? S.exitReorder : S.reorder}
                    </button>`
                  : html`<button role="menuitem" class="danger" @click=${() => this._confirmClear(view)}>
                      ${uiIcon("trash", 18)} ${S.clearCompleted}
                    </button>`}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private _renderItems(items: TodoItem[], view: CardView, activeSection: boolean) {
    const reorder = this._reordering && activeSection && view.canMove;
    return html`
      <ul
        class=${classMap({ items: true, reorder })}
        @dragover=${reorder ? this._dragOver : nothing}
        @drop=${reorder ? this._drop : nothing}
      >
        ${repeat(
          items,
          (item) => item.uid,
          (item, index) => this._renderItem(item, index, view, reorder),
        )}
      </ul>
    `;
  }

  private _renderItem(item: TodoItem, index: number, view: CardView, reorder: boolean): TemplateResult {
    const done = item.status === TodoItemStatus.Completed;
    const interactive = view.canUpdate;
    const label = done ? S.markActive(item.summary) : S.markDone(item.summary);
    return html`
      <li
        class=${classMap({
          item: true,
          done,
          interactive,
          dragging: this._dragUid === item.uid,
          "drop-before": this._dropIndex === index && this._dragUid !== item.uid,
        })}
        data-uid=${item.uid}
        data-index=${index}
        draggable=${reorder ? "true" : "false"}
        @dragstart=${reorder ? this._dragStart : nothing}
        @dragend=${reorder ? this._dragEnd : nothing}
      >
        <label class="check">
          <input
            type="checkbox"
            .checked=${done}
            .disabled=${!interactive}
            aria-label=${label}
            data-uid=${item.uid}
            @change=${this._checkboxChanged}
          />
          <span class="box" aria-hidden="true">${uiIcon("check", 14)}</span>
        </label>
        ${interactive
          ? html`<button class="summary" data-uid=${item.uid} @click=${this._itemTapped}>${item.summary}</button>`
          : html`<span class="summary">${item.summary}</span>`}
        ${reorder
          ? html`
              <button
                class="icon-btn handle"
                aria-label=${S.dragHandle(item.summary)}
                title=${S.dragHandle(item.summary)}
                data-uid=${item.uid}
                data-index=${index}
                @keydown=${this._handleKeydown}
              >
                ${uiIcon("grip-vertical", 18)}
              </button>
            `
          : nothing}
      </li>
    `;
  }

  private _renderDialog(view: CardView) {
    const dialog = this._dialog;
    if (!dialog) {
      return nothing;
    }
    if (dialog.kind === "edit") {
      return html`
        <dialog class="dialog" @close=${this._closeDialog} @cancel=${this._closeDialog}>
          <form method="dialog" @submit=${this._saveEdit}>
            <h3>${S.editTitle}</h3>
            <label class="field">
              <span>${S.editLabel}</span>
              <input name="summary" type="text" required autofocus .value=${dialog.item.summary} />
            </label>
            <div class="actions">
              ${view.canDelete
                ? html`<button type="button" class="danger text" .disabled=${this._pending} @click=${this._deleteFromDialog}>
                    ${S.delete}
                  </button>`
                : nothing}
              <span class="spacer"></span>
              <button type="button" class="text" @click=${this._closeDialog}>${S.cancel}</button>
              <button type="submit" class="primary" .disabled=${this._pending}>${S.save}</button>
            </div>
          </form>
        </dialog>
      `;
    }
    return html`
      <dialog class="dialog" @close=${this._closeDialog} @cancel=${this._closeDialog}>
        <h3>${S.clearConfirmTitle}</h3>
        <p>${S.clearConfirmText(dialog.uids.length)}</p>
        <div class="actions">
          <span class="spacer"></span>
          <button type="button" class="text" @click=${this._closeDialog}>${S.cancel}</button>
          <button type="button" class="primary danger-bg" .disabled=${this._pending} @click=${this._clearCompleted}>
            ${S.delete}
          </button>
        </div>
      </dialog>
    `;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("_dialog") && this._dialog) {
      const dialog = this.renderRoot.querySelector<HTMLDialogElement>("dialog");
      if (dialog && !dialog.open) {
        dialog.showModal();
        dialog.querySelector<HTMLInputElement>("input")?.select();
      }
    }
  }

  private _item(uid: string | undefined): TodoItem | undefined {
    return uid ? this._items?.find((item) => item.uid === uid) : undefined;
  }

  private _submitAdd = async (ev: SubmitEvent) => {
    ev.preventDefault();
    const form = ev.currentTarget as HTMLFormElement;
    const input = form.elements.namedItem("summary") as HTMLInputElement;
    const summary = input.value.trim();
    if (!summary || !this.hass || !this._config || this._pending) {
      return;
    }
    const { hass, _config: config } = this;
    if (await this._guarded(() => createItem(hass, config.entity, summary))) {
      input.value = "";
    }
    input.focus();
  };

  // Serialises the card's one-at-a-time writes (add, rename, delete, clear) — see docs/card.md#in-flight-guard
  private async _guarded(action: () => Promise<unknown>): Promise<boolean> {
    this._pending = true;
    try {
      return await this._call(action);
    } finally {
      this._pending = false;
    }
  }

  private _checkboxChanged = (ev: Event) => {
    const input = ev.currentTarget as HTMLInputElement;
    void this._toggleItem(this._item(input.dataset.uid));
  };

  private _itemTapped = (ev: Event) => {
    const uid = (ev.currentTarget as HTMLElement).dataset.uid;
    const item = this._item(uid);
    if (!item) {
      return;
    }
    if (this._config!.itemTapAction === "edit") {
      this._dialog = { kind: "edit", item };
    } else {
      void this._toggleItem(item);
    }
  };

  private async _toggleItem(item: TodoItem | undefined): Promise<void> {
    if (!item || !this.hass || !this._config) {
      return;
    }
    // Matches the stock to-do card: only NeedsAction transitions to Completed; Completed and
    // null (an indeterminate status splitItems still renders as active) both go to NeedsAction.
    const status =
      item.status === TodoItemStatus.NeedsAction ? TodoItemStatus.Completed : TodoItemStatus.NeedsAction;
    const { hass, _config: config } = this;
    const version = this._itemsVersion;
    this._items = this._items?.map((it) => (it.uid === item.uid ? { ...it, status } : it));
    if (!(await this._call(() => setItemStatus(hass, config.entity, item, status)))) {
      if (this._itemsVersion === version && this._config === config) {
        this._items = this._items?.map((it) => (it.uid === item.uid ? { ...it, status: item.status } : it));
      }
    }
  }

  private _toggleExpanded = () => {
    this._expanded = !this._expanded;
  };

  private _toggleMenu = (ev: Event) => {
    const menu = (ev.currentTarget as HTMLElement).dataset.menu as Menu;
    this._menu = this._menu === menu ? null : menu;
  };

  // Deliberately doesn't stopPropagation in _toggleMenu — that would keep the click from
  // reaching other cards' own document listeners, leaving their menus open. Instead this
  // ignores clicks on this card's own menu buttons, which _toggleMenu already handled.
  private _onDocumentClick = (ev: Event) => {
    if (!this._menu) {
      return;
    }
    const path = ev.composedPath();
    if (path.some((el) => el instanceof HTMLElement && el.classList.contains("menu-btn") && el.getRootNode() === this.renderRoot)) {
      return;
    }
    this._menu = null;
  };

  private _menuKeydown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape" && this._menu) {
      const menu = this._menu;
      this._menu = null;
      this.renderRoot.querySelector<HTMLElement>(`.menu-btn[data-menu="${menu}"]`)?.focus();
    }
  };

  private _toggleReorder = () => {
    this._reordering = !this._reordering;
    this._menu = null;
    if (this._reordering) {
      this._expanded = true;
    }
    const target = this._reordering ? ".handle" : '.menu-btn[data-menu="active"]';
    void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>(target)?.focus());
  };

  private _confirmClear(view: CardView): void {
    this._menu = null;
    this._dialog = { kind: "confirm-clear", uids: view.completed.map((item) => item.uid) };
  }

  private _clearCompleted = async () => {
    const dialog = this._dialog;
    if (this._pending) {
      return;
    }
    // Re-check against the live list: an item unchecked since the dialog opened must survive.
    const uids = dialog?.kind === "confirm-clear" ? dialog.uids.filter((uid) => this._item(uid)?.status === TodoItemStatus.Completed) : [];
    if (uids.length && this.hass && this._config) {
      const { hass, _config: config } = this;
      if (!(await this._guarded(() => deleteItems(hass, config.entity, uids)))) {
        return;
      }
    }
    this._closeDialog();
  };

  private _closeDialog = () => {
    const dialog = (this.renderRoot as ShadowRoot | undefined)?.querySelector<HTMLDialogElement>("dialog");
    if (dialog?.open) {
      dialog.close();
    }
    this._dialog = null;
  };

  private _saveEdit = async (ev: SubmitEvent) => {
    ev.preventDefault();
    const dialog = this._dialog;
    const form = ev.currentTarget as HTMLFormElement;
    const input = form.elements.namedItem("summary") as HTMLInputElement;
    const summary = input.value.trim();
    if (dialog?.kind === "edit" && !summary) {
      // `required` only rejects an empty value, not a whitespace-only one — keep the dialog
      // open instead of silently discarding the edit.
      input.setCustomValidity(S.editRequired);
      input.reportValidity();
      return;
    }
    input.setCustomValidity("");
    if (this._pending) {
      return;
    }
    if (dialog?.kind === "edit" && summary && summary !== dialog.item.summary && this.hass && this._config) {
      const { hass, _config: config } = this;
      // Resolve the current item by uid — a concurrent update (e.g. someone else checking it
      // off) could have changed its status since the dialog snapshot was taken.
      const current = this._item(dialog.item.uid) ?? dialog.item;
      if (!(await this._guarded(() => renameItem(hass, config.entity, current, summary)))) {
        return;
      }
    }
    this._closeDialog();
  };

  private _deleteFromDialog = async () => {
    const dialog = this._dialog;
    if (this._pending) {
      return;
    }
    if (dialog?.kind === "edit" && this.hass && this._config) {
      const { hass, _config: config } = this;
      if (!(await this._guarded(() => deleteItems(hass, config.entity, [dialog.item.uid])))) {
        return;
      }
    }
    this._closeDialog();
  };

  private _signIn = () => {
    navigate(INTEGRATION_PAGE);
  };

  private _dragStart = (ev: DragEvent) => {
    const li = ev.currentTarget as HTMLElement;
    this._dragUid = li.dataset.uid ?? null;
    ev.dataTransfer?.setData("text/plain", this._dragUid ?? "");
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = "move";
    }
  };

  private _dragOver = (ev: DragEvent) => {
    if (!this._dragUid) {
      return;
    }
    ev.preventDefault();
    const li = (ev.target as HTMLElement).closest<HTMLElement>("li.item");
    if (!li) {
      return;
    }
    const rect = li.getBoundingClientRect();
    const index = Number(li.dataset.index);
    this._dropIndex = ev.clientY > rect.top + rect.height / 2 ? index + 1 : index;
  };

  private _drop = (ev: DragEvent) => {
    ev.preventDefault();
    const uid = this._dragUid;
    const target = this._dropIndex;
    this._dragUid = null;
    this._dropIndex = null;
    if (!uid || target === null) {
      return;
    }
    const active = this._view().active;
    const from = active.findIndex((item) => item.uid === uid);
    const to = target > from ? target - 1 : target;
    void this._move(uid, to);
  };

  private _dragEnd = () => {
    this._dragUid = null;
    this._dropIndex = null;
  };

  private _handleKeydown = (ev: KeyboardEvent) => {
    if (ev.key !== "ArrowUp" && ev.key !== "ArrowDown") {
      return;
    }
    ev.preventDefault();
    const button = ev.currentTarget as HTMLElement;
    const uid = button.dataset.uid!;
    const index = Number(button.dataset.index);
    const to = ev.key === "ArrowUp" ? index - 1 : index + 1;
    const active = this._view().active;
    if (to < 0 || to >= active.length) {
      return;
    }
    void this._move(uid, to).then(async () => {
      await this.updateComplete;
      this.renderRoot.querySelector<HTMLElement>(`.handle[data-uid="${uid}"]`)?.focus();
    });
  };

  private async _move(uid: string, newIndex: number): Promise<void> {
    if (!this.hass || !this._config || !this._items) {
      return;
    }
    const previous = this._items;
    const { active, completed } = this._view();
    if (!active.some((item) => item.uid === uid)) {
      return;
    }
    const { order, previousUid } = previousUidAfterMove(active, uid, newIndex);
    this._items = [...order, ...completed];
    const { hass, _config: config } = this;
    const version = this._itemsVersion;
    if (!(await this._call(() => moveItem(hass, config.entity, uid, previousUid)))) {
      if (this._itemsVersion === version && this._config === config && this._items) {
        const current = new Map(this._items.map((it) => [it.uid, it]));
        this._items = previous.map((it) => current.get(it.uid) ?? it);
      }
    }
  }

  // Sizes, weights and spacing follow the quiet-rail design — see docs/card.md#design-fidelity
  static override styles = css`
    :host {
      display: block;
    }
    ha-card {
      display: block;
      position: relative;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      color: var(--primary-text-color);
      font-family: var(--ha-card-font-family, var(--paper-font-body1_-_font-family, inherit));
      --la-target: 44px;
      --la-muted: var(--secondary-text-color);
    }
    button {
      font: inherit;
      color: inherit;
      background: none;
      border: 0;
      padding: 0;
      margin: 0;
      cursor: pointer;
    }
    button:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--la-ink);
      outline-offset: 2px;
    }
    svg {
      display: block;
    }
    .viewer button.summary,
    .viewer .check {
      cursor: default;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 18px 0;
    }
    .tile {
      flex: none;
      width: 38px;
      height: 38px;
      border-radius: 11px;
      display: grid;
      place-items: center;
      background: var(--la-accent);
      color: var(--la-glyph);
    }
    .titles {
      flex: 1;
      min-width: 0;
    }
    .title {
      margin: 0;
      font-size: 17.5px;
      font-weight: 800;
      letter-spacing: -0.2px;
      line-height: 1.25;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .subline {
      margin: 1px 0 0;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--la-muted);
    }

    .progress {
      height: 5px;
      margin: 14px 18px 0;
      border-radius: 99px;
      background: var(--la-track);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 99px;
      background: var(--la-accent);
      transition: width 200ms ease;
    }

    .add {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: 16px 18px 0;
      padding: 13px 14px;
      border-radius: 10px 10px 0 0;
      background: var(--la-field);
      border-bottom: 2px solid var(--la-accent);
    }
    .add-input {
      flex: 1;
      min-width: 0;
      padding: 0;
      font: inherit;
      font-size: 15.5px;
      font-weight: 500;
      line-height: 20px;
      color: var(--primary-text-color);
      background: transparent;
      border: 0;
      outline: none;
    }
    .add-input::placeholder {
      color: var(--la-muted);
      opacity: 1;
    }
    .add-btn {
      flex: none;
      position: relative;
      width: 20px;
      height: 20px;
      color: var(--la-ink);
    }
    .add-btn svg {
      stroke-width: 2.4;
    }
    .add-btn::before,
    .menu-btn::before {
      content: "";
      position: absolute;
      inset: -12px;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 6px;
    }
    .completed .section-head {
      padding: 14px 16px 4px;
    }
    .section-head h3 {
      margin: 0;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--la-muted);
    }
    .divider {
      height: 1px;
      margin: 12px 0 0;
      background: var(--divider-color);
    }
    .menu-btn {
      position: relative;
      padding: 5px;
      border-radius: 6px;
      color: var(--la-muted);
    }
    .menu-btn:hover,
    .menu-btn[aria-expanded="true"] {
      background: var(--la-hover);
    }
    .dots {
      display: flex;
      gap: 3px;
    }
    .dots i {
      width: 3.5px;
      height: 3.5px;
      border-radius: 50%;
      background: currentColor;
    }

    .items {
      list-style: none;
      margin: 0;
      padding: 0 10px 4px;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 2px;
    }
    .completed .items {
      padding-bottom: 12px;
    }
    .section:last-child .items {
      padding-bottom: 12px;
    }
    .wide .items {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 13px;
      min-height: var(--la-target);
      box-sizing: border-box;
      padding: 11px 8px;
      border-radius: 10px;
    }
    .item.interactive:hover {
      background: var(--la-hover);
    }
    .check {
      flex: none;
      position: relative;
      width: 22px;
      height: 22px;
      cursor: pointer;
    }
    .check input {
      position: absolute;
      inset: -11px;
      width: var(--la-target);
      height: var(--la-target);
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }
    .check input:disabled {
      cursor: default;
    }
    .box {
      width: 22px;
      height: 22px;
      box-sizing: border-box;
      border-radius: 7px;
      border: 2px solid var(--la-muted);
      display: grid;
      place-items: center;
      color: transparent;
      transition:
        background 120ms ease,
        border-color 120ms ease;
    }
    .box svg {
      stroke-width: 3.2;
    }
    .check input:checked + .box {
      background: var(--la-accent);
      border-color: var(--la-accent);
      color: var(--la-glyph);
    }
    .check input:focus-visible + .box {
      outline: 2px solid var(--la-ink);
      outline-offset: 2px;
    }
    .summary {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      padding: 0;
      text-align: left;
      font-size: 15.5px;
      font-weight: 600;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .done .summary {
      font-weight: 500;
      color: var(--la-muted);
      text-decoration: line-through;
    }
    .handle {
      flex: none;
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      cursor: grab;
      color: var(--la-muted);
    }
    .reorder .item.dragging {
      opacity: 0.4;
    }
    .reorder .item.drop-before {
      box-shadow: inset 0 2px 0 var(--la-accent);
    }

    .more {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin: 6px 18px 0;
      padding: 4px 0;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--la-ink);
    }
    .more svg {
      stroke-width: 2.6;
    }
    .section:last-child .more {
      margin-bottom: 14px;
    }

    .menu-wrap {
      position: relative;
    }
    .menu {
      position: absolute;
      top: calc(100% + 2px);
      right: 0;
      z-index: 2;
      min-width: 200px;
      padding: 4px 0;
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      border: 1px solid var(--divider-color);
    }
    .menu.up {
      top: auto;
      bottom: calc(100% + 2px);
    }
    .menu button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-height: var(--la-target);
      padding: 0 16px;
      text-align: left;
      white-space: nowrap;
      font-size: 14px;
      font-weight: 600;
    }
    .menu button:hover {
      background: var(--la-hover);
    }
    .danger {
      color: var(--error-color, #db4437);
    }

    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 9px;
      text-align: center;
      padding: 30px 22px 28px;
    }
    .state.all-done {
      padding: 26px 22px 24px;
    }
    .state.unavailable {
      gap: 10px;
      padding: 30px 22px 26px;
    }
    .state-icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: var(--la-tint);
      color: var(--la-ink);
    }
    .state-icon.done {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--la-accent);
      color: var(--la-glyph);
    }
    .state-icon.done svg {
      stroke-width: 3;
    }
    .warn {
      color: var(--warning-color, #f59e0b);
    }
    .state h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
    }
    .state p {
      margin: 0;
      max-width: 250px;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--la-muted);
    }
    .state.unavailable p {
      max-width: 270px;
    }
    .state .primary,
    .state .text {
      margin-top: 6px;
    }
    .notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: var(--warning-color, #ff9800);
    }

    .primary {
      padding: 9px 16px;
      border-radius: 10px;
      background: var(--la-accent);
      color: var(--la-glyph);
      font-size: 14px;
      font-weight: 700;
    }
    .primary.danger-bg {
      background: var(--error-color, #db4437);
      color: #fff;
    }
    .text {
      padding: 9px 16px;
      border-radius: 10px;
      color: var(--la-ink);
      font-size: 14px;
      font-weight: 700;
    }
    .text:hover {
      background: var(--la-hover);
    }
    .primary:hover {
      filter: brightness(0.95);
    }

    .dialog {
      min-width: min(320px, calc(100vw - 32px));
      max-width: 480px;
      padding: 20px 24px;
      border: 0;
      border-radius: var(--ha-dialog-border-radius, 28px);
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color);
      box-shadow: var(--ha-card-box-shadow, 0 8px 32px rgba(0, 0, 0, 0.32));
    }
    .dialog::backdrop {
      background: rgba(0, 0, 0, 0.32);
    }
    .dialog h3 {
      margin: 0 0 12px;
      font-size: 17.5px;
      font-weight: 800;
      letter-spacing: -0.2px;
    }
    .dialog p {
      margin: 0 0 12px;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--la-muted);
    }
    .field {
      display: block;
    }
    .field span {
      display: block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--la-muted);
      margin-bottom: 6px;
    }
    .field input {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 14px;
      font: inherit;
      font-size: 15.5px;
      font-weight: 500;
      color: var(--primary-text-color);
      background: var(--la-field);
      border: 0;
      border-radius: 10px 10px 0 0;
      border-bottom: 2px solid var(--la-accent);
      outline: none;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 20px;
    }
    .spacer {
      flex: 1;
    }
  `;
}

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, ListAppListCard);
}

window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "Listapp list",
    description: "A Listapp list with its colour, icon and progress.",
    preview: true,
  });
}
