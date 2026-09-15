# Testing

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) for local dev setup. Details below.

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

## Minimum Home Assistant version

The integration supports **HA 2026.3 and newer**. CI runs the full suite, coverage gate included,
twice: against the current pin in `requirements_test.txt` and against the minimum
(`pytest-homeassistant-custom-component==0.13.320` = HA 2026.3.4, set in `test.yml`'s matrix).
`hacs.json`'s `homeassistant` key must match the minimum.

Why 2026.3: `__init__.py` catches `homeassistant.exceptions.OAuth2TokenRequestReauthError`, which
HA added in 2026.3. Before that, `OAuth2Session.async_ensure_token_valid` raises a bare
`ClientResponseError`, so on 2025.12 the integration fails to import. Replacing just that import
passes 119 of 120 tests. The one that still fails is the check that a refused refresh token
(HTTP 400) triggers reauth instead of a retry. Supporting older HA would mean mapping 4xx
`ClientResponseError`s to auth failures by hand, which is a compatibility shim we chose not to carry.
Local brand images only display on 2026.3+ anyway.

Verified 2026-09-14 (latest patch of each release):

| HA | plugin | Python | Result |
| --- | --- | --- | --- |
| 2026.9.2 | 0.13.365 | 3.14 | pass |
| 2026.6.4 | 0.13.340 | 3.14 | pass |
| 2026.3.4 | 0.13.320 | 3.14 | pass |
| 2025.12.4 | 0.13.301 | 3.13 | fails: `OAuth2TokenRequestReauthError` import |

Reach at the time: about 83% of installs reporting to HA analytics run 2026.3 or newer. Going back
to 2025.12 would reach about 89%.

To move the floor, find the plugin release for the target HA version (its PyPI metadata pins
`homeassistant==X`, and its `requires_python` gives the Python version). Then update the minimum
matrix entry in `test.yml`, including a `pytest-cov` that works with that plugin's `coverage` pin,
update `hacs.json`, and update this section.

## Coverage gate

`pyproject.toml` sets `--cov-fail-under=95` against `custom_components/listapp`. The threshold is
high because this integration is small and every line added should come with a test — a lower bar
would let untested code accumulate before the integration has any real surface area to hide behind.
Revisit the number once the integration grows features (OAuth, entities) large enough that some
paths are genuinely impractical to exercise in CI.

## CI

`.github/workflows/test.yml` and `lint.yml` run on every pull request and on push to `main` and
`hacs-integration`. `.github/workflows/validate.yml` runs `hassfest` and the HACS validation action, both blocking.

`hassfest` and the HACS action are deliberately referenced by branch (`@master`/`@main`), not a
pinned SHA, despite that being the general supply-chain-safe default: both validate against
HA's/HACS's live current requirements, and a pinned SHA would silently drift stale and start
passing PRs that a current HA release would reject — the opposite of what the check is for. This
was a Copilot review comment on PR #2.
