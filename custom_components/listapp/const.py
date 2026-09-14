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

ROLE_VIEWER: Final = "VIEWER"

CONF_READ_ONLY: Final = "read_only"
CONF_SELECTED_LISTS: Final = "selected_lists"

MAX_SELECTED_LISTS: Final = 25

REQUEST_TIMEOUT_SECONDS: Final = 15

# Poll intervals: see docs/architecture.md#what-h3-adds for why these two numbers.
POLL_INTERVAL_STREAMING: Final = timedelta(minutes=15)
POLL_INTERVAL_FALLBACK: Final = timedelta(seconds=60)
UPDATE_INTERVAL: Final = POLL_INTERVAL_FALLBACK

STREAM_BURST_SECONDS: Final = 0.5
STREAM_HEARTBEAT_SECONDS: Final = 25
STREAM_HEARTBEAT_TIMEOUT_SECONDS: Final = STREAM_HEARTBEAT_SECONDS * 2.5
STREAM_BACKOFF_INITIAL_SECONDS: Final = 1
STREAM_BACKOFF_MAX_SECONDS: Final = 60
