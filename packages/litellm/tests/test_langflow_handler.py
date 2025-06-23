import os
from pathlib import Path
from unittest.mock import MagicMock
os.environ['HELPER_BACKEND'] = 'test'

from custom.langflow_handler import Langflow, LangflowChunkParser  # noqa: E402

class HttpxResponseStreamMock:
    """
    Helper that mocks the streaming functionality
    of httpx.Response where the content is read in
    from a file. The file should have line-by-line a
    response payload
    """
    def __init__(self, file_location: Path):
        self.file = open(file_location, 'r')

    def __iter__(self):
        return self

    def __next__(self) -> str:
        """
        Get the next line ignoring empty lines
        """
        while (content := next(self.file).strip()) == '':
            pass
        return content


class TestLangflowchunkParser:
    def test_constructor(self):
        response_mock = MagicMock()

        parser = LangflowChunkParser(response_mock, True)
        del parser
        assert True

    def test_valid_token_chunk(self):
        pass
