// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListAppListCard } from "../src/listapp-list-card.js";
import { TodoItemStatus, type HomeAssistant, type TodoItem } from "../src/ha.js";

const ENTITY = "todo.listapp_test";
const WRITE = 1 | 2 | 4 | 8;

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: unknown) => void };

function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const item = (uid: string, summary: string, done = false): TodoItem => ({
  uid,
  summary,
  status: done ? TodoItemStatus.Completed : TodoItemStatus.NeedsAction,
});

class FakeHass implements HomeAssistant {
  states: HomeAssistant["states"] = {};
  themes = { darkMode: false };
  subscribers = new Map<string, (update: { items: TodoItem[] }) => void>();
  unsubscribed: string[] = [];
  subscribeDeferred?: Deferred<() => void>;
  callService = vi.fn<HomeAssistant["callService"]>().mockResolvedValue(undefined);
  callWS = vi.fn<(message: Record<string, unknown>) => Promise<unknown>>().mockResolvedValue(undefined) as unknown as HomeAssistant["callWS"] &
    ReturnType<typeof vi.fn<(message: Record<string, unknown>) => Promise<unknown>>>;
  connection = {
    subscribeMessage: <T>(callback: (message: T) => void, message: Record<string, unknown>): Promise<() => void> => {
      const entity = message.entity_id as string;
      this.subscribers.set(entity, callback as (update: { items: TodoItem[] }) => void);
      const unsub = () => {
        this.subscribers.delete(entity);
        this.unsubscribed.push(entity);
      };
      return this.subscribeDeferred ? this.subscribeDeferred.promise.then(() => unsub) : Promise.resolve(unsub);
    },
  };

  push(entity: string, items: TodoItem[]): void {
    this.subscribers.get(entity)?.({ items });
  }

  setEntity(entity: string, state = "2", features = WRITE): void {
    this.states = {
      ...this.states,
      [entity]: {
        entity_id: entity,
        state,
        attributes: { friendly_name: "Test", supported_features: features, list_id: "l1", color: null, icon: null, role: "owner" },
      },
    };
  }
}

async function mount(hass: FakeHass, config: Record<string, unknown> = {}, items?: TodoItem[]) {
  const card = new ListAppListCard();
  card.setConfig({ type: "custom:listapp-list-card", entity: ENTITY, ...config });
  card.hass = hass;
  document.body.append(card);
  await card.updateComplete;
  if (items) {
    hass.push(ENTITY, items);
    await card.updateComplete;
  }
  return card;
}

const root = (card: ListAppListCard) => card.shadowRoot!;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function calls(hass: FakeHass, service: string) {
  return hass.callService.mock.calls.filter(([, name]) => name === service);
}

async function openConfirmClear(card: ListAppListCard) {
  root(card).querySelector<HTMLElement>('.menu-btn[data-menu="completed"]')!.click();
  await card.updateComplete;
  root(card).querySelector<HTMLElement>(".menu button.danger")!.click();
  await card.updateComplete;
  return root(card).querySelector<HTMLButtonElement>("dialog .danger-bg")!;
}

let hass: FakeHass;

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  hass = new FakeHass();
  hass.setEntity(ENTITY);
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("subscription lifecycle", () => {
  it("subscribes on mount and unsubscribes on disconnect", async () => {
    const card = await mount(hass, {}, [item("a", "Milk")]);
    expect(root(card).textContent).toContain("Milk");
    card.remove();
    await flush();
    expect(hass.unsubscribed).toEqual([ENTITY]);
  });

  it("drops a push from the old entity after the config switches to a new one", async () => {
    const card = await mount(hass, {}, [item("a", "Milk")]);
    const other = "todo.listapp_other";
    hass.setEntity(other);
    card.hass = hass;
    card.setConfig({ type: "custom:listapp-list-card", entity: other });
    await card.updateComplete;
    hass.push(ENTITY, [item("z", "Stale")]);
    hass.push(other, [item("b", "Eggs")]);
    await card.updateComplete;
    expect(root(card).textContent).toContain("Eggs");
    expect(root(card).textContent).not.toContain("Stale");
  });

  it("unsubscribes a subscription that resolves only after the card was disconnected", async () => {
    hass.subscribeDeferred = deferred();
    const card = await mount(hass);
    card.remove();
    hass.subscribeDeferred.resolve(() => undefined);
    await flush();
    expect(hass.unsubscribed).toEqual([ENTITY]);
  });
});

describe("optimistic toggles", () => {
  it("rolls back every failed toggle, not only the most recent one", async () => {
    const first = deferred();
    const second = deferred();
    hass.callService.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs")]);
    const boxes = () => Array.from(root(card).querySelectorAll<HTMLInputElement>(".check input"));
    boxes()[0]!.click();
    boxes()[1]!.click();
    await card.updateComplete;
    expect(boxes().map((b) => b.checked)).toEqual([true, true]);
    second.reject(new Error("offline"));
    await flush();
    await card.updateComplete;
    first.reject(new Error("offline"));
    await flush();
    await card.updateComplete;
    expect(boxes().map((b) => b.checked)).toEqual([false, false]);
  });

  it("does not roll back over a subscription update that landed meanwhile", async () => {
    const pending = deferred();
    hass.callService.mockReturnValueOnce(pending.promise);
    const card = await mount(hass, {}, [item("a", "Milk")]);
    root(card).querySelector<HTMLInputElement>(".check input")!.click();
    await card.updateComplete;
    hass.push(ENTITY, [item("a", "Milk", true)]);
    await card.updateComplete;
    pending.reject(new Error("late failure"));
    await flush();
    await card.updateComplete;
    expect(root(card).querySelector<HTMLInputElement>(".check input")!.checked).toBe(true);
  });
});

describe("in-flight guards", () => {
  it("clear completed fires remove_item once for a double click", async () => {
    const pending = deferred();
    hass.callService.mockReturnValueOnce(pending.promise);
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true)]);
    const button = await openConfirmClear(card);
    button.click();
    button.click();
    await card.updateComplete;
    expect(calls(hass, "remove_item")).toHaveLength(1);
    expect(button.disabled).toBe(true);
    pending.resolve();
    await flush();
    await card.updateComplete;
    expect(root(card).querySelector("dialog")).toBeNull();
  });

  it("clear completed only deletes items still completed when confirmed", async () => {
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true), item("c", "Jam", true)]);
    const button = await openConfirmClear(card);
    hass.push(ENTITY, [item("a", "Milk"), item("b", "Eggs"), item("c", "Jam", true)]);
    await card.updateComplete;
    button.click();
    await flush();
    expect(calls(hass, "remove_item")[0]![2]).toEqual({ item: ["c"] });
  });

  it("delete from the edit dialog fires remove_item once for a double click", async () => {
    const pending = deferred();
    hass.callService.mockReturnValueOnce(pending.promise);
    const card = await mount(hass, { item_tap_action: "edit" }, [item("a", "Milk")]);
    root(card).querySelector<HTMLElement>("button.summary")!.click();
    await card.updateComplete;
    const del = root(card).querySelector<HTMLButtonElement>("dialog button.danger")!;
    del.click();
    del.click();
    await card.updateComplete;
    expect(calls(hass, "remove_item")).toHaveLength(1);
    pending.reject(new Error("offline"));
    await flush();
    await card.updateComplete;
    expect(root(card).querySelector("dialog")).not.toBeNull();
    expect(del.disabled).toBe(false);
  });

  it("add ignores a second submit while the first is in flight", async () => {
    const pending = deferred();
    hass.callService.mockReturnValueOnce(pending.promise);
    const card = await mount(hass, {}, [item("a", "Milk")]);
    const input = root(card).querySelector<HTMLInputElement>(".add-input")!;
    const form = root(card).querySelector<HTMLFormElement>("form.add")!;
    input.value = "Eggs";
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    await flush();
    expect(calls(hass, "add_item")).toHaveLength(1);
    pending.resolve();
    await flush();
    expect(input.value).toBe("");
    input.value = "Jam";
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    await flush();
    expect(calls(hass, "add_item")).toHaveLength(2);
  });
});

describe("menus and dialogs", () => {
  it("opens the Completed section's menu upward so ha-card's overflow can't clip it", async () => {
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true)]);
    root(card).querySelector<HTMLElement>('.menu-btn[data-menu="completed"]')!.click();
    await card.updateComplete;
    expect(root(card).querySelector(".menu")!.classList.contains("up")).toBe(true);
  });

  it("opens the header Clear-completed menu downward", async () => {
    const card = await mount(hass, { show_completed: false }, [item("a", "Milk"), item("b", "Eggs", true)]);
    root(card).querySelector<HTMLElement>('header .menu-btn[data-menu="completed"]')!.click();
    await card.updateComplete;
    expect(root(card).querySelector(".menu")!.classList.contains("up")).toBe(false);
  });

  it("closes an open dialog and menu when the card is disconnected", async () => {
    const card = await mount(hass, { item_tap_action: "edit" }, [item("a", "Milk")]);
    root(card).querySelector<HTMLElement>("button.summary")!.click();
    await card.updateComplete;
    expect(root(card).querySelector("dialog")).not.toBeNull();
    card.remove();
    document.body.append(card);
    await card.updateComplete;
    expect(root(card).querySelector("dialog")).toBeNull();
  });
});

describe("reorder", () => {
  it("ignores a drop for an item that left the active list during the drag", async () => {
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs")]);
    root(card).querySelector<HTMLElement>('.menu-btn[data-menu="active"]')!.click();
    await card.updateComplete;
    root(card).querySelector<HTMLElement>(".menu button")!.click();
    await card.updateComplete;
    const li = root(card).querySelector<HTMLElement>('li[data-uid="a"]')!;
    li.dispatchEvent(new Event("dragstart", { bubbles: true }));
    hass.push(ENTITY, [item("a", "Milk", true), item("b", "Eggs")]);
    await card.updateComplete;
    const list = root(card).querySelector<HTMLElement>("ul.items")!;
    const over = new Event("dragover", { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(over, "clientY", { value: 0 });
    root(card).querySelector<HTMLElement>('li[data-uid="b"]')!.dispatchEvent(over);
    list.dispatchEvent(new Event("drop", { bubbles: true, cancelable: true }));
    await flush();
    expect(hass.callWS.mock.calls.some(([m]) => m.type === "todo/item/move")).toBe(false);
  });
});

describe("availability", () => {
  it("ignores a slow availability check that resolves after the entity recovered", async () => {
    const flows = deferred<unknown>();
    hass.callWS.mockImplementation((message) => {
      if (message.type === "config_entries/flow/progress") {
        return flows.promise;
      }
      if (message.type === "config_entries/get") {
        return Promise.resolve([]);
      }
      return Promise.resolve({ entity_id: ENTITY, config_entry_id: "e1" });
    });
    hass.setEntity(ENTITY, "unavailable");
    const card = await mount(hass);
    expect(root(card).textContent).toContain("Can't reach");
    hass.setEntity(ENTITY, "2");
    card.hass = hass;
    await card.updateComplete;
    flows.resolve([{ flow_id: "f", handler: "listapp", context: { source: "reauth", entry_id: "e1" } }]);
    await flush();
    await card.updateComplete;
    expect(root(card).textContent).not.toContain("sign in");
  });

  it("clears the recheck interval on disconnect", async () => {
    vi.useFakeTimers();
    hass.setEntity(ENTITY, "unavailable");
    const card = await mount(hass);
    const before = hass.callWS.mock.calls.length;
    card.remove();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(hass.callWS.mock.calls.length).toBe(before);
  });
});
