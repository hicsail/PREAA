import os
os.environ['HELPER_BACKEND'] = 'test'

from custom.langflow_handler import Langflow


def sample_test():

    langflow = Langflow()
    del langflow
    assert True
