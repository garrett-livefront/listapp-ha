// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { DEFAULTS, ListAppListCardEditor, fromFormData, listAppTodoEntities, toFormData } from "../src/editor.js";
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

function hass(entity = "todo.groceries"): HomeAssistant {
  return {
    states: { [entity]: { entity_id: entity, state: "0", attributes: { list_id: "l1" } } },
  } as unknown as HomeAssistant;
}

async function mount(config: Record<string, unknown> = {}): Promise<ListAppListCardEditor> {
  const editor = document.createElement("listapp-list-card-editor") as ListAppListCardEditor;
  editor.setConfig({ type: "custom:listapp-list-card", entity: "todo.groceries", ...config });
  editor.hass = hass();
  document.body.append(editor);
  await editor.updateComplete;
  return editor;
}

describe("ListAppListCardEditor", () => {
  it("renders the native fallback when ha-form is not registered", async () => {
    const editor = await mount();
    expect(editor.shadowRoot!.querySelector("ha-form")).toBeNull();
    expect(editor.shadowRoot!.querySelector(".native")).not.toBeNull();
  });

  it("emits config-changed with the updated value from a native control", async () => {
    const editor = await mount();
    const events: Array<{ config: Record<string, unknown> }> = [];
    editor.addEventListener("config-changed", (ev) => events.push((ev as CustomEvent).detail));

    const titleInput = editor.shadowRoot!.querySelectorAll("input")[0] as HTMLInputElement;
    titleInput.value = "Custom title";
    titleInput.dispatchEvent(new Event("input"));

    expect(events).toHaveLength(1);
    expect(events[0]!.config).toMatchObject({ entity: "todo.groceries", title: "Custom title" });
  });

  it("shows the viewer hint only for a view-only list", async () => {
    const viewerHass = {
      states: {
        "todo.groceries": {
          entity_id: "todo.groceries",
          state: "0",
          attributes: { list_id: "l1", role: "viewer", supported_features: 0 },
        },
      },
    } as unknown as HomeAssistant;
    const editor = document.createElement("listapp-list-card-editor") as ListAppListCardEditor;
    editor.setConfig({ type: "custom:listapp-list-card", entity: "todo.groceries" });
    editor.hass = viewerHass;
    document.body.append(editor);
    await editor.updateComplete;
    expect(editor.shadowRoot!.querySelector(".hint")).not.toBeNull();
  });

  it("upgrades to ha-form once it becomes defined after mount", async () => {
    const editor = await mount();
    expect(editor.shadowRoot!.querySelector("ha-form")).toBeNull();

    class FakeHaForm extends HTMLElement {}
    customElements.define("ha-form", FakeHaForm);
    await customElements.whenDefined("ha-form");
    await editor.updateComplete;

    expect(editor.shadowRoot!.querySelector("ha-form")).not.toBeNull();
  });
});
