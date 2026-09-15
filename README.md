# ListApp for Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz)
[![GitHub release](https://img.shields.io/github/v/release/garrett-livefront/listapp-ha)](https://github.com/garrett-livefront/listapp-ha/releases)
[![Validate](https://github.com/garrett-livefront/listapp-ha/actions/workflows/validate.yml/badge.svg)](https://github.com/garrett-livefront/listapp-ha/actions/workflows/validate.yml)
[![Test](https://github.com/garrett-livefront/listapp-ha/actions/workflows/test.yml/badge.svg)](https://github.com/garrett-livefront/listapp-ha/actions/workflows/test.yml)
[![Minimum Home Assistant version](https://img.shields.io/badge/Home%20Assistant-2026.3.0%2B-41BDF5.svg)](https://www.home-assistant.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/garrett-livefront/listapp-ha/blob/main/LICENSE)

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

- Home Assistant 2026.3.0 or newer (see `hacs.json`; CI also tests against this minimum, see
  `docs/testing.md`).
- The **My Home Assistant** integration enabled (it's part of `default_config`, so most installs
  already have it; if you've removed `default_config`, add `my:` to `configuration.yaml`). Signing
  in needs it to redirect back to your instance.
- A ListApp account.

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=garrett-livefront&repository=listapp-ha&category=integration)

This repository is not yet in the HACS default store — add it as a custom repository:

1. Use the button above, or HACS → **⋮** (top right) → **Custom repositories**, repository
   `https://github.com/garrett-livefront/listapp-ha`, category **Integration**.
2. Install **ListApp**, then restart Home Assistant.

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=listapp)

3. Use the button above, or **Settings → Devices & services → Add integration → ListApp**, then
   sign in with Google or Apple in the browser window that opens and pick the lists to add.

The first time you sign in (or click a My Home Assistant button), my.home-assistant.io asks for
your Home Assistant URL and remembers it in that browser — use one reachable from the browser
you're signing in with.

## What data is shared

Signing in grants this integration OAuth scopes to read and write your ListApp lists
(`lists:read`, plus `lists:write` unless you choose read-only mode) and `offline_access` so it can
refresh your session without asking you to sign in again. It also reads your account ID and email
to identify the connection — nothing else about your account.

Removing the integration from Home Assistant stops it from being used locally, but does not revoke
the underlying access grant on ListApp's server. To fully revoke access, use the ListApp app's
Connected apps screen (coming soon).

## Troubleshooting

- **Reauthentication required**: Home Assistant asks you to sign in again when your ListApp
  session expires, when it can't refresh your access token, or when you change read-only mode in
  **Configure** — the previous grant no longer matches. Signing in again restores it.
- **Linking gets stuck or errors after signing in**: check that the **My Home Assistant**
  integration is enabled (see Requirements) and that the URL saved for your browser at
  [my.home-assistant.io](https://my.home-assistant.io/) is correct.
- **Debug logging**: add to `configuration.yaml` and restart, then check the logs:

  ```yaml
  logger:
    logs:
      custom_components.listapp: debug
  ```

### Reporting issues

Open an issue: <https://github.com/garrett-livefront/listapp-ha/issues>.

## Contributing

Want to help? See
[CONTRIBUTING.md](https://github.com/garrett-livefront/listapp-ha/blob/main/CONTRIBUTING.md).

## License

MIT, see
[LICENSE](https://github.com/garrett-livefront/listapp-ha/blob/main/LICENSE).
