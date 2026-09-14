import os
from datetime import timedelta
from typing import Final

DOMAIN: Final = "listapp"

OAUTH_CLIENT_ID: Final = "listapp-home-assistant"

# Hosts not final; env overrides are for local dev — see docs/architecture.md#endpoints
API_BASE_URL: Final = os.environ.get("LISTAPP_API_BASE_URL", "https://listapp.radhangs.com/api/v1")
OAUTH_BASE_URL: Final = os.environ.get(
    "LISTAPP_OAUTH_BASE_URL", "https://auth.listapp.radhangs.com"
)
OAUTH_AUTHORIZE_URL: Final = f"{OAUTH_BASE_URL}/oauth2/auth"
OAUTH_TOKEN_URL: Final = f"{OAUTH_BASE_URL}/oauth2/token"

SCOPE_OFFLINE: Final = "offline_access"
SCOPE_READ: Final = "lists:read"
SCOPE_WRITE: Final = "lists:write"

CONF_READ_ONLY: Final = "read_only"

UPDATE_INTERVAL: Final = timedelta(seconds=60)
REQUEST_TIMEOUT_SECONDS: Final = 15
