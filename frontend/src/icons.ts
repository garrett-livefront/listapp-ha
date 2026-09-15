import { svg, type TemplateResult } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { LIST_ICON_MARKUP, UI_ICON_MARKUP } from "./icons.generated.js";

export const DEFAULT_LIST_ICON = "list-checks";

export type UiIcon = keyof typeof UI_ICON_MARKUP;

export const LIST_ICON_KEYS = Object.keys(LIST_ICON_MARKUP);

export function listIconKey(key: string | null | undefined): string {
  return key && Object.hasOwn(LIST_ICON_MARKUP, key) ? key : DEFAULT_LIST_ICON;
}

const render = (markup: string, size: number): TemplateResult<2> =>
  svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${unsafeSVG(markup)}</svg>`;

export const listIcon = (key: string | null | undefined, size = 20) =>
  render(LIST_ICON_MARKUP[listIconKey(key)]!, size);

export const uiIcon = (name: UiIcon, size = 20) => render(UI_ICON_MARKUP[name], size);
