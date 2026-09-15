import { describe, expect, it } from "vitest";
import { DEFAULTS, fromFormData, listAppTodoEntities, toFormData } from "../src/editor.js";
import type { HomeAssistant } from "../src/ha.js";

function hassWith(entities: Record<string, { list_id?: string }>): HomeAssistant {
  const states: HomeAssistant["states"] = {};
  for (const [id, attrs] of Object.entries(entities)) {
    states[id] = { entity_id: id, state: "0", attributes: attrs } as never;
  }
  return { states } as HomeAssistant;
}

describe("listAppTodoEntities", () => {
  it("prefers entities carrying list_id", () => {
    const hass = hassWith({
      "todo.groceries": { list_id: "l1" },
      "todo.other": {},
      "light.a": {},
    });
    expect(listAppTodoEntities(hass)).toEqual(["todo.groceries"]);
  });

  it("falls back to every todo entity when none carry list_id", () => {
    const hass = hassWith({ "todo.a": {}, "todo.b": {}, "light.a": {} });
    expect(listAppTodoEntities(hass)).toEqual(["todo.a", "todo.b"]);
  });
});

describe("toFormData / fromFormData round trip", () => {
  it("applies documented defaults for a bare config", () => {
    expect(toFormData({ type: "x", entity: "todo.a" })).toEqual({
      entity: "todo.a",
      title: "",
      ...DEFAULTS,
    });
  });

  it("omits every default-valued key from the emitted config", () => {
    const data = toFormData({ type: "x", entity: "todo.a" });
    expect(fromFormData(data, "x")).toEqual({ type: "x", entity: "todo.a" });
  });

  it("round-trips every option through form data and back to config", () => {
    const overrides = {
      entity: "todo.a",
      title: "Custom title",
      use_list_color: false,
      show_title: false,
      show_add: false,
      show_completed: false,
      show_progress: false,
      collapse_to: 5,
      item_tap_action: "edit" as const,
    };
    const data = toFormData({ type: "x", ...overrides });
    expect(data).toEqual(overrides);

    const config = fromFormData(data, "x");
    expect(config).toEqual({ type: "x", ...overrides });

    expect(toFormData(config)).toEqual(overrides);
  });

  it("drops a blank title override", () => {
    const config = fromFormData({ ...toFormData({ type: "x", entity: "todo.a" }), title: "   " }, "x");
    expect(config.title).toBeUndefined();
  });
});
