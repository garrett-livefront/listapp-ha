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
      show_header: false,
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

  it("treats an undefined title (ha-form clearing the field) as blank", () => {
    const data = { ...toFormData({ type: "x", entity: "todo.a" }), title: undefined as unknown as string };
    expect(() => fromFormData(data, "x")).not.toThrow();
    expect(fromFormData(data, "x").title).toBeUndefined();
  });

  it("normalizes an out-of-range collapse_to from ha-form's number selector", () => {
    const base = toFormData({ type: "x", entity: "todo.a" });
    expect(fromFormData({ ...base, collapse_to: undefined as unknown as number }, "x").collapse_to).toBeUndefined();
    expect(fromFormData({ ...base, collapse_to: -1 }, "x").collapse_to).toBeUndefined();
    expect(fromFormData({ ...base, collapse_to: 1.5 }, "x").collapse_to).toBeUndefined();
    expect(fromFormData({ ...base, collapse_to: 3 }, "x").collapse_to).toBe(3);
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

  it("keeps the configured entity selectable even without list_id, when others have it", async () => {
    const twoEntityHass = {
      states: {
        "todo.groceries": { entity_id: "todo.groceries", state: "0", attributes: { list_id: "l1" } },
        "todo.legacy": { entity_id: "todo.legacy", state: "0", attributes: {} },
      },
    } as unknown as HomeAssistant;
    const editor = document.createElement("listapp-list-card-editor") as ListAppListCardEditor;
    editor.setConfig({ type: "custom:listapp-list-card", entity: "todo.legacy" });
    editor.hass = twoEntityHass;
    document.body.append(editor);
    await editor.updateComplete;

    const select = editor.shadowRoot!.querySelector("select") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toContain("todo.legacy");
    expect(select.value).toBe("todo.legacy");
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

  it("carries an earlier native edit forward into the next one", async () => {
    const editor = await mount();
    const events: Array<{ config: Record<string, unknown> }> = [];
    editor.addEventListener("config-changed", (ev) => events.push((ev as CustomEvent).detail));

    const inputs = editor.shadowRoot!.querySelectorAll("input");
    const titleInput = inputs[0] as HTMLInputElement;
    titleInput.value = "Custom title";
    titleInput.dispatchEvent(new Event("input"));

    const showHeaderCheckbox = inputs[2] as HTMLInputElement;
    showHeaderCheckbox.checked = false;
    showHeaderCheckbox.dispatchEvent(new Event("change"));

    expect(events).toHaveLength(2);
    expect(events[1]!.config).toMatchObject({ title: "Custom title", show_header: false });
  });

  it("disables the show_progress control in the native fallback while show_header is off", async () => {
    const editor = await mount({ show_header: false });
    const inputs = editor.shadowRoot!.querySelectorAll("input");
    // Checkbox order matches the native render's field list: use_list_color, show_header,
    // show_add, show_completed, show_progress.
    const showProgressCheckbox = inputs[5] as HTMLInputElement;
    expect(showProgressCheckbox.disabled).toBe(true);
  });

  it("re-enables the show_progress control once show_header is on", async () => {
    const editor = await mount({ show_header: true });
    const inputs = editor.shadowRoot!.querySelectorAll("input");
    const showProgressCheckbox = inputs[5] as HTMLInputElement;
    expect(showProgressCheckbox.disabled).toBe(false);
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
