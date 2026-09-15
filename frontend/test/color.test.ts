import { describe, expect, it } from "vitest";
import {
  accentInk,
  avatarColor,
  buildPalette,
  contrast,
  DARK_GLYPH,
  glyphOn,
  LIST_COLORS,
  parseCssColor,
  parseHex,
  resolveListColor,
  tintOf,
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

describe("glyph contrast over the 14 app colours", () => {
  const risky = ["#84cc16", "#eab308", "#f59e0b", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#f97316"];
  it.each(LIST_COLORS)("%s gets a glyph with at least 3:1 contrast", (hex) => {
    const rgb = parseHex(hex)!;
    const glyph = glyphOn(rgb);
    expect(contrast(parseHex(glyph)!, rgb)).toBeGreaterThanOrEqual(3);
  });
  it("uses a dark glyph where white fails 3:1", () => {
    for (const hex of risky) {
      expect(glyphOn(parseHex(hex)!)).toBe(DARK_GLYPH);
    }
    for (const hex of ["#9810fa", "#6366f1", "#ef4444", "#ec4899"]) {
      expect(glyphOn(parseHex(hex)!)).toBe(WHITE);
    }
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
});

describe("palette", () => {
  it("tints at 10% light and 18% dark", () => {
    expect(tintOf([1, 2, 3], false)).toBe("rgba(1, 2, 3, 0.1)");
    expect(tintOf([1, 2, 3], true)).toBe("rgba(1, 2, 3, 0.18)");
  });
  it("falls back to HA's primary colour for an unparsable accent", () => {
    expect(buildPalette("var(--nope)", "#fff", false).accent).toBe("#03a9f4");
  });
});
