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
import re

import requests


from langflow.custom import Component
from langflow.io import MessageInput, MultilineInput, Output


class GoogleOAuthTokenServer(Component):
    display_name = "Google OAuth Token Server"
    description = "Generates a JSON string with your Google OAuth token."
    icon = "Google"
    name = "GoogleOAuthTokenServer"

    inputs = [
        MultilineInput(
            name="scopes",
            display_name="Scopes",
            info="Input scopes for your application.",
            required=True,
        ),
        MultilineInput(
            name="request_uri",
            display_name="Request URI",
            required=True
        ),
        MessageInput(
            name="id",
            display_name="Credential ID",
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

        response = requests.post(self.request_uri, json={ 'scopes': scopes, 'userID': self.id.text })

        # Make sure the response code is valid
        if response.status_code < 200 or response.status_code >= 300:
            raise Exception(f'Failed generating auth urL: {response.text}')

        # Get the needed field from the body
        body = response.json()
        if not 'url' in body:
            raise Exception(f'Malformed response body: {body}')

        return body['url']
