from typing import Iterator, AsyncIterator, Optional, Tuple, Union, Callable
import os
import json

import httpx  # type: ignore

import litellm.litellm_core_utils
import litellm.types
import litellm.types.utils
from litellm.types.utils import Message, ModelResponse
from litellm.llms.custom_llm import CustomLLM
from litellm.types.utils import GenericStreamingChunk
from litellm._logging import verbose_logger
from litellm.llms.custom_httpx.http_handler import (
    AsyncHTTPHandler,
    HTTPHandler
)


# Helper representation of an empty chunk
EMPTY_CHUNK = GenericStreamingChunk(
    text='',
    is_finished=False,
    finish_reason='',
    usage=None,
    index=0,
    tool_use=None
)


class BaseLLMException(Exception):
    """
    Exception implementation for LLM errors. In the future this should be
    imported from LiteLLM once it is exposed by the LiteLLM Library
    """
    def __init__(
        self,
        status_code: int,
        message: str,
        headers: Optional[Union[dict, httpx.Headers]] = None,
        request: Optional[httpx.Request] = None,
        response: Optional[httpx.Response] = None,
    ):
        self.status_code = status_code
        self.message: str = message
        self.headers = headers
        if request:
            self.request = request
        else:
            self.request = httpx.Request(
                method="POST", url="https://docs.litellm.ai/docs"
            )
        if response:
            self.response = response
        else:
            self.response = httpx.Response(
                status_code=status_code, request=self.request
            )
        super().__init__(
            self.message
        )  # Call the base class constructor with the parameters it needs


class LangflowChunkParser:
    """
    Iterator implementation that can take in chunks generated from LangFlow
    in a streaming manner and convert them into LiteLLM chunks
    """
    def __init__(self, langflow_response: httpx.Response, sync_stream: bool):
        self.langflow_response = langflow_response
        self.sync_stream = sync_stream

        self.stream = self.langflow_response.iter_lines()
        self.astream = self.langflow_response.aiter_lines()

    def _parse_chunck(self, raw: str) -> GenericStreamingChunk:
        if len(raw) == 0:
            return EMPTY_CHUNK

        # Convert the chunk to JSON
        try:
            chunk_json = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            verbose_logger.warning(f'Failed to parse string: {raw}')
            raise BaseLLMException(500, message=str(e))

        # Get the type from the chunk
        event_type = chunk_json.get('event', None)
        if event_type is None:
            verbose_logger.warning(f'event type missing on chunk: {raw}')
            raise BaseLLMException(500, message='Missing event type in Langflow chunk')

        # Some events are not passed back to the user and an empty chunk is sent instead
        unused_event_types = ['add_message']
        if event_type in unused_event_types:
            return EMPTY_CHUNK

        # Token message handling
        if event_type == 'token':
            # Get the token content from the chunk
            data = chunk_json.get('data', None)
            if data is None:
                verbose_logger.warning(f'data missing on chunk: {raw}')
                raise BaseLLMException(500, message='Missing data on Langflow chunk')

            chunk_text = data.get('chunk', None)
            if chunk_text is None:
                verbose_logger.warning(f'chunk is missing: {raw}')
                raise BaseLLMException(500, message='Missing token content in Langflow chunk')

            return GenericStreamingChunk(
                text=chunk_text,
                is_finished=False,
                finish_reason='',
                usage=None,
                index=0,
                tool_use=None
            )

        # Stop message handling
        if event_type == 'end':
            return GenericStreamingChunk(
                text='',
                is_finished=True,
                finish_reason='stop',
                usage=None,
                index=0,
                tool_use=None
            )

        # Otherwise we have reached an unexpected event
        verbose_logger.warning(f'Unexpected event type from Langflow {event_type}')
        raise BaseLLMException(500, message=f'Unexpected event from Langflow: {event_type}')

    def __iter__(self):
        return self

    def __next__(self) -> GenericStreamingChunk:
        # Get the next chunk
        try:
            next_chunk = next(self.stream)
        except StopIteration:
            raise StopIteration

        # Parse the chunk
        parsed = self._parse_chunck(next_chunk)

        return parsed

    def __aiter__(self):
        return self

    async def __anext__(self) -> GenericStreamingChunk:
        # Get the next chunk
        try:
            next_chunk = await anext(self.astream)
        except StopIteration:
            raise StopIteration

        # Parse the chunk
        parsed = self._parse_chunck(next_chunk)

        return parsed


class Langflow(CustomLLM):
    """
    Implementation of the LangFlow Custom provider. Can communicate with a number
    of LangFlow flows based on the provided API and model name.
    """
    def __init__(self):
        self.mapping_endpoint = f'{os.environ["HELPER_BACKEND"]}/mapping'

    def _get_history_component_id(self, model: str, base_url: str, client: HTTPHandler, api_key: str) -> Optional[str]:
        """
        Get the history component ID. This relies on the LangFlow API to find the flow based on the
        model name and parse the components. The history component should start with `CompletionInterface`.
        """
        # Make the request to get the flow data and handle any errors
        request_url = f'{base_url}/api/v1/flows/{model}'
        try:
            response = client.get(request_url, headers={'x-api-key': api_key}).json()
        except httpx.HTTPStatusError as e:
            error_headers = getattr(e, "headers", None)
            error_response = getattr(e, "response", None)
            if error_headers is None and error_response:
                error_headers = getattr(error_response, "headers", None)
            raise BaseLLMException(
                status_code=e.response.status_code,
                message=str(e.response.read()),
                headers=error_headers,
            )
        except Exception as e:
            for exception in litellm.exceptions.LITELLM_EXCEPTION_TYPES:
                if isinstance(e, exception):
                    raise e
            raise BaseLLMException(status_code=500, message=str(e))

        # Get the data off of the response
        flow_data = response.get('data', None)
        if flow_data is None:
            raise BaseLLMException(status_code=500, message=f'Missing data field existing fields: {response.keys()}')

        # Try to find the nodes
        nodes = flow_data.get('nodes', None)
        if nodes is None:
            raise BaseLLMException(status_code=500, message=f'Missing node field existing fields: {flow_data.keys()}')

        # Next loop over the nodes for the target component
        for node in nodes:
            id = node.get('id', None)
            if id is not None and id.startswith('CompletionInterface'):
                return id

        # No history component node found
        return None

    async def _aget_history_component_id(self, model: str, base_url: str, client: AsyncHTTPHandler, api_key: str) -> Optional[str]:
        """
        Get the history component ID. This relies on the LangFlow API to find the flow based on the
        model name and parse the components. The history component should start with `CompletionInterface`.
        """
        # Make the request to get the flow data and handle any errors
        request_url = f'{base_url}/api/v1/flows/{model}'
        try:
            response = (await client.get(request_url, headers={'x-api-key': api_key})).json()
        except httpx.HTTPStatusError as e:
            error_headers = getattr(e, "headers", None)
            error_response = getattr(e, "response", None)
            if error_headers is None and error_response:
                error_headers = getattr(error_response, "headers", None)
            raise BaseLLMException(
                status_code=e.response.status_code,
                message=str(e.response.read()),
                headers=error_headers,
            )
        except Exception as e:
            for exception in litellm.exceptions.LITELLM_EXCEPTION_TYPES:
                if isinstance(e, exception):
                    raise e
            raise BaseLLMException(status_code=500, message=str(e))

        # Get the data off of the response
        flow_data = response.get('data', None)
        if flow_data is None:
            raise BaseLLMException(status_code=500, message=f'Missing data field existing fields: {response.keys()}')

        # Try to find the nodes
        nodes = flow_data.get('nodes', None)
        if nodes is None:
            raise BaseLLMException(status_code=500, message=f'Missing node field existing fields: {flow_data.keys()}')

        # Next loop over the nodes for the target component
        for node in nodes:
            id = node.get('id', None)
            if id is not None and id.startswith('CompletionInterface'):
                return id

        # No history component node found
        return None

    def _get_completion_response(self, response: httpx.Response) -> str:
        return response.json()['outputs'][0]['outputs'][0]['results']['message']['data']['text']

    def _make_request_body(self, messages: list, history_componet: Optional[str]) -> dict:
        history = dict()
        history['content'] = [messages[index] for index in range(0, len(messages) - 1)]
        tweaks = dict()

        if history_componet is not None:
            tweaks = {
                history_componet: {
                    'messages': history
                }
            }

        return {
            'input_type': 'chat',
            'output_type': 'chat',
            'input_value': messages[-1]['content'],
            'tweaks': tweaks
        }

    def _make_completion(self, model: str, messages: list, base_url: str, client: HTTPHandler, api_key: str) -> ModelResponse:
        """
        Make a single completition request
        """
        execution_url = f'{base_url}/api/v1/run/{model}'
        history_component = self._get_history_component_id(model, base_url, client, api_key)

        try:
            response = client.post(execution_url, params={'stream': False}, json=self._make_request_body(messages, history_component), headers={'x-api-key': api_key})
        except httpx.HTTPStatusError as e:
            error_headers = getattr(e, "headers", None)
            error_response = getattr(e, "response", None)
            if error_headers is None and error_response:
                error_headers = getattr(error_response, "headers", None)
            raise BaseLLMException(
                status_code=e.response.status_code,
                message=str(e.response.read()),
                headers=error_headers,
            )
        except Exception as e:
            for exception in litellm.exceptions.LITELLM_EXCEPTION_TYPES:
                if isinstance(e, exception):
                    raise e
            raise BaseLLMException(status_code=500, message=str(e))

        return ModelResponse(
            choices=[
                litellm.Choices(finish_reason='stop', message=Message(content=self._get_completion_response(response)))
            ]
        )

    async def _amake_completion(self, model: str, messages: list, base_url: str, client: AsyncHTTPHandler, api_key: str) -> ModelResponse:
        """
        Make a single completition request
        """
        execution_url = f'{base_url}/api/v1/run/{model}'
        history_component = await self._aget_history_component_id(model, base_url, client, api_key)

        try:
            response = await client.post(execution_url, params={'stream': False}, json=self._make_request_body(messages, history_component), headers={'x-api-key': api_key})
        except httpx.HTTPStatusError as e:
            error_headers = getattr(e, "headers", None)
            error_response = getattr(e, "response", None)
            if error_headers is None and error_response:
                error_headers = getattr(error_response, "headers", None)
            raise BaseLLMException(
                status_code=e.response.status_code,
                message=str(e.response.read()),
                headers=error_headers,
            )
        except Exception as e:
            for exception in litellm.exceptions.LITELLM_EXCEPTION_TYPES:
                if isinstance(e, exception):
                    raise e
            raise BaseLLMException(status_code=500, message=str(e))

        return ModelResponse(
            choices=[
                litellm.Choices(finish_reason='stop', message=Message(content=self._get_completion_response(response)))
            ]
        )

    def _make_streaming(self, model: str, messages: list, base_url: str, client: HTTPHandler, sync_stream: bool, api_key) -> Iterator[GenericStreamingChunk]:
        execution_url = f'{base_url}/api/v1/run/{model}'
        history_component = self._get_history_component_id(model, base_url, client, api_key)

        try:
            response = client.post(execution_url, params={'stream': True}, json=self._make_request_body(messages, history_component), headers={'x-api-key': api_key})
        except httpx.HTTPStatusError as e:
            error_headers = getattr(e, "headers", None)
            error_response = getattr(e, "response", None)
            if error_headers is None and error_response:
                error_headers = getattr(error_response, "headers", None)
            raise BaseLLMException(
                status_code=e.response.status_code,
                message=str(e.response.read()),
                headers=error_headers,
            )
        except Exception as e:
            for exception in litellm.exceptions.LITELLM_EXCEPTION_TYPES:
                if isinstance(e, exception):
                    raise e
            raise BaseLLMException(status_code=500, message=str(e))

        return LangflowChunkParser(response, sync_stream=sync_stream)

    async def _amake_streaming(self, model: str, messages: list, base_url: str, client: AsyncHTTPHandler, api_key: str) -> AsyncIterator[GenericStreamingChunk]:
        execution_url = f'{base_url}/api/v1/run/{model}'
        history_component = await self._aget_history_component_id(model, base_url, client, api_key)

        try:
            request_body = self._make_request_body(messages, history_component)
            response = await client.post(execution_url, params={'stream': True}, json=request_body, headers={'x-api-key': api_key})
        except httpx.HTTPStatusError as e:
            error_headers = getattr(e, "headers", None)
            error_response = getattr(e, "response", None)
            if error_headers is None and error_response:
                error_headers = getattr(error_response, "headers", None)
            raise BaseLLMException(
                status_code=e.response.status_code,
                message=str(e.response.read()),
                headers=error_headers,
            )
        except Exception as e:
            for exception in litellm.exceptions.LITELLM_EXCEPTION_TYPES:
                if isinstance(e, exception):
                    raise e
            raise BaseLLMException(status_code=500, message=str(e))

        return LangflowChunkParser(response, sync_stream=False)

    def completion(
            self,
            model: str,
            messages: list,
            api_base: str,
            custom_prompt_dict: dict,
            model_response: litellm.types.utils.ModelResponse,
            print_verbose: Callable,
            encoding,
            api_key,
            logging_obj,
            optional_params: dict,
            acompletion=None,
            litellm_params=None,
            logger_fn=None,
            headers=...,
            timeout: Optional[Union[float, httpx.Timeout]] = None,
            client: Optional[HTTPHandler] = None) -> ModelResponse:

        client = client or HTTPHandler()

        return self._make_completion(model, messages, api_base, client, api_key)

    async def acompletion(
            self,
            model: str,
            messages: list,
            api_base: str,
            custom_prompt_dict: dict,
            model_response: litellm.types.utils.ModelResponse,
            print_verbose: Callable,
            encoding,
            api_key,
            logging_obj,
            optional_params: dict,
            acompletion=None,
            litellm_params=None,
            logger_fn=None,
            headers=...,
            timeout: Optional[Union[float, httpx.Timeout]] = None,
            client: Optional[AsyncHTTPHandler] = None) -> litellm.types.utils.ModelResponse:

        client = client or AsyncHTTPHandler()

        return await self._amake_completion(model, messages, api_base, client, api_key)

    def streaming(
            self,
            model: str,
            messages: list,
            api_base: str,
            custom_prompt_dict: dict,
            model_response: litellm.types.utils.ModelResponse,
            print_verbose: Callable,
            encoding,
            api_key,
            logging_obj,
            optional_params: dict,
            acompletion=None,
            litellm_params=None,
            logger_fn=None,
            headers=...,
            timeout: Optional[Union[float, httpx.Timeout]] = None,
            client: Optional[HTTPHandler] = None) -> Iterator[GenericStreamingChunk]:

        client = client or HTTPHandler()

        return self._make_streaming(model, messages, api_base, client, False, api_key)

    def astreaming(
            self,
            model: str,
            messages: list,
            api_base: str,
            custom_prompt_dict: dict,
            model_response: litellm.types.utils.ModelResponse,
            print_verbose: Callable,
            encoding,
            api_key,
            logging_obj,
            optional_params: dict,
            acompletion=None,
            litellm_params=None,
            logger_fn=None,
            headers=...,
            timeout: Optional[Union[float, httpx.Timeout]] = None,
            client: Optional[AsyncHTTPHandler] = None) -> Iterator[GenericStreamingChunk]:
        """
        NOTE: The implementation is currently a work around. It seems like this astreaming
        function is called further down the line but not awaited. Thus an error is thrown
        where the iterator is attempted to be used without waiting on the coroutine. To
        get around that, the synchronous streaming call is made to generate an iterator without
        the use of a coroutine.
        """
        sync_client = HTTPHandler()
        result = self._make_streaming(model, messages, api_base, sync_client, True, api_key)

        return result


langflow = Langflow()

litellm.custom_provider_map = [
    {"provider": "langflow", "custom_handler": langflow}
]
