from typing import Iterator, AsyncIterator, Optional, Union, Callable
import json

import httpx  # type: ignore

from prisma import Prisma

import asyncio

import litellm.litellm_core_utils
from litellm.proxy.utils import PrismaClient
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
from litellm.proxy.proxy_server import prisma_client


EMPTY_CHUNK = GenericStreamingChunk(
    text='',
    is_finished=False,
    finish_reason='',
    usage=None,
    index=0,
    tool_use=None
) 

class BaseLLMException(Exception):
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
    def __init__(self, prisma: Prisma):
        self.prisma: Prisma = prisma

    async def _make_table(self):
        """
        Helper to create the needed database table for keeping track of 
        LangFlow URLs
        """
        table_exists = await self.prisma.execute_raw('''
            SELECT EXISTS (
               SELECT 1
               FROM pg_tables
               WHERE schemaname = 'public'
               AND tablename = 'my_table'
            )
        ''')
        verbose_logger.warning(f'HEEYYYYYYYYYYYYYYYYYY: {table_exists}')

    def _get_langflow_url(self, model: str) -> str:
        """ 
        Helper to get the LangFlow URL based on the model specified. Currently not implemented so 
        returns a constant
        """
        return 'http://langflow:7860/api/v1/run/8e785198-f630-4d9f-94fa-26c8e945da80'

    def _get_completion_response(self, response: httpx.Response) -> str:
        return response.json()['outputs'][0]['outputs'][0]['results']['message']['data']['text']

    def _make_request_body(self, messages: list) -> dict:
        history = dict()
        history['content'] = [messages[index] for index in range(0, len(messages) - 1)]

        return {
            'input_type': 'chat',
            'output_type': 'chat',
            'input_value': messages[-1]['content'],
            'tweaks': {
                'CompletionInterface-qNlsX': {
                    'messages': history
                }
            }
        }

    def _make_completion(self, model: str, messages: list, client: HTTPHandler) -> ModelResponse:
        """
        Make a single completition request
        """
        base_url = self._get_langflow_url(model)

        try:
            response = client.post(base_url, params={'stream': False}, json=self._make_request_body(messages))
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

    async def _amake_completion(self, model: str, messages: list, client: AsyncHTTPHandler) -> ModelResponse:
        """
        Make a single completition request
        """
        base_url = self._get_langflow_url(model)

        try:
            response = await client.post(base_url, params={'stream': False}, json=self._make_request_body(messages))
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

    def _make_streaming(self, model: str, messages: list, client: HTTPHandler, sync_stream: bool) -> Iterator[GenericStreamingChunk]:
        base_url = self._get_langflow_url(model)

        try:
            response = client.post(base_url, params={'stream': True}, json=self._make_request_body(messages))
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

    async def _amake_streaming(self, model: str, messages: list, client: AsyncHTTPHandler) -> AsyncIterator[GenericStreamingChunk]:
        base_url = self._get_langflow_url(model)

        try:
            request_body = self._make_request_body(messages)
            response = await client.post(base_url, params={'stream': True}, json=request_body)
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

        return self._make_completion(model, messages, client)

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
        
        return await self._amake_completion(model, messages, client)

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
        
        return self._make_streaming(model, messages, client, False) 
    
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
        result = self._make_streaming(model, messages, sync_client, True)
        
        return result


if prisma_client is None:
    raise Exception('Prisma client is not defined')

async def _setup_db_table(prisma: Prisma):
    table_exists = await prisma.execute_raw('''
        SELECT EXISTS (
           SELECT 1
           FROM pg_tables
           WHERE schemaname = 'public'
           AND tablename = 'my_table'
        )
    ''')

    verbose_logger.warning(f'HEREEEEE: {table_exists}')

# Run the setup logic
loop = asyncio.get_event_loop()
loop.create_task(_setup_db_table(prisma_client.db._original_prisma))

langflow = Langflow(prisma_client.db._original_prisma)

litellm.custom_provider_map = [ # 👈 KEY STEP - REGISTER HANDLER
    {"provider": "langflow", "custom_handler": langflow}
]
