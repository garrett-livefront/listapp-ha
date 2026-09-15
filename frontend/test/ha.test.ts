import { describe, expect, it, vi } from "vitest";
import { renameItem, TodoItemStatus, type HomeAssistant, type TodoItem } from "../src/ha.js";

function fakeHass(): HomeAssistant {
  return {
    states: {},
    connection: { subscribeMessage: vi.fn() },
    callWS: vi.fn(),
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

describe("renameItem", () => {
  it("preserves a completed item's status instead of defaulting to needs_action", () => {
    const hass = fakeHass();
    const item: TodoItem = { uid: "1", summary: "old", status: TodoItemStatus.Completed };
    void renameItem(hass, "todo.listapp_x", item, "new");
    expect(hass.callService).toHaveBeenCalledWith(
      "todo",
      "update_item",
      { item: "1", rename: "new", status: TodoItemStatus.Completed },
      { entity_id: "todo.listapp_x" },
    );
  });

  it("defaults a null status to needs_action", () => {
    const hass = fakeHass();
    const item: TodoItem = { uid: "2", summary: "old", status: null };
    void renameItem(hass, "todo.listapp_x", item, "new");
    expect(hass.callService).toHaveBeenCalledWith(
      "todo",
      "update_item",
      { item: "2", rename: "new", status: TodoItemStatus.NeedsAction },
      { entity_id: "todo.listapp_x" },
    );
  });
});
