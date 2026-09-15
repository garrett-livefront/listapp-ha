// Placeholder card — slice 2 replaces this with the Lit build. See docs/card.md.
if (!customElements.get("listapp-list-card")) {
  class ListAppListCard extends HTMLElement {
    setConfig(config) {
      if (!config.entity) {
        throw new Error("entity is required");
      }
      this._config = config;
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    getCardSize() {
      return 3;
    }

    _render() {
      if (!this._hass || !this._config) {
        return;
      }
      const stateObj = this._hass.states[this._config.entity];
      if (!this._card) {
        this._card = document.createElement("ha-card");
        this.appendChild(this._card);
      }
      if (!stateObj) {
        this._card.replaceChildren();
        const notFound = document.createElement("div");
        notFound.style.padding = "16px";
        notFound.textContent = `Entity not found: ${this._config.entity}`;
        this._card.appendChild(notFound);
        return;
      }
      const attrs = stateObj.attributes || {};
      const name = attrs.friendly_name || this._config.entity;
      const count = stateObj.state;
      this._card.replaceChildren();
      const wrapper = document.createElement("div");
      wrapper.style.padding = "16px";
      const rows = [
        ["strong", name],
        ["div", `${count} items`],
        ["div", `list_id: ${attrs.list_id ?? ""}`],
        ["div", `color: ${attrs.color ?? ""}`],
        ["div", `icon: ${attrs.icon ?? ""}`],
        ["div", `role: ${attrs.role ?? ""}`],
      ];
      for (const [tag, text] of rows) {
        const el = document.createElement(tag === "strong" ? "div" : tag);
        if (tag === "strong") {
          const strong = document.createElement("strong");
          strong.textContent = text;
          el.appendChild(strong);
        } else {
          el.textContent = text;
        }
        wrapper.appendChild(el);
      }
      this._card.appendChild(wrapper);
    }
  }

  customElements.define("listapp-list-card", ListAppListCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "listapp-list-card",
  name: "ListApp list",
  description: "Shows a ListApp list (placeholder — slice 2 ships the real card).",
  preview: true,
});
