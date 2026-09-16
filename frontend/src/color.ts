// avatarColor is a verbatim port of listapp-mobile lib/avatar.ts — see docs/card.md#colour
const AVATAR_COLORS = ["#f59e0b", "#14b8a6", "#6366f1", "#ec4899", "#0ea5e9", "#22c55e"];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export const LIST_COLORS = [
  "#9810fa",
  "#6366f1",
  "#3b82f6",
  "#0ea5e9",
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#f43f5e",
  "#ec4899",
];

export const HA_PRIMARY_FALLBACK = "#03a9f4";
export const WHITE = "#ffffff";

export type Rgb = [number, number, number];

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(value: string): Rgb | null {
  const match = HEX_RE.exec(value.trim());
  if (!match) {
    return null;
  }
  let hex = match[1]!;
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function parseCssColor(value: string): Rgb | null {
  const hex = parseHex(value);
  if (hex) {
    return hex;
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value.trim());
  if (!rgb) {
    return null;
  }
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((c) =>
    Math.max(0, Math.min(255, Math.round(c))),
  ) as Rgb;
}

export function toHex([r, g, b]: Rgb): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

export function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return color.map((c, i) => Math.round(c + (target[i]! - c) * amount)) as Rgb;
}

export const lighten = (color: Rgb, amount: number): Rgb => mix(color, [255, 255, 255], amount);
export const darken = (color: Rgb, amount: number): Rgb => mix(color, [0, 0, 0], amount);

export function resolveListColor(
  color: string | null | undefined,
  listId: string | null | undefined,
): string {
  if (typeof color === "string" && parseHex(color)) {
    return toHex(parseHex(color)!);
  }
  return avatarColor(listId ?? "");
}

export interface Palette {
  accent: string;
  glyph: string;
  ink: string;
  tint: string;
  field: string;
  hover: string;
  track: string;
}

// Neutral surfaces the design draws in fixed greys — translucent so they follow the theme's card bg.
export const NEUTRALS = {
  dark: { field: "rgba(0, 0, 0, 0.3)", hover: "rgba(255, 255, 255, 0.05)", track: "rgba(255, 255, 255, 0.14)" },
  light: { field: "rgba(0, 0, 0, 0.06)", hover: "rgba(0, 0, 0, 0.04)", track: "rgba(0, 0, 0, 0.1)" },
} as const;

export const INK_MIN_CONTRAST = 4.5;
export const DARK_INK_LIGHTEN = 0.38;

export function accentInk(accent: Rgb, background: Rgb, dark: boolean): string {
  if (dark) {
    return toHex(lighten(accent, DARK_INK_LIGHTEN));
  }
  let ink = accent;
  while (contrast(ink, background) < INK_MIN_CONTRAST && ink.some((c) => c > 0)) {
    const next = darken(ink, 0.12);
    ink = next.every((c, i) => c === ink[i]) ? ([0, 0, 0] as Rgb) : next;
  }
  return toHex(ink);
}

export function tintOf(accent: Rgb, dark: boolean): string {
  const [r, g, b] = accent;
  return `rgba(${r}, ${g}, ${b}, ${dark ? 0.18 : 0.1})`;
}

export function buildPalette(accentHex: string, backgroundHex: string, dark: boolean): Palette {
  const accent = parseCssColor(accentHex) ?? parseHex(HA_PRIMARY_FALLBACK)!;
  const background = parseCssColor(backgroundHex) ?? (dark ? [28, 28, 28] : [255, 255, 255]);
  return {
    accent: toHex(accent),
    glyph: WHITE,
    ink: accentInk(accent, background, dark),
    tint: tintOf(accent, dark),
    ...NEUTRALS[dark ? "dark" : "light"],
  };
}
