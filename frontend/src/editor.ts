// Behaviour mirrors HA's hui-todo-list-card-editor.ts (Apache-2.0) — see NOTICE and docs/card.md
import { LitElement, css, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { HomeAssistant } from "./ha.js";
import { isViewer } from "./model.js";
import type { ItemTapAction, ListAppCardConfig } from "./config.js";

export const EDITOR_TAG = "listapp-list-card-editor";

export const DEFAULTS = {
  use_list_color: true,
  show_title: true,
  show_add: true,
  show_completed: true,
  show_progress: true,
  collapse_to: 0,
  item_tap_action: "toggle" as ItemTapAction,
};

export interface FormData {
  entity: string;
  title: string;
  use_list_color: boolean;
  show_title: boolean;
  show_add: boolean;
  show_completed: boolean;
  show_progress: boolean;
  collapse_to: number;
  item_tap_action: ItemTapAction;
}

const TAP_ACTION_OPTIONS = [
  { value: "toggle", label: "Toggle" },
  { value: "edit", label: "Edit" },
];

export function listAppTodoEntities(hass: HomeAssistant): string[] {
  const ids = Object.keys(hass.states).filter((id) => id.startsWith("todo."));
  const withListId = ids.filter((id) => typeof hass.states[id]?.attributes.list_id === "string");
  return withListId.length ? withListId : ids;
}

export function toFormData(config: ListAppCardConfig): FormData {
  return {
    entity: config.entity ?? "",
    title: config.title ?? "",
    use_list_color: config.use_list_color ?? DEFAULTS.use_list_color,
    show_title: config.show_title ?? DEFAULTS.show_title,
    show_add: config.show_add ?? DEFAULTS.show_add,
    show_completed: config.show_completed ?? DEFAULTS.show_completed,
    show_progress: config.show_progress ?? DEFAULTS.show_progress,
    collapse_to: config.collapse_to ?? DEFAULTS.collapse_to,
    item_tap_action: config.item_tap_action ?? DEFAULTS.item_tap_action,
  };
}

// Only non-default values survive, matching stock editors' clean-YAML behaviour.
export function fromFormData(data: FormData, type: string): ListAppCardConfig {
  const config: ListAppCardConfig = { type, entity: data.entity };
  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (title) {
    config.title = title;
  }
  if (data.use_list_color !== DEFAULTS.use_list_color) config.use_list_color = data.use_list_color;
  if (data.show_title !== DEFAULTS.show_title) config.show_title = data.show_title;
  if (data.show_add !== DEFAULTS.show_add) config.show_add = data.show_add;
  if (data.show_completed !== DEFAULTS.show_completed) config.show_completed = data.show_completed;
  if (data.show_progress !== DEFAULTS.show_progress) config.show_progress = data.show_progress;
  // ha-form's number selector can emit undefined (cleared) or a negative/fractional value.
  const collapseTo =
    typeof data.collapse_to === "number" && Number.isInteger(data.collapse_to) && data.collapse_to >= 0
      ? data.collapse_to
      : DEFAULTS.collapse_to;
  if (collapseTo !== DEFAULTS.collapse_to) config.collapse_to = collapseTo;
  if (data.item_tap_action !== DEFAULTS.item_tap_action) config.item_tap_action = data.item_tap_action;
  return config;
}

function schema(entityIds: string[]) {
  return [
    { name: "entity", required: true, selector: { entity: { include_entities: entityIds } } },
    { name: "title", selector: { text: {} } },
    { name: "use_list_color", selector: { boolean: {} } },
    { name: "show_title", selector: { boolean: {} } },
    { name: "show_add", selector: { boolean: {} } },
    { name: "show_completed", selector: { boolean: {} } },
    { name: "show_progress", selector: { boolean: {} } },
    { name: "collapse_to", selector: { number: { min: 0, mode: "box" } } },
    { name: "item_tap_action", selector: { select: { mode: "dropdown", options: TAP_ACTION_OPTIONS } } },
  ];
}

const LABELS: Record<string, string> = {
  entity: "List",
  title: "Title override",
  use_list_color: "Use list colour",
  show_title: "Show header",
  show_add: "Show add field",
  show_completed: "Show completed",
  show_progress: "Show progress bar",
  collapse_to: "Collapse to (0 = off)",
  item_tap_action: "Tap action",
};

export class ListAppListCardEditor extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;

  @state() private _config?: ListAppCardConfig;
  @state() private _haForm: boolean | null = null;

  setConfig(config: ListAppCardConfig): void {
    this._config = config;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._haForm = customElements.get("ha-form") ? true : null;
    if (this._haForm === null) {
      void customElements.whenDefined("ha-form").then(() => {
        this._haForm = true;
      });
    }
  }

  private _entityIds(): string[] {
    return this.hass ? listAppTodoEntities(this.hass) : [];
  }

  protected override render() {
    if (!this.hass || !this._config) {
      return nothing;
    }
    const data = toFormData(this._config);
    return html`
      ${this._haForm ? this._renderHaForm(data) : this._renderNative(data)}
      ${data.entity && isViewer(this.hass.states[data.entity])
        ? html`<p class="hint">The add field is always hidden for view-only lists, regardless of "Show add field".</p>`
        : nothing}
    `;
  }

  private _renderHaForm(data: FormData) {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema(this._entityIds())}
        .computeLabel=${(s: { name: string }) => LABELS[s.name] ?? s.name}
        @value-changed=${this._haFormChanged}
      ></ha-form>
    `;
  }

  private _haFormChanged = (ev: CustomEvent<{ value: FormData }>): void => {
    ev.stopPropagation();
    this._emit(ev.detail.value);
  };

  private _renderNative(data: FormData) {
    const entityIds = this._entityIds();
    return html`
      <div class="native">
        <label class="field">
          <span>${LABELS.entity}</span>
          <select .value=${data.entity} @change=${this._nativeChanged("entity")}>
            ${entityIds.length
              ? entityIds.map((id) => html`<option value=${id} ?selected=${id === data.entity}>${id}</option>`)
              : html`<option value="">No Listapp lists found</option>`}
          </select>
        </label>
        <label class="field">
          <span>${LABELS.title}</span>
          <input type="text" .value=${data.title} @input=${this._nativeChanged("title")} />
        </label>
        ${(
          [
            "use_list_color",
            "show_title",
            "show_add",
            "show_completed",
            "show_progress",
          ] as const
        ).map(
          (key) => html`
            <label class="field row">
              <span>${LABELS[key]}</span>
              <input type="checkbox" .checked=${data[key]} @change=${this._nativeChanged(key)} />
            </label>
          `,
        )}
        <label class="field">
          <span>${LABELS.collapse_to}</span>
          <input type="number" min="0" .value=${String(data.collapse_to)} @input=${this._nativeChanged("collapse_to")} />
        </label>
        <label class="field">
          <span>${LABELS.item_tap_action}</span>
          <select .value=${data.item_tap_action} @change=${this._nativeChanged("item_tap_action")}>
            ${TAP_ACTION_OPTIONS.map(
              (opt) => html`<option value=${opt.value} ?selected=${opt.value === data.item_tap_action}>${opt.label}</option>`,
            )}
          </select>
        </label>
      </div>
    `;
  }

  private _nativeChanged =
    (key: keyof FormData) =>
    (ev: Event): void => {
      const target = ev.currentTarget as HTMLInputElement | HTMLSelectElement;
      const data = toFormData(this._config!) as unknown as Record<string, unknown>;
      if (target instanceof HTMLInputElement && target.type === "checkbox") {
        data[key] = target.checked;
      } else if (target instanceof HTMLInputElement && target.type === "number") {
        data[key] = Math.max(0, Math.trunc(Number(target.value) || 0));
      } else {
        data[key] = target.value;
      }
      this._emit(data as unknown as FormData);
    };

  private _emit(data: FormData): void {
    const config = fromFormData(data, this._config!.type);
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  static override styles = css`
    :host {
      display: block;
    }
    .native {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: var(--primary-text-color);
      font-family: inherit;
    }
    .field.row {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .field span {
      font-size: 0.9rem;
      color: var(--secondary-text-color);
    }
    input,
    select {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 6px 8px;
    }
    .field.row input {
      width: 20px;
      height: 20px;
      padding: 0;
    }
    .hint {
      margin: 8px 0 0;
      font-size: 0.85rem;
      color: var(--secondary-text-color);
    }
  `;
}

if (typeof customElements !== "undefined" && !customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, ListAppListCardEditor);
}
