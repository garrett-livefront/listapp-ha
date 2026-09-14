# Testing

## Running locally

```
python3 -m venv .venv
.venv/bin/pip install -r requirements_test.txt
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

`pytest` runs through `pytest-homeassistant-custom-component`, which boots a real (mocked)
`HomeAssistant` core so the integration is exercised the same way HA itself would load it.

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
