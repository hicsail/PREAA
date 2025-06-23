import os
os.environ['HELPER_BACKEND'] = 'test'

from custom.langflow_handler import Langflow  # noqa: E402


def test_sample():
    langflow = Langflow()
    del langflow
    assert True
