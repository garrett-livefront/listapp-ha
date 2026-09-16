// @vitest-environment happy-dom
// A fake ha-form so the schema-level `disabled` path (the one HA's real card editor takes) gets
// covered too, not just the native fallback (Copilot review comment on PR #19). Isolated in its
// own file since registering the custom element name is global to this file's DOM and would
// otherwise short-circuit editor.test.ts's native-fallback assertions.
import { beforeAll, describe, expect, it } from "vitest";
import "../src/editor.js";
import type { ListAppListCardEditor } from "../src/editor.js";
import type { HomeAssistant } from "../src/ha.js";

class FakeHaForm extends HTMLElement {
  schema: Array<{ name: string; disabled?: boolean }> = [];
}

function hass(): HomeAssistant {
  return {
    states: { "todo.groceries": { entity_id: "todo.groceries", state: "0", attributes: { list_id: "l1" } } },
  } as unknown as HomeAssistant;
}

async function mount(config: Record<string, unknown>): Promise<ListAppListCardEditor> {
  const editor = document.createElement("listapp-list-card-editor") as ListAppListCardEditor;
  editor.setConfig({ type: "custom:listapp-list-card", entity: "todo.groceries", ...config });
  editor.hass = hass();
  document.body.append(editor);
  await editor.updateComplete;
  return editor;
}

function findSchemaRow(editor: ListAppListCardEditor, name: string) {
  const form = editor.shadowRoot!.querySelector("ha-form") as unknown as FakeHaForm;
  return form.schema.find((row) => row.name === name);
}

describe("ListAppListCardEditor ha-form path", () => {
  beforeAll(() => {
    customElements.define("ha-form", FakeHaForm);
  });

  it("disables the show_progress schema row while show_header is off", async () => {
    const editor = await mount({ show_header: false });
    expect(findSchemaRow(editor, "show_progress")?.disabled).toBe(true);
  });

  it("enables the show_progress schema row while show_header is on", async () => {
    const editor = await mount({ show_header: true });
    expect(findSchemaRow(editor, "show_progress")?.disabled).toBe(false);
  });
});
