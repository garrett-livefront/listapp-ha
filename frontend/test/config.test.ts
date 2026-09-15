import { describe, expect, it } from "vitest";
import { resolveConfig, stubConfig } from "../src/config.js";

describe("resolveConfig", () => {
  it("applies the documented defaults", () => {
    expect(resolveConfig({ type: "custom:listapp-list-card", entity: "todo.listapp_x" })).toEqual({
      entity: "todo.listapp_x",
      title: undefined,
      useListColor: true,
      showTitle: true,
      showAdd: true,
      showCompleted: true,
      showProgress: true,
      collapseTo: 0,
      itemTapAction: "toggle",
    });
  });

  it("honours explicit options", () => {
    const resolved = resolveConfig({
      type: "x",
      entity: "todo.a",
      title: "Custom",
      use_list_color: false,
      show_title: false,
      show_add: false,
      show_completed: false,
      show_progress: false,
      collapse_to: 4,
      item_tap_action: "edit",
    });
    expect(resolved).toMatchObject({
      title: "Custom",
      useListColor: false,
      showTitle: false,
      showAdd: false,
      showCompleted: false,
      showProgress: false,
      collapseTo: 4,
      itemTapAction: "edit",
    });
  });

  it("treats a blank title as no override", () => {
    expect(resolveConfig({ type: "x", entity: "todo.a", title: "   " }).title).toBeUndefined();
  });

  it("rejects non-todo entities and bad values", () => {
    expect(() => resolveConfig({ type: "x", entity: "light.a" })).toThrow(/todo domain/);
    expect(() => resolveConfig({ type: "x" } as never)).toThrow(/todo domain/);
    expect(() => resolveConfig({ type: "x", entity: "todo.a", collapse_to: -1 })).toThrow(/collapse_to/);
    expect(() => resolveConfig({ type: "x", entity: "todo.a", collapse_to: 1.5 })).toThrow(/collapse_to/);
    expect(() =>
      resolveConfig({ type: "x", entity: "todo.a", item_tap_action: "open" as never }),
    ).toThrow(/item_tap_action/);
  });
});

describe("stubConfig", () => {
  it("prefers a ListApp todo entity, then any todo entity", () => {
    expect(stubConfig(["light.a", "todo.other", "todo.listapp_groceries"]).entity).toBe(
      "todo.listapp_groceries",
    );
    expect(stubConfig(["light.a", "todo.other"]).entity).toBe("todo.other");
    expect(stubConfig(["light.a"])).toEqual({ type: "custom:listapp-list-card", entity: "" });
  });
});
