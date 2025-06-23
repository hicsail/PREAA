import os
from pathlib import Path
from unittest.mock import MagicMock
import json
import pytest

os.environ['HELPER_BACKEND'] = 'test'

from custom.langflow_handler import LangflowChunkParser, BaseLLMException  # noqa: E402


def _get_test_file_loc(file_name: str) -> Path:
    return Path(__file__).parent.resolve() / 'sample_data' / file_name


def _load_test_json(file_name: str) -> dict:
    test_file_location = _get_test_file_loc(file_name)
    with open(test_file_location, 'r') as test_file:
        return json.load(test_file)



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
        # Create HTTPX Response mock
        response_mock = MagicMock()

        LangflowChunkParser(response_mock, True)

    def test_missing_token_data(self):
        # Load test data
        test_chunk = _load_test_json('missing_data_token_chunk.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk, should raise exception
        with pytest.raises(BaseLLMException):
            parser._parse_token_chunk(test_chunk)

    def test_missing_chunk_token_data(self):
        # Load test data
        test_chunk = _load_test_json('missing_chunk_token.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk, should raise exception
        with pytest.raises(BaseLLMException):
            parser._parse_token_chunk(test_chunk)

    def test_valid_token_chunk(self):
        # Load test data
        test_chunk = _load_test_json('valid_token_chunk.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk
        chunk = parser._parse_token_chunk(test_chunk)

        assert chunk['text'] == 'Y'

    def test_valid_agentic_end(self):
        # Load test data
        test_chunk = _load_test_json('valid_agentic_end.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk
        chunk = parser._parse_agentic_end(test_chunk)

        assert chunk['text'] == 'TEST'
