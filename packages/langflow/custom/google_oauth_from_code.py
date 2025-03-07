import requests

from langflow.custom import Component
from langflow.io import MultilineInput, Output, MessageInput
from langflow.schema import Data


class GoogleOAuthFromCode(Component):
    display_name = "Google OAuth Token from Code"
    description = "Creates credentials from code"
    documentation: str = "https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python_1"
    icon = "Google"
    name = "GoogleOAuthFromCode"

    inputs = [
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
        Output(display_name="Credentials", name="credentials", method="get_credentials")
    ]

    def get_credentials(self) -> Data:
        response = requests.get(f'{self.request_uri}/{self.id.text}')
        return Data(data=response.json())
