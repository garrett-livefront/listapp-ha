# listapp-ha — Project Context for Claude

Home Assistant custom integration for ListApp, distributed through HACS. Sibling repos:
`listapp-api` (Ktor backend), `listapp-mobile`, `listapp-admin`.

## This repo will be public

It is private during development and made public for the HACS release, which exposes the **entire
git history**. Never commit secrets, real tokens, `.env` files, or a real HA `config/` directory —
not even temporarily, since a later deletion stays in history.

The OAuth client ID shipped in the integration is not a secret: the client is public and uses PKCE.

## Design

The plan and decisions (OAuth2 via Ory Hydra, `lists:read`/`lists:write` scopes, one SSE stream for
selected lists) live in the planning page:
https://forge.radhangs.com/listapp-ha-integration-plan-b2h9rr/

## Layout

- `custom_components/listapp/` — the integration
- `hacs.json` — HACS metadata

## Architecture

OAuth (public PKCE client registered in code), the todo entities, and API error mapping: see
[`docs/architecture.md`](docs/architecture.md).

## Card

The bundled Lovelace card (source in `frontend/`, built bundle committed under
`custom_components/listapp/frontend/`): see [`docs/card.md`](docs/card.md).

## Testing

pytest + ruff, gated in CI. See [`docs/testing.md`](docs/testing.md) for how to run locally and why
the coverage threshold is set where it is.
