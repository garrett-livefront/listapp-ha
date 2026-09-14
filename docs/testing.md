# Testing

## Running locally

```
python3.14 -m venv .venv
.venv/bin/pip install -r requirements_test.txt
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

`pytest` runs through `pytest-homeassistant-custom-component`, which boots a real (mocked)
`HomeAssistant` core. Tests set entries up through `hass.config_entries.async_setup`, with HTTP
faked by `aioclient_mock`. Shared fixtures and payload builders live in `tests/conftest.py` and
`tests/helpers.py`.

Python 3.14 is required. The pin tracks a current HA release (`0.13.365` = HA 2026.9.2), and every
HA release since 2026.3 requires 3.14. Bump the pin with `pytest-cov`, since the plugin pins
`coverage` exactly.

## Coverage gate

`pyproject.toml` sets `--cov-fail-under=95` against `custom_components/listapp`. The threshold is
high because this integration is small and every line added should come with a test — a lower bar
would let untested code accumulate before the integration has any real surface area to hide behind.
Revisit the number once the integration grows features (OAuth, entities) large enough that some
paths are genuinely impractical to exercise in CI.

## CI

`.github/workflows/test.yml` and `lint.yml` run on every pull request and on push to `main` and
`hacs-integration`. `.github/workflows/validate.yml` runs `hassfest` (blocking) and the HACS
validation action (non-blocking — see its workflow file for why).

`hassfest` and the HACS action are deliberately referenced by branch (`@master`/`@main`), not a
pinned SHA, despite that being the general supply-chain-safe default: both validate against
HA's/HACS's live current requirements, and a pinned SHA would silently drift stale and start
passing PRs that a current HA release would reject — the opposite of what the check is for. This
was a Copilot review comment on PR #2.
