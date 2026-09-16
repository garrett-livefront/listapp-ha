import type { ResolvedConfig } from "./config.js";
import {
  TodoFeature,
  TodoItemStatus,
  UNAVAILABLE,
  UNKNOWN,
  supportsFeature,
  type ConfigEntry,
  type FlowProgress,
  type HassEntity,
  type TodoItem,
} from "./ha.js";

export type CardState =
  | "missing"
  | "unavailable_auth"
  | "unavailable_transient"
  | "loading"
  | "empty"
  | "all_done"
  | "list";

export type Availability = "available" | "auth" | "transient";

export interface ItemSplit {
  active: TodoItem[];
  completed: TodoItem[];
}

export interface CardView {
  state: CardState;
  viewer: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canMove: boolean;
  title: string;
  subline: string;
  total: number;
  done: number;
  progress: number;
  active: TodoItem[];
  completed: TodoItem[];
  visibleActive: TodoItem[];
  hiddenActive: number;
  showHeader: boolean;
  showAdd: boolean;
  showCompleted: boolean;
  showProgress: boolean;
}

export function splitItems(items: TodoItem[]): ItemSplit {
  const active: TodoItem[] = [];
  const completed: TodoItem[] = [];
  for (const item of items) {
    (item.status === TodoItemStatus.Completed ? completed : active).push(item);
  }
  return { active, completed };
}

export function isViewer(stateObj: HassEntity | undefined): boolean {
  if (!stateObj) {
    return false;
  }
  if (stateObj.attributes.role === "viewer") {
    return true;
  }
  return (
    !supportsFeature(stateObj, TodoFeature.CREATE) || !supportsFeature(stateObj, TodoFeature.UPDATE)
  );
}

export function collapse<T>(items: T[], collapseTo: number, expanded: boolean): { shown: T[]; hidden: number } {
  if (expanded || collapseTo <= 0 || items.length <= collapseTo) {
    return { shown: items, hidden: 0 };
  }
  return { shown: items.slice(0, collapseTo), hidden: items.length - collapseTo };
}

export function subline(total: number, done: number, viewer: boolean): string {
  if (viewer) {
    return `${total} ${total === 1 ? "item" : "items"} · view only`;
  }
  if (total === 0) {
    return "No items";
  }
  return `${done} of ${total} done`;
}

export function entityTitle(stateObj: HassEntity | undefined, entityId: string): string {
  const name = stateObj?.attributes.friendly_name;
  if (typeof name === "string" && name.trim()) {
    return name;
  }
  return entityId.split(".")[1]?.replace(/^listapp_/, "").replace(/_/g, " ") ?? entityId;
}

// The card treats `unknown` like `unavailable`, as the stock to-do card does.
export const isUnavailable = (stateObj: HassEntity): boolean =>
  stateObj.state === UNAVAILABLE || stateObj.state === UNKNOWN;

// Scoped to the entity's own config entry when known — see docs/card.md#auth-vs-transient-unavailability
export function classifyAvailability(
  stateObj: HassEntity | undefined,
  entries: ConfigEntry[] | undefined,
  flows: FlowProgress[] | undefined,
  entryId: string | null | undefined = undefined,
  domain = "listapp",
): Availability {
  if (!stateObj || !isUnavailable(stateObj)) {
    return "available";
  }
  const reauthFlow = flows?.some(
    (flow) =>
      flow.handler === domain &&
      flow.context?.source === "reauth" &&
      (!entryId || flow.context.entry_id === entryId),
  );
  if (reauthFlow) {
    return "auth";
  }
  const authError = entries?.some(
    (entry) =>
      entry.domain === domain &&
      (!entryId || entry.entry_id === entryId) &&
      entry.state === "setup_error" &&
      /auth|token|sign in|log in|credential/i.test(entry.reason ?? ""),
  );
  return authError ? "auth" : "transient";
}

export interface ViewInput {
  config: ResolvedConfig;
  stateObj: HassEntity | undefined;
  items: TodoItem[] | undefined;
  availability: Availability;
  expanded: boolean;
}

export function deriveView({ config, stateObj, items, availability, expanded }: ViewInput): CardView {
  const viewer = isViewer(stateObj);
  const canCreate = !viewer && supportsFeature(stateObj, TodoFeature.CREATE);
  const canUpdate = !viewer && supportsFeature(stateObj, TodoFeature.UPDATE);
  const canDelete = !viewer && supportsFeature(stateObj, TodoFeature.DELETE);
  const canMove = !viewer && supportsFeature(stateObj, TodoFeature.MOVE);
  const { active, completed } = splitItems(items ?? []);
  const total = active.length + completed.length;
  const done = completed.length;
  const { shown, hidden } = collapse(active, config.collapseTo, expanded);

  let state: CardState;
  if (!stateObj) {
    state = "missing";
  } else if (availability === "auth") {
    state = "unavailable_auth";
  } else if (availability === "transient") {
    state = "unavailable_transient";
  } else if (items === undefined) {
    state = "loading";
  } else if (total === 0) {
    state = "empty";
  } else if (active.length === 0) {
    state = "all_done";
  } else {
    state = "list";
  }

  return {
    state,
    viewer,
    canCreate,
    canUpdate,
    canDelete,
    canMove,
    title: config.title ?? entityTitle(stateObj, config.entity),
    subline: subline(total, done, viewer),
    total,
    done,
    progress: total === 0 ? 0 : done / total,
    active,
    completed,
    visibleActive: shown,
    hiddenActive: hidden,
    showHeader: config.showHeader,
    showAdd: config.showAdd && canCreate,
    showCompleted: config.showCompleted,
    // Hiding the header hides the progress bar underneath it too — see docs/card.md#options.
    showProgress: config.showProgress && config.showHeader,
  };
}

export function previousUidAfterMove(
  active: TodoItem[],
  uid: string,
  newIndex: number,
): { order: TodoItem[]; previousUid: string | undefined } {
  const order = active.filter((item) => item.uid !== uid);
  const moving = active.find((item) => item.uid === uid);
  if (!moving) {
    return { order: active, previousUid: undefined };
  }
  const index = Math.max(0, Math.min(newIndex, order.length));
  order.splice(index, 0, moving);
  return { order, previousUid: index === 0 ? undefined : order[index - 1]!.uid };
}
