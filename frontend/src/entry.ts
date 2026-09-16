// Defines the card tags synchronously, then lazy-loads the implementation — see
// docs/card.md#fast-registration
import { CARD_TYPE, resolveConfig, stubConfig, type ListAppCardConfig } from "./config.js";
import { CARD_IMPL_TAG, EDITOR_IMPL_TAG, EDITOR_TAG } from "./tags.js";
import type { HomeAssistant } from "./ha.js";

declare const __IMPL_URL__: string;

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}

// Baked in at build time; the fallback is the source-tree path used by vitest and the harness.
const IMPL_URL = typeof __IMPL_URL__ === "string" ? __IMPL_URL__ : "./listapp-list-card.js";
const LOAD_FAILED = "Listapp couldn't load the card. Check your connection and reload.";

const importImpl = (): Promise<unknown> => import(IMPL_URL);

let loader: () => Promise<unknown> = importImpl;
let pending: Promise<unknown> | undefined;

// Exported so tests can drive the not-yet-loaded and failed-import paths deterministically.
export function setImplLoader(fn: (() => Promise<unknown>) | undefined): void {
  loader = fn ?? importImpl;
  pending = undefined;
}

export function loadImpl(): Promise<unknown> {
  return (pending ??= loader());
}

interface CardImpl extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: ListAppCardConfig): void;
  getCardSize?(): number;
  getGridOptions?(): unknown;
}

class LazyHost extends HTMLElement {
  protected _impl?: CardImpl;
  protected _config?: ListAppCardConfig;
  protected _hass?: HomeAssistant;
  protected _failed = false;
  protected readonly implTag: string = "";

  set hass(value: HomeAssistant | undefined) {
    this._hass = value;
    if (this._impl) {
      this._impl.hass = value;
    }
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  setConfig(config: ListAppCardConfig): void {
    this._config = config;
    if (this._impl) {
      this._impl.setConfig(config);
    }
    this._load();
  }

  connectedCallback(): void {
    this.style.display = "block";
    this._load();
  }

  protected _load(): void {
    if (this._impl || this._failed) {
      return;
    }
    void loadImpl().then(
      () => this._mount(),
      (err: unknown) => this._fail(err),
    );
  }

  private _mount(): void {
    if (this._impl || this._failed || this._config === undefined) {
      return;
    }
    const impl = document.createElement(this.implTag) as CardImpl;
    impl.setConfig(this._config);
    if (this._hass) {
      impl.hass = this._hass;
    }
    this._impl = impl;
    this.replaceChildren(impl);
  }

  private _fail(err: unknown): void {
    this._failed = true;
    console.error("listapp-list-card: failed to load the card implementation", err);
    const notice = document.createElement("div");
    notice.style.cssText = "padding:16px;color:var(--error-color,#db4437);font-size:14px";
    notice.textContent = LOAD_FAILED;
    this.replaceChildren(notice);
  }
}

class ListAppListCardEntry extends LazyHost {
  static getStubConfig(
    hass: HomeAssistant,
    entities: string[] = [],
    fallback: string[] = [],
  ): ListAppCardConfig {
    // The Lovelace card picker calls this with only `hass` — see docs/card.md#stub-config.
    const candidates =
      entities.length || fallback.length ? [...entities, ...fallback] : Object.keys(hass.states);
    return stubConfig(candidates, hass.states);
  }

  static getConfigElement(): HTMLElement {
    return document.createElement(EDITOR_TAG);
  }

  protected override readonly implTag = CARD_IMPL_TAG;

  // Validates before the implementation exists, so a bad config still throws from setConfig.
  override setConfig(config: ListAppCardConfig): void {
    resolveConfig(config);
    super.setConfig(config);
  }

  getCardSize(): number {
    return this._impl?.getCardSize?.() ?? 3;
  }

  getGridOptions(): unknown {
    return this._impl?.getGridOptions?.() ?? { columns: 12, min_columns: 6 };
  }
}

class ListAppListCardEditorEntry extends LazyHost {
  protected override readonly implTag = EDITOR_IMPL_TAG;
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, ListAppListCardEntry);
}

if (!customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, ListAppListCardEditorEntry);
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
