from typing import Iterator, AsyncIterator, Optional, Union, Callable
import os
import json

import httpx  # type: ignore

import litellm
import litellm.types
import litellm.types.utils
from litellm.types.utils import Message, ModelResponse, Usage
from litellm.llms.custom_llm import CustomLLM
from litellm.types.utils import GenericStreamingChunk
from litellm._logging import verbose_logger
from litellm.llms.custom_httpx.http_handler import AsyncHTTPHandler, HTTPHandler


# Helper representation of an empty chunk
# GenericStreamingChunk is a TypedDict, so we create it like a dict
EMPTY_CHUNK = GenericStreamingChunk(
    text="", is_finished=False, finish_reason="", usage=None, index=0, tool_use=None
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


def _create_openai_streaming_iterator(
    httpx_client: httpx.Client, url: str, request_body: dict, headers: dict
) -> Iterator[GenericStreamingChunk]:
    """
    Generator function that creates an iterator for OpenAI-compatible streaming chunks.
    Uses httpx streaming context manager properly - context stays open during iteration.
    """

    def _parse_chunk(chunk_text: str) -> GenericStreamingChunk:
        """
        Parse a chunk from OpenAI-compatible format.
        chunk_text should already have 'data: ' prefix removed.
        Always returns a GenericStreamingChunk object, never a dict.
        """
        verbose_logger.debug(
            f"[Langflow Streaming] Parsing chunk text: {chunk_text[:200]}..."
        )

        if len(chunk_text) == 0:
            verbose_logger.debug(
                "[Langflow Streaming] Empty chunk text, returning EMPTY_CHUNK"
            )
            return EMPTY_CHUNK

        if chunk_text == "[DONE]":
            verbose_logger.info("[Langflow Streaming] Received [DONE] marker in chunk")
            return GenericStreamingChunk(
                text="",
                is_finished=True,
                finish_reason="stop",
                usage=None,
                index=0,
                tool_use=None,
            )

        try:
            chunk_json = json.loads(chunk_text)
            verbose_logger.debug(
                f"[Langflow Streaming] Parsed JSON: {json.dumps(chunk_json, indent=2) if isinstance(chunk_json, dict) else str(chunk_json)}"
            )

            # Safety check: ensure chunk_json is a dict
            if not isinstance(chunk_json, dict):
                verbose_logger.error(
                    f"[Langflow Streaming] Parsed JSON is not a dict, type: {type(chunk_json)}, value: {chunk_json}"
                )
                return EMPTY_CHUNK

        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            verbose_logger.error(
                f"[Langflow Streaming] Failed to parse chunk JSON: {chunk_text}"
            )
            verbose_logger.error(f"[Langflow Streaming] Error: {str(e)}", exc_info=True)
            # Return EMPTY_CHUNK instead of raising to avoid breaking the stream
            return EMPTY_CHUNK

        # Check if this is a completion chunk
        status = chunk_json.get("status")
        verbose_logger.debug(f"[Langflow Streaming] Chunk status: {status}")

        if status == "completed":
            verbose_logger.info("[Langflow Streaming] Chunk marked as completed")
            return GenericStreamingChunk(
                text="",
                is_finished=True,
                finish_reason="stop",
                usage=None,
                index=0,
                tool_use=None,
            )

        # Extract content from delta
        delta = chunk_json.get("delta", {})
        verbose_logger.info(
            f"[Langflow Streaming] Delta object: {json.dumps(delta, indent=2) if isinstance(delta, dict) else str(delta)}"
        )
        verbose_logger.info(
            f"[Langflow Streaming] Full chunk_json keys: {list(chunk_json.keys())}"
        )
        verbose_logger.info(
            f"[Langflow Streaming] Full chunk_json: {json.dumps(chunk_json, indent=2)}"
        )

        # Ensure delta is a dict
        if not isinstance(delta, dict):
            verbose_logger.warning(
                f"[Langflow Streaming] Delta is not a dict, type: {type(delta)}, value: {delta}"
            )
            return EMPTY_CHUNK

        content = delta.get("content", "")
        # Ensure content is a string
        if not isinstance(content, str):
            verbose_logger.warning(
                f"[Langflow Streaming] Content is not a string, type: {type(content)}, value: {content}"
            )
            content = str(content) if content is not None else ""

        verbose_logger.info(
            f"[Langflow Streaming] Extracted content (length={len(content)}): {content[:100]}..."
        )

        if not content:
            verbose_logger.debug(
                "[Langflow Streaming] No content in delta, returning EMPTY_CHUNK"
            )
            return EMPTY_CHUNK

        verbose_logger.info(
            f"[Langflow Streaming] Creating chunk with content (length={len(content)}): {content[:100]}..."
        )
        chunk = GenericStreamingChunk(
            text=content,
            is_finished=False,
            finish_reason="",
            usage=None,
            index=0,
            tool_use=None,
        )
        verbose_logger.info(
            f"[Langflow Streaming] Created chunk: text_length={len(chunk.get('text', ''))}, is_finished={chunk.get('is_finished', False)}"
        )
        return chunk

    # Use httpx streaming context manager - this properly keeps connection open during iteration
    verbose_logger.info(f"[Langflow Streaming] Opening streaming context for: {url}")
    verbose_logger.info(
        f"[Langflow Streaming] Request body: {json.dumps(request_body, indent=2)}"
    )
    verbose_logger.info(
        f"[Langflow Streaming] Request headers: {json.dumps({k: '***' if k == 'x-api-key' else v for k, v in headers.items()}, indent=2)}"
    )

    try:
        with httpx_client.stream(
            "POST", url, json=request_body, headers=headers
        ) as response:
            verbose_logger.info(
                f"[Langflow Streaming] Response status: {response.status_code}"
            )
            verbose_logger.info(
                f"[Langflow Streaming] Response headers: {dict(response.headers)}"
            )

            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            verbose_logger.info(
                f"[Langflow Streaming] Response Content-Type: {content_type}"
            )

            # Log first few bytes to see what we're receiving
            verbose_logger.info(
                "[Langflow Streaming] Starting to read stream from Langflow"
            )

            # Iterate over lines from the streaming response
            line_count = 0
            chunk_count = 0
            chunks_with_content = 0
            chunks_yielded = 0
            for line in response.iter_lines():
                line_count += 1
                if line_count <= 10 or line_count % 5 == 0:
                    verbose_logger.info(
                        f"[Langflow Streaming] Received line {line_count} (length={len(line)}): {line[:300]}..."
                    )
                else:
                    verbose_logger.debug(
                        f"[Langflow Streaming] Received line {line_count} (length={len(line)}): {line[:200]}..."
                    )

                if not line:
                    verbose_logger.debug("[Langflow Streaming] Skipping empty line")
                    continue

                # Handle SSE format: "data: {...}\n\n"
                if line.startswith("data: "):
                    chunk_count += 1
                    chunk_text = line[6:].strip()
                    verbose_logger.info(
                        f"[Langflow Streaming] Chunk {chunk_count} - Parsing SSE chunk: {chunk_text[:300]}..."
                    )

                    try:
                        chunk = _parse_chunk(chunk_text)
                        # GenericStreamingChunk is a TypedDict, so we check for required keys instead of isinstance
                        # Verify chunk has the expected structure (TypedDict is essentially a dict)
                        if not isinstance(chunk, dict) or "is_finished" not in chunk:
                            verbose_logger.error(
                                f"[Langflow Streaming] _parse_chunk returned invalid chunk: {type(chunk)}, keys: {list(chunk.keys()) if isinstance(chunk, dict) else 'N/A'}"
                            )
                            # Skip this chunk
                            continue

                        if chunk.get("is_finished", False):
                            chunks_yielded += 1
                            verbose_logger.info(
                                "[Langflow Streaming] Received finished chunk, ending stream"
                            )
                            verbose_logger.info(
                                f"[Langflow Streaming] Stream summary: lines={line_count}, chunks_parsed={chunk_count}, chunks_with_content={chunks_with_content}, chunks_yielded={chunks_yielded}"
                            )
                            yield chunk
                            return
                        elif chunk.get("text"):  # Only yield non-empty chunks
                            chunk_text_value = chunk.get("text", "")
                            chunks_with_content += 1
                            chunks_yielded += 1
                            verbose_logger.info(
                                f"[Langflow Streaming] Yielding chunk {chunks_yielded} with text (length={len(chunk_text_value)}): {chunk_text_value[:100]}..."
                            )
                            yield chunk
                        else:
                            verbose_logger.debug(
                                "[Langflow Streaming] Chunk has no text, skipping"
                            )
                    except Exception as parse_err:
                        verbose_logger.error(
                            f"[Langflow Streaming] Error parsing chunk: {str(parse_err)}",
                            exc_info=True,
                        )
                        # Continue processing other chunks instead of breaking the stream
                        continue
                elif line.strip() == "[DONE]":
                    verbose_logger.info(
                        "[Langflow Streaming] Received [DONE] marker on standalone line"
                    )
                    yield GenericStreamingChunk(
                        text="",
                        is_finished=True,
                        finish_reason="stop",
                        usage=None,
                        index=0,
                        tool_use=None,
                    )
                    return
                else:
                    verbose_logger.debug(
                        f"[Langflow Streaming] Line does not match SSE format: {line[:100]}..."
                    )

            verbose_logger.info("[Langflow Streaming] Stream ended - no more lines")
            verbose_logger.info(
                f"[Langflow Streaming] Final summary: lines={line_count}, chunks_parsed={chunk_count}, chunks_with_content={chunks_with_content}, chunks_yielded={chunks_yielded}"
            )
    except httpx.HTTPStatusError as e:
        error_text = ""
        try:
            if hasattr(e.response, "read"):
                error_text = str(e.response.read())
            elif hasattr(e.response, "text"):
                error_text = str(e.response.text)
            else:
                error_text = str(e)
        except Exception as read_err:
            error_text = f"Error reading response: {str(read_err)}"

        verbose_logger.error(
            f"[Langflow Streaming] HTTP error in generator: {e.response.status_code}: {error_text}"
        )
        raise BaseLLMException(
            status_code=e.response.status_code,
            message=error_text,
            headers=getattr(e.response, "headers", None),
        )
    except Exception as e:
        verbose_logger.error(
            f"[Langflow Streaming] Unexpected error in generator: {str(e)}",
            exc_info=True,
        )
        raise


class LangflowChunkParser:
    """
    Iterator implementation that can take in chunks generated from LangFlow
    in a streaming manner and convert them into LiteLLM chunks
    Handles the old /api/v1/run format with event-based chunks
    """

    def __init__(self, langflow_response: httpx.Response, sync_stream: bool):
        self.langflow_response = langflow_response
        self.sync_stream = sync_stream

        # Use old format parser
        self.stream = self.langflow_response.iter_lines()
        self.astream = self.langflow_response.aiter_lines()

        # Helper to determine if the request is agentic (doesn't produce token messages)
        # As soon as a token payload is recieved, this is set to False
        self.agentic = True

    def _parse_token_chunk(self, payload: dict) -> GenericStreamingChunk:
        # Get the token content from the chunk
        data = payload.get("data", None)
        if data is None:
            verbose_logger.warning(f"data missing on chunk: {payload}")
            raise BaseLLMException(500, message="Missing data on Langflow chunk")

        chunk_text = data.get("chunk", None)
        if chunk_text is None:
            verbose_logger.warning(f"chunk is missing: {payload}")
            raise BaseLLMException(
                500, message="Missing token content in Langflow chunk"
            )

        return GenericStreamingChunk(
            text=chunk_text,
            is_finished=False,
            finish_reason="",
            usage=None,
            index=0,
            tool_use=None,
        )

    def _parse_agentic_end(self, payload: dict) -> GenericStreamingChunk:
        # Try to find the data oject
        data = payload.get("data", None)
        if data is None:
            verbose_logger.warning(f"data missing on chunk: {payload}")
            raise BaseLLMException(500, message="Missing data on Langflow chunk")

        # Get the outputs
        output = data.get("result", {}).get("outputs", None)
        if output is None or len(output) == 0:
            verbose_logger.warning(f"output missing on chunk: {payload}")
            raise BaseLLMException(500, message="Missing output on Langflow chunk")

        # Try to get the output portion of the output (yes really)
        output_result = output[0].get("outputs")
        if output_result is None or len(output_result) == 0:
            verbose_logger.warning(f"output result missing on chunk: {payload}")
            raise BaseLLMException(
                500, message="Missing output result on Langflow chunk"
            )

        # Try to get the results
        results = output_result[0].get("results", None)
        if results is None:
            verbose_logger.warning(f"result missing on chunk: {payload}")
            raise BaseLLMException(500, message="Missing result on Langflow chunk")

        # Get the message
        message = results.get("message", None)
        if message is None:
            verbose_logger.warning(f"message missing on chunk: {payload}")
            raise BaseLLMException(500, message="Missing message on Langflow chunk")

        # Get the text
        text = message.get("text", None)
        if text is None:
            verbose_logger.warning(f"text missing on chunk: {payload}")
            raise BaseLLMException(500, message="Missing text on Langflow chunk")

        return GenericStreamingChunk(
            text=text,
            is_finished=True,
            finish_reason="stop",
            usage=None,
            index=0,
            tool_use=None,
        )

    def _parse_chunck(self, raw: str) -> GenericStreamingChunk:
        if len(raw) == 0:
            return EMPTY_CHUNK

        # Convert the chunk to JSON
        try:
            chunk_json = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            verbose_logger.warning(f"Failed to parse string: {raw}")
            raise BaseLLMException(500, message=str(e))

        # Get the type from the chunk
        event_type = chunk_json.get("event", None)
        if event_type is None:
            verbose_logger.warning(f"event type missing on chunk: {raw}")
            raise BaseLLMException(500, message="Missing event type in Langflow chunk")

        # Some events are not passed back to the user and an empty chunk is sent instead
        unused_event_types = ["add_message"]
        if event_type in unused_event_types:
            return EMPTY_CHUNK

        # Token message handling
        if event_type == "token":
            # Not agentic
            self.agentic = False

            return self._parse_token_chunk(chunk_json)

        # Stop message handling
        if event_type == "end":
            # Agentic responses will have one final end payload with all the content
            if self.agentic:
                return self._parse_agentic_end(chunk_json)
            else:
                return GenericStreamingChunk(
                    text="",
                    is_finished=True,
                    finish_reason="stop",
                    usage=None,
                    index=0,
                    tool_use=None,
                )

        # Otherwise we have reached an unexpected event
        verbose_logger.warning(f"Unexpected event type from Langflow {event_type}")
        raise BaseLLMException(
            500, message=f"Unexpected event from Langflow: {event_type}"
        )

    def __iter__(self):
        return self

    def __next__(self) -> GenericStreamingChunk:
        # Get the next chunk
        next_chunk = next(self.stream)

        # Parse the chunk
        parsed = self._parse_chunck(next_chunk)

        return parsed

    def __aiter__(self):
        return self

    async def __anext__(self) -> GenericStreamingChunk:
        # Get the next chunk
        next_chunk = await anext(self.astream)

        # Parse the chunk
        parsed = self._parse_chunck(next_chunk)

        return parsed


class Langflow(CustomLLM):
    """
    Implementation of the LangFlow Custom provider. Can communicate with a number
    of LangFlow flows based on the provided API and model name.
    """

    def __init__(self):
        self.mapping_endpoint = f"{os.environ['HELPER_BACKEND']}/mapping"

    def _calculate_token_usage(
        self, model: str, messages: list, completion_text: str, encoding=None
    ) -> Usage:
        """
        Calculate token usage for prompt and completion.
        Uses encoding if provided, otherwise falls back to litellm.token_counter.
        """
        try:
            if encoding is not None:
                # Use the provided encoding if available
                prompt_tokens = sum(
                    len(encoding.encode(str(msg.get("content", ""))))
                    for msg in messages
                    if isinstance(msg, dict) and "content" in msg
                )
                completion_tokens = len(encoding.encode(completion_text))
            else:
                # Fall back to litellm.token_counter for model-specific tokenization
                try:
                    prompt_tokens = litellm.token_counter(
                        model=model, messages=messages
                    )
                    completion_tokens = litellm.token_counter(
                        model=model, text=completion_text
                    )
                except Exception as e:
                    verbose_logger.warning(
                        f"Failed to use litellm.token_counter: {e}, using approximation"
                    )
                    # Fallback approximation: ~4 characters per token
                    prompt_text = " ".join(
                        str(msg.get("content", ""))
                        for msg in messages
                        if isinstance(msg, dict)
                    )
                    prompt_tokens = len(prompt_text) // 4
                    completion_tokens = len(completion_text) // 4

            total_tokens = prompt_tokens + completion_tokens

            return Usage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
            )
        except Exception as e:
            verbose_logger.warning(
                f"Failed to calculate token usage: {e}, defaulting to 0"
            )
            return Usage(prompt_tokens=0, completion_tokens=0, total_tokens=0)

    def _get_history_component_id(
        self, model: str, base_url: str, client: HTTPHandler, api_key: str
    ) -> Optional[str]:
        """
        Get the history component ID. This relies on the LangFlow API to find the flow based on the
        model name and parse the components. The history component should start with `CompletionInterface`.
        """
        # Make the request to get the flow data and handle any errors
        request_url = f"{base_url}/api/v1/flows/{model}"
        try:
            response = client.get(request_url, headers={"x-api-key": api_key}).json()
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
        flow_data = response.get("data", None)
        if flow_data is None:
            raise BaseLLMException(
                status_code=500,
                message=f"Missing data field existing fields: {response.keys()}",
            )

        # Try to find the nodes
        nodes = flow_data.get("nodes", None)
        if nodes is None:
            raise BaseLLMException(
                status_code=500,
                message=f"Missing node field existing fields: {flow_data.keys()}",
            )

        # Next loop over the nodes for the target component
        for node in nodes:
            data = node.get("data", None)
            if data is None:
                continue
            type = data.get("type", None)
            id = data.get("id", None)
            if type is not None and type.startswith("CompletionInterface"):
                return id

        # No history component node found
        return None

    async def _aget_history_component_id(
        self, model: str, base_url: str, client: AsyncHTTPHandler, api_key: str
    ) -> Optional[str]:
        """
        Get the history component ID. This relies on the LangFlow API to find the flow based on the
        model name and parse the components. The history component should start with `CompletionInterface`.
        """
        # Make the request to get the flow data and handle any errors
        request_url = f"{base_url}/api/v1/flows/{model}"
        try:
            response = (
                await client.get(request_url, headers={"x-api-key": api_key})
            ).json()
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
        flow_data = response.get("data", None)
        if flow_data is None:
            raise BaseLLMException(
                status_code=500,
                message=f"Missing data field existing fields: {response.keys()}",
            )

        # Try to find the nodes
        nodes = flow_data.get("nodes", None)
        if nodes is None:
            raise BaseLLMException(
                status_code=500,
                message=f"Missing node field existing fields: {flow_data.keys()}",
            )

        # Next loop over the nodes for the target component
        for node in nodes:
            id = node.get("id", None)
            if id is not None and id.startswith("CompletionInterface"):
                return id

        # No history component node found
        return None

    def _get_completion_response(self, response: httpx.Response) -> str:
        return response.json()["outputs"][0]["outputs"][0]["results"]["message"][
            "data"
        ]["text"]

    def _make_request_body(
        self, messages: list, history_componet: Optional[str]
    ) -> dict:
        history = dict()
        history["content"] = [messages[index] for index in range(0, len(messages) - 1)]
        tweaks = dict()

        if history_componet is not None:
            tweaks = {history_componet: {"messages": history}}

        return {
            "input_type": "chat",
            "output_type": "chat",
            "input_value": messages[-1]["content"],
            "tweaks": tweaks,
        }

    def _make_completion(
        self,
        model: str,
        messages: list,
        base_url: str,
        client: HTTPHandler,
        api_key: str,
        encoding=None,
    ) -> ModelResponse:
        """
        Make a single completition request
        """
        execution_url = f"{base_url}/api/v1/run/{model}"
        history_component = self._get_history_component_id(
            model, base_url, client, api_key
        )

        try:
            response = client.post(
                execution_url,
                params={"stream": False},
                json=self._make_request_body(messages, history_component),
                headers={"x-api-key": api_key},
            )
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

        completion_text = self._get_completion_response(response)
        usage = self._calculate_token_usage(model, messages, completion_text, encoding)

        return ModelResponse(
            choices=[
                litellm.Choices(
                    finish_reason="stop", message=Message(content=completion_text)
                )
            ],
            usage=usage,
        )

    async def _amake_completion(
        self,
        model: str,
        messages: list,
        base_url: str,
        client: AsyncHTTPHandler,
        api_key: str,
        encoding=None,
    ) -> ModelResponse:
        """
        Make a single completition request
        """
        execution_url = f"{base_url}/api/v1/run/{model}"
        history_component = await self._aget_history_component_id(
            model, base_url, client, api_key
        )

        try:
            response = await client.post(
                execution_url,
                params={"stream": False},
                json=self._make_request_body(messages, history_component),
                headers={"x-api-key": api_key},
            )
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

        completion_text = self._get_completion_response(response)
        usage = self._calculate_token_usage(model, messages, completion_text, encoding)

        return ModelResponse(
            choices=[
                litellm.Choices(
                    finish_reason="stop", message=Message(content=completion_text)
                )
            ],
            usage=usage,
        )

    def _make_streaming(
        self,
        model: str,
        messages: list,
        base_url: str,
        client: HTTPHandler,
        sync_stream: bool,
        api_key,
    ) -> Iterator[GenericStreamingChunk]:
        """
        Stream responses using Langflow's /api/v1/run endpoint.
        This endpoint provides reliable streaming and supports full message history.
        """
        execution_url = f"{base_url}/api/v1/run/{model}"
        history_component = self._get_history_component_id(
            model, base_url, client, api_key
        )
        request_body = self._make_request_body(messages, history_component)

        try:
            httpx_client = httpx.Client(timeout=60.0)
            headers = {"x-api-key": api_key, "Content-Type": "application/json"}

            with httpx_client.stream(
                "POST",
                execution_url,
                params={"stream": True},
                json=request_body,
                headers=headers,
            ) as response:
                response.raise_for_status()

                # Parse Langflow's native streaming format
                parser = LangflowChunkParser(response, sync_stream=sync_stream)

                for chunk in parser:
                    yield chunk

        except httpx.HTTPStatusError as e:
            error_text = ""
            try:
                if hasattr(e.response, "read"):
                    error_text = str(e.response.read())
                elif hasattr(e.response, "text"):
                    error_text = str(e.response.text)
                else:
                    error_text = str(e)
            except Exception as read_err:
                error_text = f"Error reading response: {str(read_err)}"

            verbose_logger.error(
                f"[Langflow Streaming] HTTP error {e.response.status_code}: {error_text}"
            )
            verbose_logger.error(f"[Langflow Streaming] Request URL: {execution_url}")

            error_headers = getattr(e, "headers", None)
            error_response = getattr(e, "response", None)
            if error_headers is None and error_response:
                error_headers = getattr(error_response, "headers", None)

            raise BaseLLMException(
                status_code=e.response.status_code,
                message=error_text,
                headers=error_headers,
            )
        except Exception as e:
            verbose_logger.error(
                f"[Langflow Streaming] Unexpected error: {str(e)}", exc_info=True
            )
            for exception in litellm.exceptions.LITELLM_EXCEPTION_TYPES:
                if isinstance(e, exception):
                    raise e
            raise BaseLLMException(status_code=500, message=str(e))

    def _make_streaming_fallback_run(
        self,
        model: str,
        messages: list,
        base_url: str,
        client: HTTPHandler,
        sync_stream: bool,
        api_key,
    ) -> Iterator[GenericStreamingChunk]:
        """
        Fallback streaming method using /api/v1/run endpoint.
        This endpoint supports full messages array with conversation history.
        """
        verbose_logger.info("[Langflow Streaming Fallback] Using /api/v1/run endpoint")
        execution_url = f"{base_url}/api/v1/run/{model}"
        history_component = self._get_history_component_id(
            model, base_url, client, api_key
        )

        verbose_logger.info(
            f"[Langflow Streaming Fallback] Execution URL: {execution_url}"
        )
        verbose_logger.info(
            f"[Langflow Streaming Fallback] History component: {history_component}"
        )

        request_body = self._make_request_body(messages, history_component)
        verbose_logger.debug(
            f"[Langflow Streaming Fallback] Request body: {json.dumps(request_body, indent=2)}"
        )

        try:
            # Use httpx.Client directly for streaming
            httpx_client = httpx.Client(timeout=60.0)
            headers = {"x-api-key": api_key, "Content-Type": "application/json"}

            verbose_logger.info(
                "[Langflow Streaming Fallback] Making streaming POST request with stream=True param"
            )

            # Use httpx streaming - this uses Langflow's native format
            with httpx_client.stream(
                "POST",
                execution_url,
                params={"stream": True},
                json=request_body,
                headers=headers,
            ) as response:
                verbose_logger.info(
                    f"[Langflow Streaming Fallback] Response status: {response.status_code}"
                )
                verbose_logger.debug(
                    f"[Langflow Streaming Fallback] Response headers: {dict(response.headers)}"
                )

                response.raise_for_status()

                content_type = response.headers.get("content-type", "")
                verbose_logger.info(
                    f"[Langflow Streaming Fallback] Response Content-Type: {content_type}"
                )

                # Use the old LangflowChunkParser for Langflow's native format
                parser = LangflowChunkParser(response, sync_stream=sync_stream)
                verbose_logger.info(
                    "[Langflow Streaming Fallback] Created LangflowChunkParser, returning"
                )

                # Return iterator that yields from the parser
                for chunk in parser:
                    verbose_logger.debug(
                        f"[Langflow Streaming Fallback] Yielding chunk: finished={chunk.get('is_finished', False)}, text_length={len(chunk.get('text', '')) if chunk.get('text') else 0}"
                    )
                    yield chunk

        except httpx.HTTPStatusError as e:
            error_text = ""
            try:
                if hasattr(e.response, "read"):
                    error_text = str(e.response.read())
                elif hasattr(e.response, "text"):
                    error_text = str(e.response.text)
                else:
                    error_text = str(e)
            except Exception as read_err:
                error_text = f"Error reading response: {str(read_err)}"

            verbose_logger.error(
                f"[Langflow Streaming Fallback] HTTP error {e.response.status_code}: {error_text}"
            )
            raise BaseLLMException(
                status_code=e.response.status_code,
                message=error_text,
                headers=getattr(e.response, "headers", None),
            )
        except Exception as e:
            verbose_logger.error(
                f"[Langflow Streaming Fallback] Unexpected error: {str(e)}",
                exc_info=True,
            )
            raise

    async def _amake_streaming(
        self,
        model: str,
        messages: list,
        base_url: str,
        client: AsyncHTTPHandler,
        api_key: str,
    ) -> AsyncIterator[GenericStreamingChunk]:
        verbose_logger.info(
            f"[Langflow Async Streaming] Starting async streaming request for model: {model}"
        )
        verbose_logger.info(f"[Langflow Async Streaming] Base URL: {base_url}")
        verbose_logger.info(
            f"[Langflow Async Streaming] Messages count: {len(messages)}"
        )
        verbose_logger.debug(
            f"[Langflow Async Streaming] Messages: {json.dumps(messages, indent=2)}"
        )

        # Use OpenAI-compatible /api/v1/responses endpoint for better streaming support
        execution_url = f"{base_url}/api/v1/responses"
        verbose_logger.info(
            f"[Langflow Async Streaming] Execution URL: {execution_url}"
        )

        # Convert messages to OpenAI-compatible format - extract last user message as input
        input_text = None
        for msg in reversed(messages):
            if isinstance(msg, dict) and msg.get("role") == "user":
                input_text = msg.get("content", "")
                verbose_logger.debug(
                    f"[Langflow Async Streaming] Found user message: {input_text[:100]}..."
                )
                break

        if not input_text:
            # Fallback: use the last message content
            if messages and isinstance(messages[-1], dict):
                input_text = messages[-1].get("content", "")
                verbose_logger.debug(
                    f"[Langflow Async Streaming] Using last message as fallback: {input_text[:100]}..."
                )

        if not input_text:
            verbose_logger.error(
                "[Langflow Async Streaming] No user message found in messages array"
            )
            raise BaseLLMException(
                400, message="No user message found in messages array"
            )

        request_body = {
            "model": model,  # flow_id
            "input": input_text,
            "stream": True,
        }

        verbose_logger.info(
            f"[Langflow Async Streaming] Request body: model={model}, input_length={len(input_text)}, stream=True"
        )

        try:
            # For async streaming, use httpx.AsyncClient as context manager
            headers = {"x-api-key": api_key, "Content-Type": "application/json"}

            verbose_logger.info(
                f"[Langflow Async Streaming] Making async POST request to {execution_url}"
            )
            verbose_logger.debug(
                "[Langflow Async Streaming] Headers: x-api-key present, Content-Type: application/json"
            )

            # Use async client and streaming context manager
            async with httpx.AsyncClient(timeout=60.0) as async_client:
                async with async_client.stream(
                    "POST", execution_url, json=request_body, headers=headers
                ) as response:
                    verbose_logger.info(
                        f"[Langflow Async Streaming] Response status: {response.status_code}"
                    )
                    verbose_logger.debug(
                        f"[Langflow Async Streaming] Response headers: {dict(response.headers)}"
                    )

                    response.raise_for_status()

                    content_type = response.headers.get("content-type", "")
                    verbose_logger.info(
                        f"[Langflow Async Streaming] Response Content-Type: {content_type}"
                    )

                    # Create async generator that yields chunks
                    async for line in response.aiter_lines():
                        verbose_logger.debug(
                            f"[Langflow Async Streaming] Received line (length={len(line)}): {line[:200]}..."
                        )

                        if not line:
                            verbose_logger.debug(
                                "[Langflow Async Streaming] Skipping empty line"
                            )
                            continue

                        # Handle SSE format
                        if line.startswith("data: "):
                            chunk_text = line[6:].strip()
                            verbose_logger.debug(
                                f"[Langflow Async Streaming] Parsing SSE chunk: {chunk_text[:200]}..."
                            )

                            if chunk_text == "[DONE]":
                                verbose_logger.info(
                                    "[Langflow Async Streaming] Received [DONE] marker"
                                )
                                yield GenericStreamingChunk(
                                    text="",
                                    is_finished=True,
                                    finish_reason="stop",
                                    usage=None,
                                    index=0,
                                    tool_use=None,
                                )
                                return

                            try:
                                chunk_json = json.loads(chunk_text)
                                verbose_logger.debug(
                                    f"[Langflow Async Streaming] Parsed JSON: {json.dumps(chunk_json, indent=2)}"
                                )

                                status = chunk_json.get("status")
                                verbose_logger.debug(
                                    f"[Langflow Async Streaming] Chunk status: {status}"
                                )

                                if status == "completed":
                                    verbose_logger.info(
                                        "[Langflow Async Streaming] Chunk marked as completed"
                                    )
                                    yield GenericStreamingChunk(
                                        text="",
                                        is_finished=True,
                                        finish_reason="stop",
                                        usage=None,
                                        index=0,
                                        tool_use=None,
                                    )
                                    return

                                delta = chunk_json.get("delta", {})
                                verbose_logger.debug(
                                    f"[Langflow Async Streaming] Delta object: {json.dumps(delta, indent=2)}"
                                )

                                content = delta.get("content", "")
                                verbose_logger.debug(
                                    f"[Langflow Async Streaming] Extracted content (length={len(content)}): {content[:100]}..."
                                )

                                if content:
                                    verbose_logger.debug(
                                        f"[Langflow Async Streaming] Yielding chunk with content: {content[:100]}..."
                                    )
                                    yield GenericStreamingChunk(
                                        text=content,
                                        is_finished=False,
                                        finish_reason="",
                                        usage=None,
                                        index=0,
                                        tool_use=None,
                                    )
                            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                                verbose_logger.error(
                                    f"[Langflow Async Streaming] Failed to parse chunk: {chunk_text}"
                                )
                                verbose_logger.error(
                                    f"[Langflow Async Streaming] Error: {str(e)}",
                                    exc_info=True,
                                )
                                continue
                        elif line.strip() == "[DONE]":
                            verbose_logger.info(
                                "[Langflow Async Streaming] Received [DONE] marker on standalone line"
                            )
                            yield GenericStreamingChunk(
                                text="",
                                is_finished=True,
                                finish_reason="stop",
                                usage=None,
                                index=0,
                                tool_use=None,
                            )
                            return
                        else:
                            verbose_logger.debug(
                                f"[Langflow Async Streaming] Line does not match SSE format: {line[:100]}..."
                            )

        except httpx.HTTPStatusError as e:
            error_headers = getattr(e, "headers", None)
            error_response = getattr(e, "response", None)
            if error_headers is None and error_response:
                error_headers = getattr(error_response, "headers", None)

            error_text = ""
            try:
                if hasattr(e.response, "read"):
                    error_text = str(e.response.read())
                elif hasattr(e.response, "text"):
                    error_text = str(e.response.text)
                else:
                    error_text = str(e)
            except Exception as read_err:
                error_text = f"Error reading response: {str(read_err)}"

            verbose_logger.error(
                f"[Langflow Async Streaming] HTTP error {e.response.status_code}: {error_text}"
            )
            verbose_logger.error(
                f"[Langflow Async Streaming] Request URL: {execution_url}"
            )
            verbose_logger.error(
                f"[Langflow Async Streaming] Request body: {json.dumps(request_body, indent=2)}"
            )

            raise BaseLLMException(
                status_code=e.response.status_code,
                message=error_text,
                headers=error_headers,
            )
        except Exception as e:
            verbose_logger.error(
                f"[Langflow Async Streaming] Unexpected error: {str(e)}", exc_info=True
            )
            for exception in litellm.exceptions.LITELLM_EXCEPTION_TYPES:
                if isinstance(e, exception):
                    raise e
            raise BaseLLMException(status_code=500, message=str(e))

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
        client: Optional[HTTPHandler] = None,
    ) -> ModelResponse:
        client = client or HTTPHandler()

        return self._make_completion(
            model, messages, api_base, client, api_key, encoding
        )

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
        client: Optional[AsyncHTTPHandler] = None,
    ) -> litellm.types.utils.ModelResponse:
        client = client or AsyncHTTPHandler()

        return await self._amake_completion(
            model, messages, api_base, client, api_key, encoding
        )

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
        client: Optional[HTTPHandler] = None,
    ) -> Iterator[GenericStreamingChunk]:
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
        client: Optional[AsyncHTTPHandler] = None,
    ) -> Iterator[GenericStreamingChunk]:
        """
        NOTE: The implementation is currently a work around. It seems like this astreaming
        function is called further down the line but not awaited. Thus an error is thrown
        where the iterator is attempted to be used without waiting on the coroutine. To
        get around that, the synchronous streaming call is made to generate an iterator without
        the use of a coroutine.
        """
        sync_client = HTTPHandler()
        result = self._make_streaming(
            model, messages, api_base, sync_client, True, api_key
        )

        return result


langflow = Langflow()

litellm.custom_provider_map = [{"provider": "langflow", "custom_handler": langflow}]
