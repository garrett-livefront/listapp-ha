import { describe, expect, it } from "vitest";
import {
  accentInk,
  avatarColor,
  buildPalette,
  contrast,
  LIST_COLORS,
  parseCssColor,
  parseHex,
  resolveListColor,
  WHITE,
} from "../src/color.js";

// Vectors computed by running listapp-mobile lib/avatar.ts avatarColor() under node.
const AVATAR_VECTORS: [string, string][] = [
  ["", "#f59e0b"],
  ["a", "#14b8a6"],
  ["groceries", "#14b8a6"],
  ["0b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e", "#f59e0b"],
  ["list-1", "#f59e0b"],
  ["list-2", "#22c55e"],
  ["list-3", "#0ea5e9"],
  ["7f3d9a2c-1b4e-4c8f-9a6d-2e5b8c1f0a3d", "#6366f1"],
  ["ünïcödé", "#14b8a6"],
  ["The quick brown fox", "#14b8a6"],
  ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "#6366f1"],
];

describe("avatarColor", () => {
  it.each(AVATAR_VECTORS)("matches the mobile app for %j", (seed, expected) => {
    expect(avatarColor(seed)).toBe(expected);
  });
});

describe("resolveListColor", () => {
  it("uses the entity colour when it is a valid hex", () => {
    expect(resolveListColor("#EAB308", "x")).toBe("#eab308");
    expect(resolveListColor("abc", "x")).toBe("#aabbcc");
  });
  it("falls back to avatarColor(list_id) for null or garbage", () => {
    expect(resolveListColor(null, "groceries")).toBe("#14b8a6");
    expect(resolveListColor("not-a-colour", "groceries")).toBe("#14b8a6");
    expect(resolveListColor(undefined, undefined)).toBe(avatarColor(""));
  });
});

describe("parsing", () => {
  it("parses hex and rgb()", () => {
    expect(parseHex("#ff0000")).toEqual([255, 0, 0]);
    expect(parseCssColor("rgb(18, 52, 86)")).toEqual([18, 52, 86]);
    expect(parseCssColor("rgba(255, 255, 255, 0.5)")).toEqual([255, 255, 255]);
    expect(parseCssColor("hotpink")).toBeNull();
  });
});

describe("glyph", () => {
  it.each(LIST_COLORS)("%s always gets a white glyph (Garrett's decision, 2026-09-15)", (hex) => {
    expect(buildPalette(hex, "#ffffff", false).glyph).toBe(WHITE);
  });
});

describe("accentInk", () => {
  it("lightens by 38% on dark backgrounds", () => {
    expect(accentInk(parseHex("#6366f1")!, [28, 28, 28], true)).toBe("#9ea0f6");
  });
  it.each(LIST_COLORS)("%s reaches 4.5:1 against white in light mode", (hex) => {
    const ink = accentInk(parseHex(hex)!, [255, 255, 255], false);
    expect(contrast(parseHex(ink)!, [255, 255, 255])).toBeGreaterThanOrEqual(4.5);
  });
  it("leaves an already-readable accent alone", () => {
    expect(accentInk(parseHex("#9810fa")!, [255, 255, 255], false)).toBe("#9810fa");
  });
  it("keeps darkening until 4.5:1 on a grey card, and terminates at black", () => {
    const ink = accentInk([255, 255, 255], [128, 128, 128], false);
    expect(contrast(parseHex(ink)!, [128, 128, 128])).toBeGreaterThanOrEqual(4.5);
    expect(accentInk([255, 255, 255], [0, 0, 0], false)).toBe("#ffffff");
    expect(accentInk([40, 40, 40], [0, 0, 0], false)).toBe("#000000");
  });
});

describe("palette", () => {
  it("falls back to HA's primary colour for an unparsable accent", () => {
    expect(buildPalette("var(--nope)", "#fff", false).accent).toBe("#03a9f4");
  });
});
