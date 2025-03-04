from collections.abc import Sequence

from pydantic import Field

from langchain_core.messages import (
    BaseMessage,
)
from langchain_core.chat_history import BaseChatMessageHistory

from langflow.custom import Component
from langflow.field_typing.constants import Memory
from langflow.io import Output, NestedDictInput


class CompletionChatMessageHistory(BaseChatMessageHistory):
    session_id: str
    messages: list[BaseMessage] = Field(default_factory=list)

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.messages = []

    async def aget_messages(self) -> list[BaseMessage]:
        """Async version of getting messages.

        Can over-ride this method to provide an efficient async implementation.
        In general, fetching messages may involve IO to the underlying
        persistence layer.

        Returns:
            List of messages.
        """
        return self.messages

    def add_message(self, message: BaseMessage) -> None:
        """Add a self-created message to the store.

        Args:
            message: The message to add.
        """
        self.messages.append(message)

    async def aadd_messages(self, messages: Sequence[BaseMessage]) -> None:
        """Async add messages to the store.

        Args:
            messages: The messages to add.
        """
        self.add_messages(messages)

    def clear(self) -> None:
        """Clear all messages from the store."""
        self.messages = []

    async def aclear(self) -> None:
        """Async clear all messages from the store."""
        self.clear()


class CompletionInterface(Component):
    display_name = "Completion Interface"
    description = "Provides a ChatGPT style completion interface"

    inputs = [
        NestedDictInput(display_name='Messages', name='messages'),
    ]

    outputs = [
        Output(display_name="Memory", name="memory", method="build_message_history")
    ]

    def build_message_history(self) -> Memory:
        message_history = CompletionChatMessageHistory('temp')

        for message in self.messages['content']:
            if message['role'] == 'user':
                message_history.add_user_message(message['content'])
            else:
                message_history.add_ai_message(message['content'])

        return message_history
