import { describe, expect, it } from "vitest";
import { resolveConfig } from "../src/config.js";
import type { HassEntity, TodoItem } from "../src/ha.js";
import {
  classifyAvailability,
  collapse,
  deriveView,
  entityTitle,
  isViewer,
  previousUidAfterMove,
  splitItems,
  subline,
} from "../src/model.js";

const WRITE = 1 | 2 | 4 | 8;

const entity = (over: Partial<HassEntity["attributes"]> = {}, state = "2"): HassEntity => ({
  entity_id: "todo.listapp_groceries",
  state,
  attributes: {
    friendly_name: "Groceries",
    supported_features: WRITE,
    list_id: "groceries",
    list_color: null,
    list_icon: null,
    role: "owner",
    ...over,
  },
});

const item = (uid: string, done = false): TodoItem => ({
  uid,
  summary: uid,
  status: done ? ("completed" as TodoItem["status"]) : ("needs_action" as TodoItem["status"]),
});

const config = (over: Record<string, unknown> = {}) =>
  resolveConfig({ type: "x", entity: "todo.listapp_groceries", ...over });

const view = (over: Partial<Parameters<typeof deriveView>[0]> = {}) =>
  deriveView({
    config: config(),
    stateObj: entity(),
    items: [item("a"), item("b", true), item("c")],
    availability: "available",
    expanded: false,
    ...over,
  });

describe("splitItems / subline", () => {
  it("splits by status and keeps order", () => {
    const { active, completed } = splitItems([item("a"), item("b", true), item("c")]);
    expect(active.map((i) => i.uid)).toEqual(["a", "c"]);
    expect(completed.map((i) => i.uid)).toEqual(["b"]);
  });
  it("words the subline per state", () => {
    expect(subline(0, 0, false)).toBe("No items");
    expect(subline(5, 2, false)).toBe("2 of 5 done");
    expect(subline(1, 0, true)).toBe("1 item · view only");
    expect(subline(4, 1, true)).toBe("4 items · view only");
  });
});

describe("isViewer", () => {
  it("is true for role=viewer regardless of features", () => {
    expect(isViewer(entity({ role: "viewer" }))).toBe(true);
  });
  it("is true when create or update is unsupported", () => {
    expect(isViewer(entity({ role: "editor", supported_features: 0 }))).toBe(true);
    expect(isViewer(entity({ role: "owner", supported_features: 1 | 2 | 8 }))).toBe(true);
    expect(isViewer(entity({ role: "owner", supported_features: 2 | 4 | 8 }))).toBe(true);
  });
  it("is false for a writable owner/editor", () => {
    expect(isViewer(entity({ role: "editor" }))).toBe(false);
    expect(isViewer(entity({ role: null }))).toBe(false);
    expect(isViewer(undefined)).toBe(false);
  });
});

describe("collapse", () => {
  const items = ["a", "b", "c", "d", "e"];
  it("is off at 0", () => {
    expect(collapse(items, 0, false)).toEqual({ shown: items, hidden: 0 });
  });
  it("shows N and counts the rest", () => {
    expect(collapse(items, 3, false)).toEqual({ shown: ["a", "b", "c"], hidden: 2 });
  });
  it("does nothing when the list fits", () => {
    expect(collapse(items, 5, false)).toEqual({ shown: items, hidden: 0 });
    expect(collapse(items, 9, false)).toEqual({ shown: items, hidden: 0 });
  });
  it("shows everything once expanded", () => {
    expect(collapse(items, 3, true)).toEqual({ shown: items, hidden: 0 });
  });
});

describe("deriveView states", () => {
  it("missing entity", () => {
    expect(view({ stateObj: undefined }).state).toBe("missing");
  });
  it("loading before the first subscription message", () => {
    expect(view({ items: undefined }).state).toBe("loading");
  });
  it("empty / all_done / list", () => {
    expect(view({ items: [] }).state).toBe("empty");
    expect(view({ items: [item("a", true)] }).state).toBe("all_done");
    expect(view().state).toBe("list");
  });
  it("unavailable variants win over items", () => {
    const auth = view({ availability: "auth", stateObj: entity({}, "unavailable") });
    expect(auth.state).toBe("unavailable_auth");
    expect(view({ availability: "transient", stateObj: entity({}, "unavailable") }).state).toBe(
      "unavailable_transient",
    );
  });
  it("computes counts, progress and the subline", () => {
    const v = view();
    expect(v.total).toBe(3);
    expect(v.done).toBe(1);
    expect(v.progress).toBeCloseTo(1 / 3);
    expect(v.subline).toBe("1 of 3 done");
    expect(v.title).toBe("Groceries");
  });
  it("applies collapse_to to active items only", () => {
    const v = view({
      config: config({ collapse_to: 1 }),
      items: [item("a"), item("b"), item("c", true), item("d", true)],
    });
    expect(v.visibleActive.map((i) => i.uid)).toEqual(["a"]);
    expect(v.hiddenActive).toBe(1);
    expect(v.completed).toHaveLength(2);
    expect(view({ config: config({ collapse_to: 1 }), expanded: true }).hiddenActive).toBe(0);
  });
});

describe("viewer gating", () => {
  it("strips every write affordance for a viewer", () => {
    const v = view({ stateObj: entity({ role: "viewer", supported_features: 0 }) });
    expect(v.viewer).toBe(true);
    expect(v.showAdd).toBe(false);
    expect(v.canUpdate).toBe(false);
    expect(v.canDelete).toBe(false);
    expect(v.canMove).toBe(false);
    expect(v.subline).toBe("3 items · view only");
  });
  it("hides the add field when show_add is false even for writers", () => {
    expect(view({ config: config({ show_add: false }) }).showAdd).toBe(false);
    expect(view().showAdd).toBe(true);
  });
  it("uses the title override", () => {
    expect(view({ config: config({ title: "Mine" }) }).title).toBe("Mine");
  });
});

describe("entityTitle", () => {
  it("derives a readable name when friendly_name is missing", () => {
    expect(entityTitle(undefined, "todo.listapp_weekend_trip")).toBe("weekend trip");
    expect(entityTitle(entity({ friendly_name: "" }), "todo.listapp_x")).toBe("x");
  });
});

describe("classifyAvailability", () => {
  const down = entity({}, "unavailable");
  it("is available for any real state", () => {
    expect(classifyAvailability(entity(), [], [])).toBe("available");
    expect(classifyAvailability(entity({}, "0"), undefined, undefined)).toBe("available");
  });
  it("is auth when a listapp reauth flow is in progress", () => {
    expect(
      classifyAvailability(down, [], [{ flow_id: "f", handler: "listapp", context: { source: "reauth" } }]),
    ).toBe("auth");
  });
  it("ignores other integrations' flows and non-reauth sources", () => {
    expect(
      classifyAvailability(down, [], [
        { flow_id: "f", handler: "hue", context: { source: "reauth" } },
        { flow_id: "g", handler: "listapp", context: { source: "user" } },
      ]),
    ).toBe("transient");
  });
  it("is auth when the entry failed setup with an auth-flavoured reason", () => {
    expect(
      classifyAvailability(down, [{ entry_id: "e", domain: "listapp", state: "setup_error", reason: "Authentication expired" }], []),
    ).toBe("auth");
    expect(
      classifyAvailability(down, [{ entry_id: "e", domain: "listapp", state: "setup_retry", reason: "timeout" }], []),
    ).toBe("transient");
  });
  it("only counts the entity's own config entry when the entry id is known", () => {
    const flows = [{ flow_id: "f", handler: "listapp", context: { source: "reauth", entry_id: "acct-a" } }];
    const entries = [{ entry_id: "acct-a", domain: "listapp", state: "setup_error", reason: "Authentication expired" }];
    expect(classifyAvailability(down, entries, flows, "acct-a")).toBe("auth");
    expect(classifyAvailability(down, entries, flows, "acct-b")).toBe("transient");
    expect(classifyAvailability(down, entries, flows, undefined)).toBe("auth");
  });
  it("defaults to transient when the websocket lookups are unavailable", () => {
    expect(classifyAvailability(down, undefined, undefined)).toBe("transient");
    expect(classifyAvailability(entity({}, "unknown"), undefined, undefined)).toBe("transient");
  });
});

describe("previousUidAfterMove", () => {
  const active = [item("a"), item("b"), item("c"), item("d")];
  it("moves to the top with no previous uid", () => {
    const { order, previousUid } = previousUidAfterMove(active, "c", 0);
    expect(order.map((i) => i.uid)).toEqual(["c", "a", "b", "d"]);
    expect(previousUid).toBeUndefined();
  });
  it("moves down and names the new predecessor", () => {
    const { order, previousUid } = previousUidAfterMove(active, "a", 2);
    expect(order.map((i) => i.uid)).toEqual(["b", "c", "a", "d"]);
    expect(previousUid).toBe("c");
  });
  it("clamps out-of-range targets", () => {
    expect(previousUidAfterMove(active, "a", 99).order.map((i) => i.uid)).toEqual(["b", "c", "d", "a"]);
    expect(previousUidAfterMove(active, "d", -5).order.map((i) => i.uid)).toEqual(["d", "a", "b", "c"]);
  });
  it("is a no-op for an unknown uid", () => {
    expect(previousUidAfterMove(active, "zzz", 1).order).toBe(active);
  });
});
