// @vitest-environment happy-dom
// Its own file so the implementation tags start undefined: entry.test.ts defines them, and a
// registry keeps a tag for the life of the document — see docs/card.md#registry-patching
import { afterEach, describe, expect, it, vi } from "vitest";
import { CARD_TYPE } from "../src/config.js";
import { CARD_IMPL_TAG, EDITOR_IMPL_TAG, EDITOR_TAG } from "../src/tags.js";
import { setImplLoader } from "../src/entry.js";

interface Host extends HTMLElement {
  setConfig(config: unknown): void;
}

class StubImpl extends HTMLElement {
  config?: unknown;
  setConfig(config: unknown): void {
    this.config = config;
  }
}

const VALID = { type: `custom:${CARD_TYPE}`, entity: "todo.groceries" };

const mount = (tag: string): Host => {
  const el = document.createElement(tag) as Host;
  document.body.append(el);
  return el;
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("waiting for the implementation tag", () => {
  const original = window.customElements;

  afterEach(() => {
    Object.defineProperty(window, "customElements", { value: original, configurable: true, writable: true });
    document.body.replaceChildren();
    setImplLoader(undefined);
  });

  it("holds off mounting until the chunk has defined its tag", async () => {
    // The chunk's import resolved, but nothing has defined the tag yet.
    setImplLoader(() => Promise.resolve({}));
    const el = mount(CARD_TYPE);
    el.setConfig(VALID);
    await tick();

    expect(customElements.get(CARD_IMPL_TAG)).toBeFalsy();
    expect(el.querySelector(CARD_IMPL_TAG)).toBeNull();
    expect(el.textContent).toBe("");

    customElements.define(CARD_IMPL_TAG, StubImpl);
    await customElements.whenDefined(CARD_IMPL_TAG);
    await tick();

    const impl = el.querySelector(CARD_IMPL_TAG) as StubImpl;
    expect(impl).toBeTruthy();
    expect(impl.config).toEqual(VALID);
  });

  it("waits on the registry that is current at mount time, not the one the entry defined on", async () => {
    // HA swaps window.customElements in after the entry has run. The chunk (and HA) will use the
    // replacement, so a host that captured the original would resolve against the wrong one.
    let visible = false;
    let release: (() => void) | undefined;
    const swapped = {
      get: (tag: string) => (tag === CARD_IMPL_TAG && !visible ? undefined : original.get(tag)),
      whenDefined: (tag: string) =>
        tag === CARD_IMPL_TAG && !visible
          ? new Promise<void>((resolve) => {
              release = resolve;
            })
          : original.whenDefined(tag),
      define: original.define.bind(original),
    };
    Object.defineProperty(window, "customElements", { value: swapped, configurable: true, writable: true });

    setImplLoader(() => Promise.resolve({}));
    const el = mount(CARD_TYPE);
    el.setConfig(VALID);
    await tick();
    // The original registry has the tag (from the test above); the current one says it doesn't.
    expect(original.get(CARD_IMPL_TAG)).toBeTruthy();
    expect(el.querySelector(CARD_IMPL_TAG)).toBeNull();

    visible = true;
    release?.();
    await tick();
    expect(el.querySelector(CARD_IMPL_TAG)).toBeTruthy();
  });

  it("falls back to the load notice when the tag never arrives", async () => {
    vi.useFakeTimers();
    try {
      setImplLoader(() => Promise.resolve({}));
      const el = mount(EDITOR_TAG);
      el.setConfig({ type: CARD_TYPE, entity: "" });

      await vi.advanceTimersByTimeAsync(2500);
      expect(customElements.get(EDITOR_IMPL_TAG)).toBeFalsy();
      expect(el.querySelector(EDITOR_IMPL_TAG)).toBeNull();
      expect(el.textContent).toMatch(/couldn't load the card/i);
    } finally {
      vi.useRealTimers();
    }
  });
});
