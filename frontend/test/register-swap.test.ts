// @vitest-environment happy-dom
// HA's app bundle replaces window.customElements with its scoped-registry polyfill; a define that
// landed on the original registry must be repeated on the replacement — see docs/card.md#registry-patching
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineWithSwapGuard } from "../src/register.js";

class FakeRegistry {
  readonly defined = new Map<string, CustomElementConstructor>();
  private readonly waiting = new Map<string, (ctor: CustomElementConstructor) => void>();
  get(tag: string): CustomElementConstructor | undefined {
    return this.defined.get(tag);
  }
  define(tag: string, ctor: CustomElementConstructor): void {
    this.defined.set(tag, ctor);
    this.waiting.get(tag)?.(ctor);
  }
  whenDefined(tag: string): Promise<CustomElementConstructor> {
    const ctor = this.defined.get(tag);
    if (ctor) {
      return Promise.resolve(ctor);
    }
    return new Promise((resolve) => this.waiting.set(tag, resolve));
  }
}

const install = (registry: FakeRegistry): void => {
  Object.defineProperty(window, "customElements", {
    value: registry,
    configurable: true,
    writable: true,
  });
};

const microtasks = () => new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

describe("defineWithSwapGuard", () => {
  const original = window.customElements;
  afterEach(() => {
    install(original as unknown as FakeRegistry);
    vi.useRealTimers();
  });

  it("re-defines on the registry that replaces the one it first defined on", async () => {
    const before = new FakeRegistry();
    install(before);
    class Card extends HTMLElement {}
    const resolved = vi.fn();
    defineWithSwapGuard([["swap-test-card", Card]], { onAllResolved: resolved });
    expect(before.get("swap-test-card")).toBe(Card);
    expect(resolved).toHaveBeenCalledTimes(1);

    // What the polyfill does: a brand-new registry, then HA defines <home-assistant> on it,
    // which also registers a stand-in on the old (native) one.
    const after = new FakeRegistry();
    install(after);
    class App extends HTMLElement {}
    after.define("home-assistant", App);
    before.define("home-assistant", class extends HTMLElement {});
    await microtasks();

    expect(after.get("swap-test-card")).toBe(Card);
    expect(resolved).toHaveBeenCalledTimes(2);
  });

  it("catches a swap by polling even if <home-assistant> never defines", async () => {
    vi.useFakeTimers();
    const before = new FakeRegistry();
    install(before);
    class Card extends HTMLElement {}
    defineWithSwapGuard([["swap-poll-card", Card]]);
    const after = new FakeRegistry();
    install(after);
    expect(after.get("swap-poll-card")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(300);
    expect(after.get("swap-poll-card")).toBe(Card);
  });

  it("does nothing when the registry is never replaced, and stops polling", async () => {
    vi.useFakeTimers();
    const only = new FakeRegistry();
    install(only);
    const define = vi.spyOn(only, "define");
    class Card extends HTMLElement {}
    const resolved = vi.fn();
    defineWithSwapGuard([["swap-stable-card", Card]], { onAllResolved: resolved });
    only.define("home-assistant", class extends HTMLElement {});
    await vi.advanceTimersByTimeAsync(31_000);
    expect(define.mock.calls.filter(([tag]) => tag === "swap-stable-card")).toHaveLength(1);
    expect(resolved).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("only re-defines what the replacement is missing", async () => {
    const before = new FakeRegistry();
    install(before);
    class Card extends HTMLElement {}
    class Editor extends HTMLElement {}
    defineWithSwapGuard([["swap-partial-card", Card], ["swap-partial-editor", Editor]]);

    const after = new FakeRegistry();
    after.define("swap-partial-card", Card);
    install(after);
    const define = vi.spyOn(after, "define");
    after.define("home-assistant", class extends HTMLElement {});
    before.define("home-assistant", class extends HTMLElement {});
    await microtasks();

    expect(define.mock.calls.map(([tag]) => tag)).toEqual(["home-assistant", "swap-partial-editor"]);
    expect(after.get("swap-partial-card")).toBe(Card);
    expect(after.get("swap-partial-editor")).toBe(Editor);
  });
});
