# ListApp for Home Assistant

A Home Assistant custom integration that links a ListApp account and exposes its lists as
`todo` entities.

**Status:** in development, not yet usable.

## Installation

Coming with the first release, via HACS.

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
