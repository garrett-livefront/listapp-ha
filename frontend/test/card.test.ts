// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListAppListCard } from "../src/listapp-list-card.js";
import { TodoItemStatus, type HomeAssistant, type TodoItem } from "../src/ha.js";
import { STRINGS as S } from "../src/strings.js";

const ENTITY = "todo.listapp_test";
const WRITE = 1 | 2 | 4 | 8;
const SUBSCRIBE_RETRY_CAP_MS = 30_000;

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
        attributes: { friendly_name: "Test", supported_features: features, list_id: "l1", list_color: null, list_icon: null, role: "owner" },
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

async function openConfirmClear(card: ListAppListCard, menu: "completed" | "active" = "completed") {
  root(card).querySelector<HTMLElement>(`.menu-btn[data-menu="${menu}"]`)!.click();
  await card.updateComplete;
  root(card).querySelector<HTMLElement>(".menu button.danger")!.click();
  await card.updateComplete;
  return root(card).querySelector<HTMLButtonElement>("dialog .danger-bg")!;
}

async function openConfirmUncheck(card: ListAppListCard, menu: "completed" | "active" = "completed") {
  root(card).querySelector<HTMLElement>(`.menu-btn[data-menu="${menu}"]`)!.click();
  await card.updateComplete;
  const buttons = Array.from(root(card).querySelectorAll<HTMLButtonElement>(".menu button"));
  buttons.find((b) => b.textContent?.trim() === S.uncheckAll)!.click();
  await card.updateComplete;
  return root(card).querySelector<HTMLButtonElement>("dialog .primary:not(.danger-bg)")!;
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
  vi.restoreAllMocks();
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

describe("subscription retry", () => {
  const tick = () => vi.advanceTimersByTimeAsync(0);

  function failingSubscribe(hass: FakeHass, shouldFail: () => boolean) {
    const attempts = { count: 0 };
    hass.connection.subscribeMessage = <T>(callback: (message: T) => void, message: Record<string, unknown>) => {
      attempts.count++;
      if (shouldFail()) {
        return Promise.reject(new Error("subscribe failed"));
      }
      const entity = message.entity_id as string;
      hass.subscribers.set(entity, callback as (update: { items: TodoItem[] }) => void);
      return Promise.resolve(() => {
        hass.subscribers.delete(entity);
        hass.unsubscribed.push(entity);
      });
    };
    return attempts;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("retries on a backoff timer, not on every hass update", async () => {
    const attempts = failingSubscribe(hass, () => true);
    const card = await mount(hass);
    await tick();
    expect(attempts.count).toBe(1);

    for (let i = 0; i < 5; i++) {
      card.requestUpdate("hass", undefined);
      await card.updateComplete;
    }
    expect(attempts.count).toBe(1);

    await vi.advanceTimersByTimeAsync(1_999);
    expect(attempts.count).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(attempts.count).toBe(2);

    await vi.advanceTimersByTimeAsync(3_999);
    expect(attempts.count).toBe(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(attempts.count).toBe(3);

    await vi.advanceTimersByTimeAsync(8_000);
    expect(attempts.count).toBe(4);
  });

  it("caps the delay so a long outage still retries every 30s", async () => {
    const attempts = failingSubscribe(hass, () => true);
    await mount(hass);
    await tick();
    for (let i = 0; i < 6; i++) {
      await vi.advanceTimersByTimeAsync(SUBSCRIBE_RETRY_CAP_MS);
    }
    const settled = attempts.count;
    await vi.advanceTimersByTimeAsync(SUBSCRIBE_RETRY_CAP_MS);
    expect(attempts.count).toBe(settled + 1);
  });

  it("restarts the backoff from the shortest delay after a successful subscribe", async () => {
    let fail = true;
    const attempts = failingSubscribe(hass, () => fail);
    const card = await mount(hass);
    await tick();
    await vi.advanceTimersByTimeAsync(2_000);
    await vi.advanceTimersByTimeAsync(4_000);
    expect(attempts.count).toBe(3);

    fail = false;
    await vi.advanceTimersByTimeAsync(8_000);
    expect(attempts.count).toBe(4);
    hass.push(ENTITY, [item("a", "Milk")]);
    await card.updateComplete;
    expect(root(card).textContent).toContain("Milk");

    fail = true;
    card.remove();
    document.body.append(card);
    await card.updateComplete;
    await tick();
    expect(attempts.count).toBe(5);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(attempts.count).toBe(6);
  });

  it("cancels a pending retry when the card is disconnected", async () => {
    const attempts = failingSubscribe(hass, () => true);
    const card = await mount(hass);
    await tick();
    expect(attempts.count).toBe(1);
    card.remove();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(attempts.count).toBe(1);
  });

  it("does not schedule a retry for a failure that lands after teardown", async () => {
    const pending = deferred<() => void>();
    let attempts = 0;
    hass.connection.subscribeMessage = <T>(_callback: (message: T) => void, _message: Record<string, unknown>) => {
      attempts++;
      return pending.promise;
    };
    const card = await mount(hass);
    await tick();
    expect(attempts).toBe(1);

    card.remove();
    pending.reject(new Error("subscribe failed"));
    await tick();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(attempts).toBe(1);
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

describe("uncheck all", () => {
  it("marks every completed item needs_action", async () => {
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true), item("c", "Jam", true)]);
    const button = await openConfirmUncheck(card);
    button.click();
    await flush();
    await card.updateComplete;
    expect(calls(hass, "update_item").map((c) => c[2])).toEqual([
      { item: "b", status: TodoItemStatus.NeedsAction },
      { item: "c", status: TodoItemStatus.NeedsAction },
    ]);
  });

  it("shows the completed count in the confirm dialog", async () => {
    const card = await mount(hass, {}, [item("a", "Milk", true), item("b", "Eggs", true)]);
    root(card).querySelector<HTMLElement>('.menu-btn[data-menu="completed"]')!.click();
    await card.updateComplete;
    const buttons = Array.from(root(card).querySelectorAll<HTMLButtonElement>(".menu button"));
    buttons.find((b) => b.textContent?.trim() === S.uncheckAll)!.click();
    await card.updateComplete;
    expect(root(card).querySelector("dialog p")!.textContent).toContain("2");
  });

  it("fires one batch of update_item calls for a double click", async () => {
    const pending = deferred();
    hass.callService.mockReturnValueOnce(pending.promise).mockReturnValueOnce(pending.promise);
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true), item("c", "Jam", true)]);
    const button = await openConfirmUncheck(card);
    button.click();
    button.click();
    await card.updateComplete;
    expect(calls(hass, "update_item")).toHaveLength(2);
    expect(button.disabled).toBe(true);
    pending.resolve();
    await flush();
    await card.updateComplete;
    expect(root(card).querySelector("dialog")).toBeNull();
  });

  it("does not re-send an item unchecked while the dialog was open", async () => {
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true), item("c", "Jam", true)]);
    const button = await openConfirmUncheck(card);
    hass.push(ENTITY, [item("a", "Milk"), item("b", "Eggs"), item("c", "Jam", true)]);
    await card.updateComplete;
    button.click();
    await flush();
    expect(calls(hass, "update_item").map((c) => c[2])).toEqual([{ item: "c", status: TodoItemStatus.NeedsAction }]);
  });

  it("rolls back a failed uncheck", async () => {
    hass.callService.mockRejectedValueOnce(new Error("offline"));
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true)]);
    const button = await openConfirmUncheck(card);
    button.click();
    await flush();
    await card.updateComplete;
    expect(root(card).querySelector<HTMLInputElement>('input[data-uid="b"]')!.checked).toBe(true);
  });

  it("an editor without delete permission sees Uncheck all but not Clear completed", async () => {
    hass.setEntity(ENTITY, "2", 1 | 4 | 8);
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true)]);
    root(card).querySelector<HTMLElement>('.menu-btn[data-menu="completed"]')!.click();
    await card.updateComplete;
    const labels = Array.from(root(card).querySelectorAll(".menu button")).map((b) => b.textContent?.trim());
    expect(labels).toContain(S.uncheckAll);
    expect(labels.some((l) => l?.includes(S.clearCompleted))).toBe(false);
  });
});

describe("menus and dialogs", () => {
  it("opens the Completed section's menu upward so ha-card's overflow can't clip it", async () => {
    const card = await mount(hass, {}, [item("a", "Milk"), item("b", "Eggs", true)]);
    root(card).querySelector<HTMLElement>('.menu-btn[data-menu="completed"]')!.click();
    await card.updateComplete;
    expect(root(card).querySelector(".menu")!.classList.contains("up")).toBe(true);
  });

  it("opens the consolidated Active menu downward when Completed isn't rendered", async () => {
    const card = await mount(hass, { show_completed: false }, [item("a", "Milk"), item("b", "Eggs", true)]);
    root(card).querySelector<HTMLElement>('.menu-btn[data-menu="active"]')!.click();
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

  it("discards an entry-id lookup that lands after the entity vanished", async () => {
    const registry = deferred<unknown>();
    let pending = true;
    const registryCalls = () => hass.callWS.mock.calls.filter(([m]) => m.type === "config/entity_registry/get").length;
    hass.callWS.mockImplementation((message) => {
      if (message.type === "config/entity_registry/get") {
        return pending ? registry.promise : Promise.resolve({ entity_id: ENTITY, config_entry_id: "e1" });
      }
      return Promise.resolve([]);
    });
    hass.setEntity(ENTITY, "unavailable");
    const card = await mount(hass);
    expect(registryCalls()).toBe(1);

    hass.states = {};
    card.requestUpdate("hass", undefined);
    await card.updateComplete;
    pending = false;
    registry.resolve({ entity_id: ENTITY, config_entry_id: "e1" });
    await flush();

    hass.setEntity(ENTITY, "unavailable");
    card.requestUpdate("hass", undefined);
    await card.updateComplete;
    await flush();
    expect(registryCalls()).toBe(2);
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

describe("show_header", () => {
  it("hides the icon tile, title and subline when off", async () => {
    const card = await mount(hass, { show_header: false }, [item("1", "Milk")]);
    expect(root(card).querySelector("header.head")).toBeNull();
    expect(root(card).querySelector(".tile")).toBeNull();
    expect(root(card).querySelector(".title")).toBeNull();
    expect(root(card).querySelector(".subline")).toBeNull();
  });

  it("shows the header block by default", async () => {
    const card = await mount(hass, {}, [item("1", "Milk")]);
    expect(root(card).querySelector("header.head")).not.toBeNull();
    expect(root(card).querySelector(".title")).not.toBeNull();
    expect(root(card).querySelector(".subline")).not.toBeNull();
  });

  it("forces the progress bar off when the header is off, even with show_progress: true", async () => {
    const card = await mount(hass, { show_header: false, show_progress: true }, [item("1", "Milk")]);
    expect(root(card).querySelector(".progress")).toBeNull();
  });

  it("still shows the progress bar with show_progress: true while the header is on", async () => {
    const card = await mount(hass, { show_progress: true }, [item("1", "Milk")]);
    expect(root(card).querySelector(".progress")).not.toBeNull();
  });

  it("still hides the progress bar with show_progress: false while the header is on", async () => {
    const card = await mount(hass, { show_progress: false }, [item("1", "Milk")]);
    expect(root(card).querySelector(".progress")).toBeNull();
  });

  it("drops the viewer 'view only' marker along with the rest of the header (Garrett decided 2026-09-15)", async () => {
    hass.setEntity(ENTITY, "2", 0);
    hass.states[ENTITY]!.attributes.role = "viewer";
    const card = await mount(hass, { show_header: false }, [item("1", "Milk")]);
    expect(root(card).querySelector(".add")).toBeNull();
    expect(root(card).textContent).not.toContain("view only");
    const checkbox = root(card).querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(checkbox?.disabled).toBe(true);
  });

  it("keeps getCardSize accurate with the header (and its progress bar) off", async () => {
    const withHeader = await mount(hass, {}, [item("1", "Milk")]);
    const withoutHeader = await mount(hass, { show_header: false }, [item("1", "Milk")]);
    expect(withoutHeader.getCardSize()).toBe(withHeader.getCardSize() - 2);
  });

  it("keeps Clear completed and Uncheck all reachable via the Active menu with the header off and completed hidden", async () => {
    const card = await mount(hass, { show_header: false, show_completed: false }, [
      item("a", "Milk"),
      item("b", "Eggs", true),
    ]);
    expect(root(card).querySelector("header.head")).toBeNull();
    const menuBtn = root(card).querySelector<HTMLElement>('.menu-btn[data-menu="active"]');
    expect(menuBtn).not.toBeNull();
    menuBtn!.click();
    await card.updateComplete;
    const labels = Array.from(root(card).querySelectorAll(".menu button")).map((b) => b.textContent?.trim());
    expect(labels).toContain(S.uncheckAll);
    expect(labels.some((l) => l?.includes(S.clearCompleted))).toBe(true);
  });

  it("adds no extra row for the consolidated menu now that it lives in the Active section's own header", async () => {
    const withoutCompleted = await mount(hass, { show_completed: false }, [item("1", "Milk")]);
    const withCompleted = await mount(hass, { show_completed: false }, [item("a", "Milk"), item("b", "Eggs", true)]);
    expect(withCompleted.getCardSize()).toBe(withoutCompleted.getCardSize());
  });

  it("counts the all-done state's menu-only row when Completed is hidden with items to act on", async () => {
    const config = { show_completed: false, show_add: false };
    const owner = await mount(hass, config, [item("a", "Milk", true), item("b", "Eggs", true)]);
    const ownerSize = owner.getCardSize();
    const viewerHass = new FakeHass();
    viewerHass.setEntity(ENTITY, "2", 0);
    viewerHass.states[ENTITY]!.attributes.role = "viewer";
    const viewer = await mount(viewerHass, config, [item("a", "Milk", true), item("b", "Eggs", true)]);
    expect(ownerSize).toBe(viewer.getCardSize() + 1);
  });
});
