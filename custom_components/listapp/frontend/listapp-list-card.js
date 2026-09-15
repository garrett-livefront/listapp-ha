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
        this._card.innerHTML = `<div style="padding: 16px;">Entity not found: ${this._config.entity}</div>`;
        return;
      }
      const attrs = stateObj.attributes || {};
      const name = attrs.friendly_name || this._config.entity;
      const count = stateObj.state;
      this._card.innerHTML = `
        <div style="padding: 16px;">
          <div><strong>${name}</strong></div>
          <div>${count} items</div>
          <div>list_id: ${attrs.list_id ?? ""}</div>
          <div>color: ${attrs.color ?? ""}</div>
          <div>icon: ${attrs.icon ?? ""}</div>
          <div>role: ${attrs.role ?? ""}</div>
        </div>
      `;
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
