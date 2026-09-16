// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CARD_TYPE } from "../src/config.js";
import { CARD_IMPL_TAG, EDITOR_IMPL_TAG, EDITOR_TAG } from "../src/tags.js";
import { loadImpl, setImplLoader } from "../src/entry.js";

const VALID = { type: `custom:${CARD_TYPE}`, entity: "todo.groceries" };

interface Host extends HTMLElement {
  hass?: unknown;
  setConfig(config: unknown): void;
  getCardSize?(): number;
  getGridOptions?(): unknown;
}

class StubImpl extends HTMLElement {
  config?: unknown;
  hass?: unknown;
  setConfig(config: unknown): void {
    this.config = config;
  }
  getCardSize(): number {
    return 9;
  }
  getGridOptions(): unknown {
    return { columns: 6, min_columns: 3 };
  }
}

class StubEditorImpl extends HTMLElement {
  config?: unknown;
  hass?: unknown;
  setConfig(config: unknown): void {
    this.config = config;
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const mount = (tag: string): Host => {
  const el = document.createElement(tag) as Host;
  document.body.append(el);
  return el;
};

describe("entry module registration", () => {
  it("defines both tags without the implementation chunk having loaded", () => {
    expect(customElements.get(CARD_TYPE)).toBeTruthy();
    expect(customElements.get(EDITOR_TAG)).toBeTruthy();
    // The point of the split: importing the entry must not drag the implementation tags in.
    expect(customElements.get(CARD_IMPL_TAG)).toBeFalsy();
    expect(customElements.get(EDITOR_IMPL_TAG)).toBeFalsy();
  });

  it("advertises the card to the Lovelace picker exactly once", () => {
    expect(window.customCards?.filter((c) => c.type === CARD_TYPE)).toHaveLength(1);
  });
});

describe("lazy card wrapper", () => {
  beforeEach(() => {
    if (!customElements.get(CARD_IMPL_TAG)) {
      customElements.define(CARD_IMPL_TAG, StubImpl);
    }
    if (!customElements.get(EDITOR_IMPL_TAG)) {
      customElements.define(EDITOR_IMPL_TAG, StubEditorImpl);
    }
    setImplLoader(() => Promise.resolve({}));
  });

  afterEach(() => {
    document.body.replaceChildren();
    setImplLoader(undefined);
  });

  it("throws synchronously on an invalid config, before any chunk loads", () => {
    const el = document.createElement(CARD_TYPE) as Host;
    expect(() => el.setConfig({ type: CARD_TYPE, entity: "light.kitchen" })).toThrow(
      /entity from within the todo domain/,
    );
  });

  it("reports a sensible size and grid before the implementation loads", () => {
    const el = document.createElement(CARD_TYPE) as Host;
    el.setConfig(VALID);
    expect(el.getCardSize?.()).toBe(3);
    expect(el.getGridOptions?.()).toEqual({ columns: 12, min_columns: 6 });
  });

  it("matches the implementation's loading size once hass has the entity", () => {
    const el = document.createElement(CARD_TYPE) as Host;
    el.setConfig(VALID);
    el.hass = { states: { "todo.groceries": { attributes: {} } } };
    // Implementation while items load: header(1) + no progress + no add form + no rows + 1.
    expect(el.getCardSize?.()).toBe(2);
  });

  it("drops the header row from the loading size when show_header is off", () => {
    const el = document.createElement(CARD_TYPE) as Host;
    el.setConfig({ ...VALID, show_header: false });
    el.hass = { states: { "todo.groceries": { attributes: {} } } };
    expect(el.getCardSize?.()).toBe(1);
  });

  it("keeps the no-config size when the entity is missing from hass", () => {
    const el = document.createElement(CARD_TYPE) as Host;
    el.setConfig(VALID);
    el.hass = { states: {} };
    expect(el.getCardSize?.()).toBe(3);
  });

  it("delegates size and grid to the implementation once it loads", async () => {
    const el = mount(CARD_TYPE);
    el.setConfig(VALID);
    await flush();
    expect(el.getCardSize?.()).toBe(9);
    expect(el.getGridOptions?.()).toEqual({ columns: 6, min_columns: 3 });
  });

  it("applies a hass set before the chunk arrived once it does", async () => {
    const el = mount(CARD_TYPE);
    el.setConfig(VALID);
    const hass = { states: {} };
    el.hass = hass;
    expect(el.querySelector(CARD_IMPL_TAG)).toBeNull();

    await flush();
    const impl = el.querySelector(CARD_IMPL_TAG) as StubImpl;
    expect(impl).toBeTruthy();
    expect(impl.config).toEqual(VALID);
    expect(impl.hass).toBe(hass);
  });

  it("forwards later hass and config updates straight through", async () => {
    const el = mount(CARD_TYPE);
    el.setConfig(VALID);
    await flush();
    const impl = el.querySelector(CARD_IMPL_TAG) as StubImpl;

    const next = { states: { a: 1 } };
    el.hass = next;
    el.setConfig({ ...VALID, title: "Shopping" });
    expect(impl.hass).toBe(next);
    expect(impl.config).toEqual({ ...VALID, title: "Shopping" });
  });

  it("surfaces a notice instead of hanging when the chunk fails to load", async () => {
    setImplLoader(() => Promise.reject(new Error("offline")));
    const el = mount(CARD_TYPE);
    el.setConfig(VALID);
    await flush();

    expect(el.querySelector(CARD_IMPL_TAG)).toBeNull();
    expect(el.textContent).toMatch(/couldn't load the card/i);
  });

  it("imports the implementation only once across several cards", async () => {
    let calls = 0;
    setImplLoader(() => {
      calls += 1;
      return Promise.resolve({});
    });
    mount(CARD_TYPE).setConfig(VALID);
    mount(CARD_TYPE).setConfig(VALID);
    await flush();
    expect(calls).toBe(1);
    await loadImpl();
    expect(calls).toBe(1);
  });
});

describe("lazy editor wrapper", () => {
  beforeEach(() => {
    if (!customElements.get(EDITOR_IMPL_TAG)) {
      customElements.define(EDITOR_IMPL_TAG, StubEditorImpl);
    }
    setImplLoader(() => Promise.resolve({}));
  });

  afterEach(() => {
    document.body.replaceChildren();
    setImplLoader(undefined);
  });

  it("is what getConfigElement hands Home Assistant", () => {
    const card = customElements.get(CARD_TYPE) as unknown as {
      getConfigElement(): HTMLElement;
    };
    expect(card.getConfigElement().tagName.toLowerCase()).toBe(EDITOR_TAG);
  });

  it("accepts a partial config without validating it, then delegates", async () => {
    const el = mount(EDITOR_TAG);
    const partial = { type: CARD_TYPE, entity: "" };
    expect(() => el.setConfig(partial)).not.toThrow();

    await flush();
    const impl = el.querySelector(EDITOR_IMPL_TAG) as StubEditorImpl;
    expect(impl.config).toEqual(partial);
  });
});
