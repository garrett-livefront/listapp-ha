# ListApp for Home Assistant

A Home Assistant custom integration that links a ListApp account and exposes its lists as
`todo` entities, updated live as they change.

- Each selected ListApp list becomes a `todo.listapp_<list>` entity, so lists work with HA's
  built-in to-do card, voice assistants, and automations.
- Updates arrive over a live stream; if it disconnects, the integration falls back to polling
  every 60 seconds until it reconnects.
- Lists you only have viewer access to show up read-only.
- **Configure** on the integration lets you change which lists are shown, and re-authenticate in
  read-only mode.

## Requirements

- Home Assistant 2026.9.2 or newer (the integration is tested against this version; see
  `hacs.json`).
- [my.home-assistant.io](https://my.home-assistant.io/) configured with your Home Assistant URL,
  so Google/Apple sign-in can redirect back to your instance.

## Installation

This repository is not yet in the HACS default store — add it as a custom repository:

1. HACS → **⋮** (top right) → **Custom repositories**.
2. Repository: `https://github.com/garrett-livefront/listapp-ha`, category **Integration**.
3. Install **ListApp**, then restart Home Assistant.
4. **Settings → Devices & services → Add integration → ListApp**, then sign in with Google or
   Apple in the browser window that opens and pick the lists to add.

## Local development

To try the integration before it's on HACS:

1. Copy `custom_components/listapp` into your Home Assistant config directory's
   `custom_components/` folder.
2. Restart Home Assistant.
3. **Settings → Devices & services → Add integration → ListApp**, then sign in to ListApp in the
   browser window that opens.

Each ListApp list shows up as a `todo.listapp_<list>` entity. **Configure** on the integration
offers read-only mode, which asks you to sign in again with narrower permissions.

### Linking against a local API and Hydra

1. In `listapp-api`, start Hydra and register the client (see its `docs/oauth.md`, "Local setup"):
   `docker compose --profile oauth up -d`, then `./scripts/oauth/register-ha-client.sh`, and run
   the API.
2. Point the integration at them with environment variables in the environment Home Assistant
   runs in. They're read when the integration loads, so restart after changing them:

   ```bash
   export LISTAPP_API_BASE_URL=http://localhost:8080/api/v1
   export LISTAPP_OAUTH_BASE_URL=http://localhost:4444
   ```

   Use your API's actual port. From a Home Assistant container, `localhost` is the container, so
   use the host's address instead.
3. Add the integration as above. The authorize page opens in your browser against local Hydra,
   and Hydra redirects to `my.home-assistant.io`, which needs your Home Assistant URL set there.

How auth, entities, and errors work: [`docs/architecture.md`](docs/architecture.md).

## License

MIT, see [LICENSE](LICENSE).
