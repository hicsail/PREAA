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


class TestTokenParsing:
    def test_constructor(self):
        """ Make use the parser can be constructed without error """
        # Create HTTPX Response mock
        response_mock = MagicMock()

        LangflowChunkParser(response_mock, True)

    def test_missing_token_data(self):
        """ Proper handling of missing "data" field """
        # Load test data
        test_chunk = _load_test_json('missing_data_token_chunk.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk, should raise exception
        with pytest.raises(BaseLLMException):
            parser._parse_token_chunk(test_chunk)

    def test_missing_chunk_token_data(self):
        """ Proper handling of missing "chunk" field" """
        # Load test data
        test_chunk = _load_test_json('missing_chunk_token.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk, should raise exception
        with pytest.raises(BaseLLMException):
            parser._parse_token_chunk(test_chunk)

    def test_valid_token_chunk(self):
        """ Returning valid formed token chunk """
        # Load test data
        test_chunk = _load_test_json('valid_token_chunk.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk
        chunk = parser._parse_token_chunk(test_chunk)

        assert chunk['text'] == 'Y'
        assert chunk['is_finished'] == False


class TestAgenticParsing:
    def test_missing_outputs_agentic_end(self):
        """ Proper handling of missing outputs field """
        # Load test data
        test_chunk = _load_test_json('missing_outputs_agentic_end.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk, should raise exception
        with pytest.raises(BaseLLMException):
            parser._parse_agentic_end(test_chunk)

    def test_valid_agentic_end(self):
        """ Returining valid formed agentic end message """
        # Load test data
        test_chunk = _load_test_json('valid_agentic_end.json')

        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        # Get chunk
        chunk = parser._parse_agentic_end(test_chunk)

        assert chunk['text'] == 'TEST'
        assert chunk['is_finished'] == True


class TestParseChunk:
    def test_invalid_json(self):
        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        with pytest.raises(BaseLLMException):
            parser._parse_chunck('bad_json, stinky even')

    def test_missing_event(self):
        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        with pytest.raises(BaseLLMException):
            parser._parse_chunck('{"unexpected": "field"}')

    def test_ignoring_add_message(self):
        # Make unit under test
        parser = LangflowChunkParser(MagicMock(), True)

        message = '{"event": "add_message"}'

        chunk = parser._parse_chunck(message)

        assert chunk['text'] == ''
        assert chunk['is_finished'] == False
