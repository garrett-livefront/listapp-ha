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

describe("waiting for a guarded implementation tag", () => {
  afterEach(() => {
    document.body.replaceChildren();
    setImplLoader(undefined);
  });

  it("holds off mounting until the chunk's own retried define takes", async () => {
    // The chunk resolved, but its defineWithRetry has not landed the tag yet.
    setImplLoader(() => Promise.resolve({}));
    const el = mount(CARD_TYPE);
    el.setConfig(VALID);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(customElements.get(CARD_IMPL_TAG)).toBeFalsy();
    expect(el.querySelector(CARD_IMPL_TAG)).toBeNull();
    expect(el.textContent).toBe("");

    customElements.define(CARD_IMPL_TAG, StubImpl);
    await customElements.whenDefined(CARD_IMPL_TAG);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const impl = el.querySelector(CARD_IMPL_TAG) as StubImpl;
    expect(impl).toBeTruthy();
    expect(impl.config).toEqual(VALID);
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
