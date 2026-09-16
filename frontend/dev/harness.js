// Dev harness: mounts the card against a mock `hass` for every state/option — see docs/card.md#harness
const items = (...summaries) =>
  summaries.map((s, i) => ({
    uid: `i${i}`,
    summary: s.replace(/^\*/, ""),
    status: s.startsWith("*") ? "completed" : "needs_action",
  }));

const WRITE = 1 | 2 | 4 | 8;

const entity = (id, { name, state = "3", color = null, icon = null, role = "owner", features = WRITE, listId }) => ({
  entity_id: id,
  state,
  attributes: {
    friendly_name: name,
    supported_features: features,
    list_id: listId ?? id.replace("todo.listapp_", "list-"),
    color,
    icon,
    role,
  },
});

const SCENARIOS = [
  {
    name: "default (colour null → avatarColor, icon null → list-checks)",
    entity: entity("todo.listapp_groceries", { name: "Groceries" }),
    items: items("Milk", "Eggs", "*Bread", "Coffee beans", "*Butter"),
    config: {},
  },
  {
    name: "coloured + icon",
    entity: entity("todo.listapp_trip", { name: "Weekend trip", color: "#6366f1", icon: "plane" }),
    items: items("Passports", "Book hotel", "*Charge camera", "Pack sunscreen"),
    config: {},
  },
  {
    name: "empty",
    entity: entity("todo.listapp_ideas", { name: "Ideas", color: "#14b8a6", icon: "sparkles", state: "0" }),
    items: [],
    config: {},
  },
  {
    name: "all done",
    entity: entity("todo.listapp_chores", { name: "Chores", color: "#22c55e", icon: "home", state: "0" }),
    items: items("*Vacuum", "*Dishes", "*Laundry"),
    config: {},
  },
  {
    name: "all done, show_completed: false",
    entity: entity("todo.listapp_chores2", { name: "Chores", color: "#22c55e", icon: "home", state: "0" }),
    items: items("*Vacuum", "*Dishes", "*Laundry"),
    config: { show_completed: false },
  },
  {
    name: "viewer (role=viewer, features=0)",
    entity: entity("todo.listapp_shared", {
      name: "Party supplies",
      color: "#ec4899",
      icon: "party-popper",
      role: "viewer",
      features: 0,
    }),
    items: items("Balloons", "Cake", "*Candles", "Napkins"),
    config: {},
  },
  {
    name: "unavailable — reauth flow in progress",
    entity: entity("todo.listapp_auth", { name: "Groceries", color: "#f97316", icon: "shopping-cart", state: "unavailable" }),
    items: undefined,
    config: {},
    reauth: true,
  },
  {
    name: "unavailable — transient",
    entity: entity("todo.listapp_down", { name: "Groceries", color: "#f97316", icon: "shopping-cart", state: "unavailable" }),
    items: undefined,
    config: {},
  },
  {
    name: "collapse_to: 3",
    entity: entity("todo.listapp_long", { name: "Hardware store", color: "#3b82f6", icon: "wrench", state: "8" }),
    items: items("Screws", "Wood glue", "Sandpaper", "Paint roller", "Drop cloth", "Masking tape", "Primer", "Brushes", "*Level"),
    config: { collapse_to: 3 },
  },
  {
    name: "item_tap_action: edit",
    entity: entity("todo.listapp_edit", { name: "Reading", color: "#9810fa", icon: "book-open" }),
    items: items("Piranesi", "The Dispossessed", "*Exhalation"),
    config: { item_tap_action: "edit" },
  },
  {
    name: "use_list_color: false (HA primary)",
    entity: entity("todo.listapp_primary", { name: "Errands", color: "#ef4444", icon: "car" }),
    items: items("Post office", "*Dry cleaning"),
    config: { use_list_color: false },
  },
  {
    name: "show_title/show_progress/show_add: false, title override ignored",
    entity: entity("todo.listapp_bare", { name: "Bare", color: "#06b6d4", icon: "coffee" }),
    items: items("One", "Two", "*Three"),
    config: { show_title: false, show_progress: false, show_add: false, title: "Ignored" },
  },
  {
    name: "title override",
    entity: entity("todo.listapp_title", { name: "Original", color: "#f43f5e", icon: "heart" }),
    items: items("Alpha", "*Beta"),
    config: { title: "Custom title" },
  },
  {
    name: "contrast: yellow #eab308",
    entity: entity("todo.listapp_yellow", { name: "Yellow", color: "#eab308", icon: "star" }),
    items: items("Sunflowers", "*Lemons"),
    config: {},
  },
  {
    name: "contrast: amber #f59e0b",
    entity: entity("todo.listapp_amber", { name: "Amber", color: "#f59e0b", icon: "gift" }),
    items: items("Honey", "*Maple"),
    config: {},
  },
  {
    name: "contrast: lime #84cc16",
    entity: entity("todo.listapp_lime", { name: "Lime", color: "#84cc16", icon: "dumbbell" }),
    items: items("Limes", "*Kale"),
    config: {},
  },
  {
    name: "unknown icon key falls back",
    entity: entity("todo.listapp_unknown", { name: "Future icon", color: "#0ea5e9", icon: "hologram" }),
    items: items("Item"),
    config: {},
  },
  {
    name: "missing entity",
    entity: null,
    items: undefined,
    config: { entity: "todo.listapp_nope" },
  },
];

function makeHass(scenario, dark) {
  const subscribers = new Set();
  let current = scenario.items ? scenario.items.map((i) => ({ ...i })) : undefined;
  const notify = () => subscribers.forEach((cb) => cb({ items: current.map((i) => ({ ...i })) }));
  const states = {};
  if (scenario.entity) {
    states[scenario.entity.entity_id] = scenario.entity;
  }
  const log = (...args) => console.log(`[harness:${scenario.name}]`, ...args);
  return {
    states,
    themes: { darkMode: dark },
    connection: {
      subscribeMessage(cb, msg) {
        log("subscribe", msg);
        subscribers.add(cb);
        if (current) {
          setTimeout(() => cb({ items: current.map((i) => ({ ...i })) }), 50);
        }
        return Promise.resolve(() => subscribers.delete(cb));
      },
    },
    async callWS(msg) {
      log("callWS", msg);
      if (msg.type === "config_entries/get") {
        return [{ entry_id: "e1", domain: "listapp", state: scenario.reauth ? "setup_error" : "setup_retry", reason: null }];
      }
      if (msg.type === "config_entries/flow/progress") {
        return scenario.reauth ? [{ flow_id: "f1", handler: "listapp", context: { source: "reauth" } }] : [];
      }
      if (msg.type === "todo/item/move") {
        const idx = current.findIndex((i) => i.uid === msg.uid);
        const [moved] = current.splice(idx, 1);
        const prev = msg.previous_uid ? current.findIndex((i) => i.uid === msg.previous_uid) : -1;
        current.splice(prev + 1, 0, moved);
        notify();
      }
    },
    async callService(domain, service, data, target) {
      log("callService", domain, service, data, target);
      await new Promise((r) => setTimeout(r, 120));
      if (service === "add_item") {
        current.push({ uid: `n${Date.now()}`, summary: data.item, status: "needs_action" });
      } else if (service === "update_item") {
        const item = current.find((i) => i.uid === data.item);
        if (data.status) item.status = data.status;
        if (data.rename) item.summary = data.rename;
      } else if (service === "remove_item") {
        const uids = Array.isArray(data.item) ? data.item : [data.item];
        current = current.filter((i) => !uids.includes(i.uid));
      }
      notify();
    },
  };
}

function mount(scenario, dark, container) {
  const wrap = document.createElement("div");
  wrap.className = "scenario";
  const config = { type: "custom:listapp-list-card", entity: scenario.entity?.entity_id, ...scenario.config };
  wrap.innerHTML = `<h4>${scenario.name}</h4><pre>${JSON.stringify(config)}</pre>`;
  const frame = document.createElement("div");
  frame.className = "frame";
  const card = document.createElement("listapp-list-card");
  card.setConfig(config);
  card.hass = makeHass(scenario, dark);
  frame.appendChild(card);
  wrap.appendChild(frame);
  container.appendChild(wrap);
}

const root = document.getElementById("root");
const select = document.getElementById("scenario");
const only = document.getElementById("only");
const width = document.getElementById("width");
const widthValue = document.getElementById("widthValue");
const wide = document.getElementById("wide");
const editorToggle = document.getElementById("editor");
const editorRoot = document.getElementById("editorRoot");

SCENARIOS.forEach((s, i) => {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = s.name;
  select.appendChild(opt);
});

function mountEditor(scenario) {
  editorRoot.innerHTML = "";
  const config = { type: "custom:listapp-list-card", entity: scenario.entity?.entity_id, ...scenario.config };
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(config);
  const editor = document.createElement("listapp-list-card-editor");
  editor.hass = makeHass(scenario, false);
  editor.setConfig(config);
  editor.addEventListener("config-changed", (ev) => {
    pre.textContent = JSON.stringify(ev.detail.config);
    editor.setConfig(ev.detail.config);
  });
  editorRoot.append(pre, editor);
}

function render() {
  root.innerHTML = "";
  const chosen = only.checked ? [SCENARIOS[Number(select.value)]] : SCENARIOS;
  for (const dark of [false, true]) {
    const col = document.createElement("div");
    col.className = `theme ${dark ? "dark" : "light"}`;
    chosen.forEach((s) => mount(s, dark, col));
    root.appendChild(col);
  }
  applyWidth();
  editorRoot.hidden = !editorToggle.checked;
  if (editorToggle.checked) {
    mountEditor(chosen[0]);
  }
}

function applyWidth() {
  const w = wide.checked ? 700 : Number(width.value);
  widthValue.textContent = String(w);
  document.documentElement.style.setProperty("--w", `${w}px`);
}

const params = new URLSearchParams(location.search);
if (params.has("scenario")) {
  only.checked = true;
  select.value = params.get("scenario");
}
if (params.has("width")) {
  width.value = params.get("width");
}
if (params.has("wide")) {
  wide.checked = true;
}

only.addEventListener("change", render);
select.addEventListener("change", render);
width.addEventListener("input", applyWidth);
wide.addEventListener("change", applyWidth);
editorToggle.addEventListener("change", render);
render();
