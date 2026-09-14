from custom_components.listapp.const import OAUTH_AUTHORIZE_URL, OAUTH_TOKEN_URL


def test_production_oauth_urls():
    assert OAUTH_AUTHORIZE_URL == "https://listapp.radhangs.com/ha/oauth2/auth"
    assert OAUTH_TOKEN_URL == "https://listapp.radhangs.com/ha/oauth2/token"
