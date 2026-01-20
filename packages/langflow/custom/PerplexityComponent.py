from typing import Any, List, Optional, Iterator
import json

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessageChunk, HumanMessage, SystemMessage
from langchain_core.outputs import ChatGenerationChunk, ChatGeneration
from langchain_core.callbacks import CallbackManagerForLLMRun
from pydantic.v1 import Field
import httpx

from langflow.base.models.model import LCModelComponent
from langflow.field_typing import LanguageModel
from langflow.field_typing.range_spec import RangeSpec
from langflow.inputs.inputs import (
    BoolInput,
    DropdownInput,
    IntInput,
    SecretStrInput,
    SliderInput,
    StrInput,
)
from langflow.logging import logger


class PerplexityChatModel(BaseChatModel):
    """Custom BaseChatModel implementation for Perplexity that handles streaming and metadata.
    
    This implementation parses the SSE stream directly to capture search_results and
    related_questions from the final chunks, as shown in Perplexity's documentation.
    """
    
    api_key: str = Field(..., description="Perplexity API Key")
    model_name: str = Field(default="sonar", description="Model name")
    base_url: str = Field(default="https://api.perplexity.ai", description="API base URL")
    temperature: float = Field(default=0.7, description="Temperature")
    max_tokens: Optional[int] = Field(default=None, description="Max tokens")
    search_mode: str = Field(default="web", description="Search mode")
    return_citations: bool = Field(default=True, description="Return citations")
    return_related_questions: bool = Field(default=False, description="Return related questions")
    return_images: bool = Field(default=False, description="Return images")
    search_domain_filter: Optional[List[str]] = Field(default=None, description="Domain filter")
    search_recency_filter: Optional[str] = Field(default=None, description="Recency filter")
    
    @property
    def _llm_type(self) -> str:
        return "perplexity"
    
    def _convert_messages_to_api_format(self, messages: List[BaseMessage]) -> List[dict]:
        """Convert LangChain messages to Perplexity API format."""
        api_messages = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                api_messages.append({"role": "system", "content": msg.content})
            elif isinstance(msg, HumanMessage):
                api_messages.append({"role": "user", "content": msg.content})
            elif hasattr(msg, "content"):
                # Default to user message
                api_messages.append({"role": "user", "content": msg.content})
        return api_messages
    
    def _stream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[ChatGenerationChunk]:
        """Stream responses from Perplexity API, capturing search_results from final chunks."""
        api_messages = self._convert_messages_to_api_format(messages)
        
        # Build payload
        payload = {
            "model": self.model_name,
            "messages": api_messages,
            "stream": True,
            "temperature": self.temperature,
        }
        
        if self.max_tokens:
            payload["max_tokens"] = self.max_tokens
        if self.search_mode:
            payload["search_mode"] = self.search_mode
        if self.return_citations is not None:
            payload["return_citations"] = self.return_citations
        if self.return_related_questions is not None:
            payload["return_related_questions"] = self.return_related_questions
        if self.return_images is not None:
            payload["return_images"] = self.return_images
        if self.search_domain_filter:
            payload["search_domain_filter"] = self.search_domain_filter
        if self.search_recency_filter:
            payload["search_recency_filter"] = self.search_recency_filter
        
        # Get API key
        api_key = self.api_key
        if hasattr(api_key, "get_secret_value"):
            api_key = api_key.get_secret_value()
        
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Track metadata from final chunks
        search_results = None
        related_questions = None
        
        # Parse SSE stream directly (as shown in Perplexity docs)
        try:
            with httpx.Client(timeout=300.0) as client:
                with client.stream("POST", url, headers=headers, json=payload) as response:
                    response.raise_for_status()
                    
                    for line in response.iter_lines():
                        if not line:
                            continue
                        
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            
                            if data_str == "[DONE]":
                                break
                            
                            try:
                                chunk = json.loads(data_str)
                                
                                # Process content chunks
                                if "choices" in chunk and chunk["choices"]:
                                    delta = chunk["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    
                                    if content:
                                        # Yield content chunk
                                        chunk_message = AIMessageChunk(content=content)
                                        yield ChatGenerationChunk(message=chunk_message)
                                    
                                    # Check for finish reason
                                    if chunk["choices"][0].get("finish_reason"):
                                        break
                                
                                # Collect metadata from chunks (Perplexity sends at top level)
                                if "search_results" in chunk:
                                    search_results = chunk["search_results"]
                                if "related_questions" in chunk:
                                    related_questions = chunk["related_questions"]
                                    
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Error streaming from Perplexity: {e}", exc_info=True)
            raise
        
        # Append metadata after streaming completes
        if search_results and self.return_citations:
            citations_text = "\n\n## Sources:\n"
            for i, result in enumerate(search_results, 1):
                title = result.get("title", "Untitled")
                url = result.get("url", "")
                citations_text += f"{i}. [{title}]({url})\n"
            
            yield ChatGenerationChunk(message=AIMessageChunk(content=citations_text))
        
        if related_questions and self.return_related_questions:
            questions_text = "\n\n## Related Questions:\n"
            for question in related_questions:
                questions_text += f"- {question}\n"
            
            yield ChatGenerationChunk(message=AIMessageChunk(content=questions_text))
    
    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatGeneration:
        """Generate a non-streaming response."""
        # For non-streaming, accumulate the stream
        accumulated_content = ""
        for chunk in self._stream(messages, stop=stop, run_manager=run_manager, **kwargs):
            if chunk.message.content:
                accumulated_content += chunk.message.content
        
        from langchain_core.messages import AIMessage
        message = AIMessage(content=accumulated_content)
        return ChatGeneration(message=message)


class PerplexityComponent(LCModelComponent):
    display_name = "Perplexity"
    description = "Generates text using Perplexity Sonar API with web search and citations. OpenAI-compatible."
    documentation = "https://docs.perplexity.ai/"
    icon = "Perplexity"
    name = "PerplexityModel"

    inputs = [
        *LCModelComponent._base_inputs,
        IntInput(
            name="max_tokens",
            display_name="Max Tokens",
            advanced=True,
            info="The maximum number of tokens to generate. Set to 0 for unlimited tokens.",
            range_spec=RangeSpec(min=0, max=128000),
        ),
        DropdownInput(
            name="model_name",
            display_name="Model Name",
            advanced=False,
            options=[
                "sonar",
                "sonar-pro",
                "sonar-reasoning",
                "sonar-reasoning-pro",
            ],
            value="sonar",
            combobox=True,
            real_time_refresh=True,
            info="Perplexity Sonar models with web search capabilities",
        ),
        SecretStrInput(
            name="api_key",
            display_name="Perplexity API Key",
            info="The Perplexity API Key to use.",
            advanced=False,
            value="PERPLEXITY_API_KEY",
            required=True,
        ),
        SliderInput(
            name="temperature",
            display_name="Temperature",
            value=0.7,
            range_spec=RangeSpec(min=0, max=2, step=0.1),
            show=True,
            info="Controls randomness in generation (0-2)",
        ),
        IntInput(
            name="max_retries",
            display_name="Max Retries",
            info="The maximum number of retries to make when generating.",
            advanced=True,
            value=5,
        ),
        IntInput(
            name="timeout",
            display_name="Timeout",
            info="The timeout for requests to Perplexity API.",
            advanced=True,
            value=700,
        ),
        # Perplexity-specific parameters
        StrInput(
            name="search_domain_filter",
            display_name="Search Domain Filter",
            info="Comma-separated domains to include or exclude. Use '-' prefix to exclude (e.g., 'wikipedia.org, arxiv.org, -reddit.com')",
            advanced=True,
            value="",
        ),
        DropdownInput(
            name="search_recency_filter",
            display_name="Search Recency Filter",
            info="Filter search results by time period",
            advanced=True,
            options=[
                "",
                "hour",
                "day",
                "week",
                "month",
                "year",
            ],
            value="",
        ),
        BoolInput(
            name="return_citations",
            display_name="Return Citations",
            info="Include citations in the response",
            advanced=True,
            value=True,
        ),
        BoolInput(
            name="return_related_questions",
            display_name="Return Related Questions",
            info="Include related questions in the response",
            advanced=True,
            value=False,
        ),
        BoolInput(
            name="return_images",
            display_name="Return Images",
            info="Include image URLs in the response",
            advanced=True,
            value=False,
        ),
    ]

    def _parse_domain_filter(self) -> List[str]:
        """Parse the domain filter string into a list for the API."""
        if not self.search_domain_filter:
            return []

        domains = []
        for domain in self.search_domain_filter.split(","):
            domain = domain.strip()
            if domain:
                if domain.startswith("-"):
                    clean_domain = (
                        domain[1:]
                        .replace("https://", "")
                        .replace("http://", "")
                        .replace("www.", "")
                        .strip()
                    )
                    domains.append(f"-{clean_domain}")
                else:
                    clean_domain = (
                        domain.replace("https://", "")
                        .replace("http://", "")
                        .replace("www.", "")
                        .strip()
                    )
                    domains.append(clean_domain)
        return domains

    def build_model(self) -> LanguageModel:  # type: ignore[type-var]
        logger.debug(f"Building Perplexity model: {self.model_name}")

        # Parse domain filter
        domain_filter = self._parse_domain_filter()
        
        # Build the custom PerplexityChatModel
        model = PerplexityChatModel(
            api_key=self.api_key,
            model_name=self.model_name,
            base_url="https://api.perplexity.ai",
            temperature=self.temperature if self.temperature is not None else 0.7,
            max_tokens=self.max_tokens or None,
            search_mode="web",
            return_citations=bool(self.return_citations),
            return_related_questions=bool(self.return_related_questions),
            return_images=bool(self.return_images),
            search_domain_filter=domain_filter if domain_filter else None,
            search_recency_filter=self.search_recency_filter if self.search_recency_filter else None,
        )

        return model

    def _get_exception_message(self, e: Exception):
        """Get a message from an exception.

        Args:
            e (Exception): The exception to get the message from.

        Returns:
            str: The message from the exception.
        """
        try:
            from openai import BadRequestError
        except ImportError:
            return None
        if isinstance(e, BadRequestError):
            message = e.body.get("message")
            if message:
                return message
        return None

    def update_build_config(self, build_config: dict, field_value: Any, field_name: str | None = None) -> dict:
        """Update build config when fields change."""
        # This method can be used to dynamically show/hide fields based on model selection
        # For now, we keep all fields visible
        return build_config
