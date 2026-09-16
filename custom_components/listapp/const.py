import os
from datetime import timedelta
from typing import Final

DOMAIN: Final = "listapp"

OAUTH_CLIENT_ID: Final = "listapp-home-assistant"

# Env overrides are for local dev — see docs/architecture.md#endpoints
API_BASE_URL: Final = os.environ.get("LISTAPP_API_BASE_URL", "https://listapp.radhangs.com/api/v1")
# /ha prefix stripped by the reverse proxy in front of Hydra — see docs/architecture.md#endpoints
OAUTH_BASE_URL: Final = os.environ.get("LISTAPP_OAUTH_BASE_URL", "https://listapp.radhangs.com/ha")
OAUTH_AUTHORIZE_URL: Final = f"{OAUTH_BASE_URL}/oauth2/auth"
OAUTH_TOKEN_URL: Final = f"{OAUTH_BASE_URL}/oauth2/token"

SCOPE_OFFLINE: Final = "offline_access"
SCOPE_READ: Final = "lists:read"
SCOPE_WRITE: Final = "lists:write"

ROLE_OWNER: Final = "OWNER"
ROLE_EDITOR: Final = "EDITOR"
ROLE_VIEWER: Final = "VIEWER"
KNOWN_ROLES: Final = frozenset({ROLE_OWNER, ROLE_EDITOR, ROLE_VIEWER})

ATTR_LIST_ID: Final = "list_id"
ATTR_LIST_COLOR: Final = "list_color"
ATTR_LIST_ICON: Final = "list_icon"
ATTR_ROLE: Final = "role"

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
