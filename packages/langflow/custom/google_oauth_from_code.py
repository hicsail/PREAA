import json
import re
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from langflow.custom import Component
from langflow.io import FileInput, MultilineInput, Output, SecretStrInput
from langflow.schema import Data


class GoogleOAuthFromCode(Component):
    display_name = "Google OAuth Token from Code"
    description = "Creates credentials from code"
    documentation: str = "https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python_1"
    icon = "Google"
    name = "GoogleOAuthFromCode"

    inputs = [
        SecretStrInput(
            name="token",
            info="OAuth2 token",
            display_name="Token",
            required=True
        ),
        MultilineInput(
            name="scopes",
            display_name="Scopes",
            info="Input scopes for your application.",
            required=True,
        ),
        FileInput(
            name="oauth_credentials",
            display_name="Credentials File",
            info="Input OAuth Credentials file (e.g. credentials.json).",
            file_types=["json"],
            required=True,
        ),
        MultilineInput(
            name="redirect_uri",
            display_name="Redirect URI",
            required=True
        )
    ]

    outputs = [
        Output(display_name="Credentials", name="credentials", method="get_credentials")
    ]

    def validate_scopes(self, scopes):
        pattern = (
            r"^(https://www\.googleapis\.com/auth/[\w\.\-]+"
            r"|mail\.google\.com/"
            r"|www\.google\.com/calendar/feeds"
            r"|www\.google\.com/m8/feeds)"
            r"(,\s*https://www\.googleapis\.com/auth/[\w\.\-]+"
            r"|mail\.google\.com/"
            r"|www\.google\.com/calendar/feeds"
            r"|www\.google\.com/m8/feeds)*$"
        )
        if not re.match(pattern, scopes):
            error_message = "Invalid scope format."
            raise ValueError(error_message)

    def get_credentials(self) -> Data:
        self.validate_scopes(self.scopes)

        user_scopes = [scope.strip() for scope in self.scopes.split(",")]
        if self.scopes:
            scopes = user_scopes
        else:
            error_message = "Incorrect scope, check the scopes field."
            raise ValueError(error_message)

        if self.oauth_credentials:
            client_secret_file = self.oauth_credentials
        else:
            error_message = "OAuth 2.0 Credentials file not provided."
            raise ValueError(error_message)

        flow = Flow.from_client_secrets_file(
            client_secret_file, scopes, redirect_uri=self.redirect_uri)
        flow.fetch_token(code=self.token)

        return Data(data=json.loads(flow.credentials.to_json()))
