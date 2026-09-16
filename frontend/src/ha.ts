// Minimal typings for the parts of the Home Assistant frontend a custom card touches.

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown> & {
    friendly_name?: string;
    supported_features?: number;
    list_id?: string | null;
    list_color?: string | null;
    list_icon?: string | null;
    role?: string | null;
  };
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  themes?: { darkMode?: boolean };
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      message: Record<string, unknown>,
    ): Promise<() => void>;
  };
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ): Promise<unknown>;
}

export const enum TodoItemStatus {
  NeedsAction = "needs_action",
  Completed = "completed",
}

export interface TodoItem {
  uid: string;
  summary: string;
  status: TodoItemStatus | null;
  description?: string | null;
  due?: string | null;
}

export const TodoFeature = {
  CREATE: 1,
  DELETE: 2,
  UPDATE: 4,
  MOVE: 8,
} as const;

export const UNAVAILABLE = "unavailable";
export const UNKNOWN = "unknown";

export const supportsFeature = (stateObj: HassEntity | undefined, feature: number): boolean =>
  Boolean(((stateObj?.attributes.supported_features ?? 0) & feature) !== 0);

export const subscribeItems = (
  hass: HomeAssistant,
  entityId: string,
  callback: (update: { items: TodoItem[] }) => void,
) => hass.connection.subscribeMessage(callback, { type: "todo/item/subscribe", entity_id: entityId });

export const createItem = (hass: HomeAssistant, entityId: string, summary: string) =>
  hass.callService("todo", "add_item", { item: summary }, { entity_id: entityId });

export const setItemStatus = (
  hass: HomeAssistant,
  entityId: string,
  item: TodoItem,
  status: TodoItemStatus,
) => hass.callService("todo", "update_item", { item: item.uid, status }, { entity_id: entityId });

// Status must ride along: an omitted `status` maps to needs_action server-side
// (todo.py's async_update_todo_item), so a rename-only call would reopen a
// completed item — see docs/card.md.
export const renameItem = (hass: HomeAssistant, entityId: string, item: TodoItem, summary: string) =>
  hass.callService(
    "todo",
    "update_item",
    { item: item.uid, rename: summary, status: item.status ?? TodoItemStatus.NeedsAction },
    { entity_id: entityId },
  );

export const deleteItems = (hass: HomeAssistant, entityId: string, uids: string[]) =>
  hass.callService("todo", "remove_item", { item: uids }, { entity_id: entityId });

export const moveItem = (
  hass: HomeAssistant,
  entityId: string,
  uid: string,
  previousUid: string | undefined,
) =>
  hass.callWS<void>({ type: "todo/item/move", entity_id: entityId, uid, previous_uid: previousUid });

export interface ConfigEntry {
  entry_id: string;
  domain: string;
  state: string;
  reason?: string | null;
}

export interface FlowProgress {
  flow_id: string;
  handler: string;
  context?: { source?: string; entry_id?: string };
}

export interface EntityRegistryEntry {
  entity_id: string;
  config_entry_id?: string | null;
}

export const fetchEntityRegistryEntry = (hass: HomeAssistant, entityId: string) =>
  hass.callWS<EntityRegistryEntry>({ type: "config/entity_registry/get", entity_id: entityId });

export const fetchConfigEntries = (hass: HomeAssistant, domain: string) =>
  hass.callWS<ConfigEntry[]>({ type: "config_entries/get", domain });

export const fetchFlowsInProgress = (hass: HomeAssistant) =>
  hass.callWS<FlowProgress[]>({ type: "config_entries/flow/progress" });

export const INTEGRATION_PAGE = "/config/integrations/integration/listapp";

export function navigate(path: string): void {
  history.pushState(null, "", path);
  window.dispatchEvent(
    new CustomEvent("location-changed", { bubbles: true, composed: true, detail: { replace: false } }),
  );
}
