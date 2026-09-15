# Contributing to ListApp for Home Assistant

## Local development

To try the integration before it's on HACS:

1. Copy `custom_components/listapp` into your Home Assistant config directory's
   `custom_components/` folder.
2. Restart Home Assistant.
3. **Settings → Devices & services → Add integration → ListApp**, then sign in to ListApp in the
   browser window that opens.

Each list you select in the picker shows up as a `todo.listapp_<list>` entity. **Configure** on the
integration lets you change which lists are selected, and offers read-only mode, which asks you to
sign in again with narrower permissions.

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

## Tests and lint

```
python3.14 -m venv .venv
.venv/bin/pip install -r requirements_test.txt
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

Details, the coverage gate, and the supported-HA-version matrix: [`docs/testing.md`](docs/testing.md).

## The card

The Lovelace card's source is in `frontend/` (Lit + TypeScript); the built bundle at
`custom_components/listapp/frontend/listapp-list-card.js` is committed, so **rebuild and commit it
with any source change** — CI fails if the two drift.

```
cd frontend
npm ci
npm run build                                   # → ../custom_components/listapp/frontend/listapp-list-card.js
npm run lint && npm run typecheck && npm test
npm run check:fresh                             # what CI runs: rebuild must match the committed file
npm run dev                                     # harness with a mock hass at http://127.0.0.1:8000/
```

Architecture, options, states, the colour/icon rules and licences: [`docs/card.md`](docs/card.md).

## CI

`.github/workflows/test.yml`, `lint.yml`, `validate.yml` (`hassfest` + HACS validation) and
`card.yml` (card lint, typecheck, tests, bundle freshness) run on every pull request.

## Architecture

How auth, entities, and errors work: [`docs/architecture.md`](docs/architecture.md).
