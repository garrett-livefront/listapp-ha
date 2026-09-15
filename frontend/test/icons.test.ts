import { describe, expect, it } from "vitest";
import { LIST_ICON_MARKUP, UI_ICON_MARKUP } from "../src/icons.generated.js";
import { DEFAULT_LIST_ICON, LIST_ICON_KEYS, listIconKey } from "../src/icons.js";

// The 26 keys ListApp's mobile app writes (lib/list-appearance.ts), in its order.
const APP_KEYS = [
  "list-checks", "star", "heart", "sparkles", "gift",
  "home", "shopping-cart", "shopping-bag", "utensils", "coffee", "cake",
  "plane", "car", "map-pin", "luggage", "backpack",
  "briefcase", "dollar-sign", "book-open", "graduation-cap", "dumbbell", "music",
  "party-popper", "paw-print", "baby", "wrench",
];

describe("list icons", () => {
  it("bundles exactly the app's 26 keys", () => {
    expect([...LIST_ICON_KEYS].sort()).toEqual([...APP_KEYS].sort());
  });
  it("maps every key to itself and unknown or null keys to list-checks", () => {
    for (const key of APP_KEYS) {
      expect(listIconKey(key)).toBe(key);
    }
    expect(listIconKey(null)).toBe(DEFAULT_LIST_ICON);
    expect(listIconKey(undefined)).toBe(DEFAULT_LIST_ICON);
    expect(listIconKey("")).toBe(DEFAULT_LIST_ICON);
    expect(listIconKey("hologram")).toBe(DEFAULT_LIST_ICON);
    expect(listIconKey("constructor")).toBe(DEFAULT_LIST_ICON);
  });
  it("carries real path data, with utensils mapped to lucide's utensils-crossed", () => {
    for (const markup of Object.values(LIST_ICON_MARKUP)) {
      expect(markup).toMatch(/^<(path|circle|line|rect|polyline|ellipse) /);
    }
    expect(LIST_ICON_MARKUP.utensils).toContain("m16 2-2.3 2.3");
  });
  it("has the UI glyphs the card renders", () => {
    for (const name of ["plus", "check", "ellipsis-vertical", "circle-check", "triangle-alert", "cloud-off", "grip-vertical", "trash"]) {
      expect(UI_ICON_MARKUP[name as keyof typeof UI_ICON_MARKUP]).toBeTruthy();
    }
  });
});
