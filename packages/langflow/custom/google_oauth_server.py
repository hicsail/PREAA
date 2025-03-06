"""
Modification of LangFlow's Google authentication component, original license below

MIT License

Copyright (c) 2024 Langflow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

import json
import re
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from langflow.custom import Component
from langflow.io import FileInput, MultilineInput, Output
from langflow.schema import Data


class GoogleOAuthTokenServer(Component):
    display_name = "Google OAuth Token Server"
    description = "Generates a JSON string with your Google OAuth token."
    documentation: str = "https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python_1"
    icon = "Google"
    name = "GoogleOAuthTokenServer"

    inputs = [
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
        Output(display_name="Output", name="auth_url", method="build_output"),
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

    def build_output(self) -> str:
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
        auth_url, _ = flow.authorization_url(prompt='consent')

        return auth_url
