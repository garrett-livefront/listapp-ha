// Defines the card tags synchronously, then lazy-loads the implementation — see
// docs/card.md#fast-registration
import {
  CARD_TYPE,
  resolveConfig,
  stubConfig,
  type ListAppCardConfig,
  type ResolvedConfig,
} from "./config.js";
import { CARD_IMPL_TAG, EDITOR_IMPL_TAG, EDITOR_TAG } from "./tags.js";
import {
  REGISTRATION_TIMEOUT_MS,
  defineAll,
  defineWithSwapGuard,
  type RegistryEntries,
} from "./register.js";
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
      () => this._whenImplDefined().then(
        () => this._mount(),
        (err: unknown) => this._fail(err),
      ),
      (err: unknown) => this._fail(err),
    );
  }

  // The current window.customElements, not a captured one — see docs/card.md#registry-patching
  private _whenImplDefined(): Promise<unknown> {
    const registry = window.customElements;
    if (registry.get(this.implTag)) {
      return Promise.resolve();
    }
    return Promise.race([
      registry.whenDefined(this.implTag),
      new Promise((_resolve, reject) =>
        setTimeout(
          () => reject(new Error(`${this.implTag} was never defined`)),
          REGISTRATION_TIMEOUT_MS,
        ),
      ),
    ]);
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
  private _resolved?: ResolvedConfig;

  // Validates before the implementation exists, so a bad config still throws from setConfig.
  override setConfig(config: ListAppCardConfig): void {
    this._resolved = resolveConfig(config);
    super.setConfig(config);
  }

  // Mirrors the implementation's loading-state size, not its no-config size, so the row count
  // doesn't change when the chunk mounts — see docs/card.md#fast-registration
  getCardSize(): number {
    const loaded = this._impl?.getCardSize?.();
    if (loaded !== undefined) {
      return loaded;
    }
    if (!this._resolved || !this._hass?.states?.[this._resolved.entity]) {
      return 3;
    }
    return 1 + (this._resolved.showHeader ? 1 : 0);
  }

  getGridOptions(): unknown {
    return this._impl?.getGridOptions?.() ?? { columns: 12, min_columns: 6 };
  }
}

class ListAppListCardEditorEntry extends LazyHost {
  protected override readonly implTag = EDITOR_IMPL_TAG;
}

// Only once both host tags are defined: a card advertised without its element renders as HA's
// context-free "Configuration error" — see docs/card.md#registry-patching
function advertiseToPicker(): void {
  const cards = (window.customCards ??= []);
  if (!cards.some((card) => card.type === CARD_TYPE)) {
    cards.push({
      type: CARD_TYPE,
      name: "Listapp list",
      description: "A Listapp list with its colour, icon and progress.",
      preview: true,
    });
  }
}

const HOST_ENTRIES: RegistryEntries = [
  [CARD_TYPE, ListAppListCardEntry],
  [EDITOR_TAG, ListAppListCardEditorEntry],
];

// Exported for tests, which drive registration against a registry of their own.
export function registerCardElements(registry: CustomElementRegistry): boolean {
  return defineAll(registry, HOST_ENTRIES, { onAllResolved: advertiseToPicker });
}

// Not registerCardElements(customElements): the registry HA will look in may not exist yet — see
// docs/card.md#registry-patching
defineWithSwapGuard(HOST_ENTRIES, { onAllResolved: advertiseToPicker });
