export type ItemTapAction = "toggle" | "edit";

export interface ListAppCardConfig {
  type: string;
  entity: string;
  title?: string;
  use_list_color?: boolean;
  show_title?: boolean;
  show_add?: boolean;
  show_completed?: boolean;
  show_progress?: boolean;
  collapse_to?: number;
  item_tap_action?: ItemTapAction;
}

export interface ResolvedConfig {
  entity: string;
  title: string | undefined;
  useListColor: boolean;
  showTitle: boolean;
  showAdd: boolean;
  showCompleted: boolean;
  showProgress: boolean;
  collapseTo: number;
  itemTapAction: ItemTapAction;
}

export const CARD_TYPE = "listapp-list-card";

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

export function resolveConfig(config: ListAppCardConfig): ResolvedConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid configuration");
  }
  if (typeof config.entity !== "string" || config.entity.split(".")[0] !== "todo") {
    throw new Error("Specify an entity from within the todo domain");
  }
  if (
    config.item_tap_action !== undefined &&
    config.item_tap_action !== "toggle" &&
    config.item_tap_action !== "edit"
  ) {
    throw new Error("item_tap_action must be 'toggle' or 'edit'");
  }
  const collapse = Number(config.collapse_to ?? 0);
  if (!Number.isInteger(collapse) || collapse < 0) {
    throw new Error("collapse_to must be a non-negative integer");
  }
  return {
    entity: config.entity,
    title: typeof config.title === "string" && config.title.trim() ? config.title : undefined,
    useListColor: bool(config.use_list_color, true),
    showTitle: bool(config.show_title, true),
    showAdd: bool(config.show_add, true),
    showCompleted: bool(config.show_completed, true),
    showProgress: bool(config.show_progress, true),
    collapseTo: collapse,
    itemTapAction: config.item_tap_action ?? "toggle",
  };
}

export function stubConfig(entityIds: string[]): ListAppCardConfig {
  const entity = entityIds.find((id) => id.startsWith("todo.listapp_")) ??
    entityIds.find((id) => id.startsWith("todo.")) ??
    "";
  return { type: `custom:${CARD_TYPE}`, entity };
}
