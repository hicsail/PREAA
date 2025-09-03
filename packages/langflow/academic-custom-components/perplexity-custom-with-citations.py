import json
import httpx
from typing import Any, Dict, List, Optional, Union
from langflow.base.models.model import LCModelComponent
from langflow.field_typing import Text
from langflow.field_typing.range_spec import RangeSpec
from langflow.io import BoolInput, DropdownInput, FloatInput, IntInput, SecretStrInput, SliderInput, MessageTextInput, Output, MessageInput
from langflow.schema.message import Message
from langflow.schema import Data
import re


class PerplexityComponent(LCModelComponent):
    display_name = "Perplexity Direct API"
    description = "Generate text using Perplexity API with citations and source domain filtering."
    documentation = "https://docs.perplexity.ai/"
    icon = "Perplexity"
    name = "PerplexityDirectModel"
    
    inputs = [
        MessageInput(
            name="input_message",
            display_name="Input",
            info="The message or question to send to Perplexity",
            required=False,  # Made optional so it can receive from connections
        ),
        MessageTextInput(
            name="system_message",
            display_name="System Message",
            info="System instructions to guide the model's behavior",
            advanced=False,  # Make it visible by default
            value="You are a helpful assistant. Always provide accurate information and cite your sources.",
        ),
        DropdownInput(
            name="model_name",
            display_name="Model Name",
            advanced=False,
            options=[
                "sonar",
                "sonar-pro", 
                "sonar-reasoning",
            ],
            value="sonar",
            info="Sonar models include web search and return citations"
        ),
        SecretStrInput(
            name="api_key",
            display_name="Perplexity API Key",
            info="Your Perplexity API Key",
            advanced=False,
            required=True,
        ),
        MessageTextInput(
            name="search_domain_filter",
            display_name="Search Domain Filter",
            info="Comma-separated domains to include or exclude. Use '-' prefix to exclude (e.g., 'wikipedia.org, arxiv.org, -reddit.com')",
            advanced=False,
            value="",
        ),
        DropdownInput(
            name="search_recency_filter",
            display_name="Search Recency Filter",
            info="Filter search results by time period",
            advanced=False,
            options=[
                "",  # No filter
                "hour",
                "day", 
                "week",
                "month",
                "year",
            ],
            value="",
        ),
        IntInput(
            name="max_tokens",
            display_name="Max Tokens",
            info="Maximum number of tokens to generate",
            advanced=True,
            value=1024,
        ),
        SliderInput(
            name="temperature",
            display_name="Temperature",
            value=0.7,
            range_spec=RangeSpec(min=0, max=2, step=0.1),
            info="Controls randomness in generation"
        ),
        FloatInput(
            name="top_p",
            display_name="Top P",
            info="Nucleus sampling parameter",
            advanced=True,
            value=0.9,
        ),
        IntInput(
            name="top_k",
            display_name="Top K",
            info="Top-k sampling parameter (0 to disable)",
            advanced=True,
            value=0,  # Default to 0 (disabled)
        ),
        FloatInput(
            name="presence_penalty",
            display_name="Presence Penalty",
            info="Penalizes new tokens based on whether they appear in the text so far",
            advanced=True,
            value=0.0,
            range_spec=RangeSpec(min=-2, max=2, step=0.1),
        ),
        FloatInput(
            name="frequency_penalty",
            display_name="Frequency Penalty",
            info="Penalizes new tokens based on their frequency in the text so far",
            advanced=True,
            value=0.0,
            range_spec=RangeSpec(min=-2, max=2, step=0.1),
        ),
        BoolInput(
            name="return_citations",
            display_name="Return Citations",
            info="Include citations in the response (enabled by default for sonar models)",
            value=True,
            advanced=False,
        ),
        BoolInput(
            name="format_citations_as_links",
            display_name="Format Citations as Links",
            info="Format citations as clickable markdown links",
            value=True,
            advanced=False,
        ),
        BoolInput(
            name="return_related_questions",
            display_name="Return Related Questions",
            info="Include related follow-up questions in the response",
            value=False,
            advanced=True,
        ),
        BoolInput(
            name="return_images",
            display_name="Return Images",
            info="Include images in search results (when available)",
            value=False,
            advanced=True,
        ),
    ]
    
    outputs = [
        Output(
            display_name="Text Output",
            name="text_output",
            method="get_text_output"
        ),
        Output(
            display_name="Chat Output",
            name="message_output", 
            method="get_message_output"
        ),
    ]
    
    def parse_domain_filter(self) -> List[str]:
        """Parse the domain filter string into a list for the API."""
        if not self.search_domain_filter:
            return []
            
        # Split by comma and clean up each entry
        domains = []
        for domain in self.search_domain_filter.split(','):
            domain = domain.strip()
            if domain:
                # Remove common prefixes that shouldn't be there
                # But preserve the '-' prefix for exclusions
                if domain.startswith('-'):
                    # Exclusion - keep the minus and clean the domain part
                    clean_domain = domain[1:].replace('https://', '').replace('http://', '').replace('www.', '').strip()
                    domains.append(f"-{clean_domain}")
                else:
                    # Inclusion - just clean the domain
                    clean_domain = domain.replace('https://', '').replace('http://', '').replace('www.', '').strip()
                    domains.append(clean_domain)
                    
        return domains
    
    def call_perplexity_api(self, messages: List[Dict], **kwargs) -> Dict:
        """Make a direct API call to Perplexity."""
        api_key = self.api_key
        
        # Prepare the API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Build request payload with proper type conversion
        payload = {
            "model": self.model_name,
            "messages": messages,
            "return_citations": bool(self.return_citations),
            "return_related_questions": bool(self.return_related_questions),
            "return_images": bool(self.return_images),
        }
        
        # Add search domain filter if specified
        domain_filter = self.parse_domain_filter()
        if domain_filter:
            payload["search_domain_filter"] = domain_filter
            print(f"DEBUG: Applying domain filter: {domain_filter}")
            
        # Add search recency filter if specified
        if self.search_recency_filter and self.search_recency_filter != "":
            payload["search_recency_filter"] = self.search_recency_filter
            print(f"DEBUG: Applying recency filter: {self.search_recency_filter}")
        
        # Add numeric parameters with proper type conversion
        # Temperature
        if self.temperature is not None:
            try:
                payload["temperature"] = float(self.temperature)
            except (ValueError, TypeError):
                payload["temperature"] = 0.7  # Default
                
        # Top P
        if self.top_p is not None:
            try:
                payload["top_p"] = float(self.top_p)
            except (ValueError, TypeError):
                payload["top_p"] = 0.9  # Default
                
        # Max tokens
        if self.max_tokens is not None:
            try:
                payload["max_tokens"] = int(self.max_tokens)
            except (ValueError, TypeError):
                payload["max_tokens"] = 1024  # Default
                
        # Frequency penalty
        if self.frequency_penalty is not None:
            try:
                payload["frequency_penalty"] = float(self.frequency_penalty)
            except (ValueError, TypeError):
                payload["frequency_penalty"] = 0.0  # Default
                
        # Presence penalty
        if self.presence_penalty is not None:
            try:
                payload["presence_penalty"] = float(self.presence_penalty)
            except (ValueError, TypeError):
                payload["presence_penalty"] = 0.0  # Default
        
        # Add top_k only if specified and valid (not all models support it)
        if self.top_k is not None:
            try:
                top_k_value = int(self.top_k)
                if top_k_value > 0:
                    payload["top_k"] = top_k_value
            except (ValueError, TypeError):
                pass  # Skip if can't convert
            
        # Remove None values and empty strings
        payload = {k: v for k, v in payload.items() if v is not None and v != ""}
        
        # Debug: Print the final payload (can be commented out in production)
        print(f"DEBUG: Sending payload to Perplexity API: {json.dumps(payload, indent=2)}")
        
        try:
            # Make the API request
            with httpx.Client() as client:
                response = client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                response.raise_for_status()
                result = response.json()
                
                # Debug: Print citations if present
                if 'citations' in result:
                    print(f"DEBUG: Found {len(result['citations'])} citations in API response")
                    
                return result
        except httpx.HTTPError as e:
            error_msg = f"Perplexity API error: {str(e)}"
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                error_msg += f" - Response: {e.response.text}"
            raise ValueError(error_msg)
        except Exception as e:
            raise ValueError(f"Error calling Perplexity API: {str(e)}")
    
    def format_citations_as_markdown(self, content: str, citations: List[Any]) -> str:
        """Format citations as clickable markdown links with page titles."""
        if not citations or not self.format_citations_as_links:
            return content
            
        # Check if content already has citation markers like [1], [2], etc.
        has_markers = bool(re.findall(r'\[\d+\]', content))
        
        formatted_content = content
        
        # Add a sources section
        formatted_content += "\n\n### 📚 Sources\n"
        
        # Add note about domain filtering if filter was applied
        if self.search_domain_filter:
            domain_filter = self.parse_domain_filter()
            included = [d for d in domain_filter if not d.startswith('-')]
            excluded = [d[1:] for d in domain_filter if d.startswith('-')]
            
            if included:
                formatted_content += f"*Searched only: {', '.join(included)}*\n"
            if excluded:
                formatted_content += f"*Excluded: {', '.join(excluded)}*\n"
            formatted_content += "\n"
        
        for i, citation in enumerate(citations, 1):
            # Try to extract title and URL from citation
            url = None
            title = None
            
            if isinstance(citation, dict):
                # If citation is a dict, look for url and title fields
                url = citation.get('url', '') or citation.get('link', '')
                title = citation.get('title', '') or citation.get('name', '') or citation.get('snippet', '')
            elif isinstance(citation, str):
                # If citation is just a URL string
                url = citation
                
            # If we have a URL but no title, try to extract a title from the URL
            if url and not title:
                # Try to extract a meaningful title from the URL
                # Remove protocol and www
                clean_url = url.replace('https://', '').replace('http://', '').replace('www.', '')
                
                # Try to get the page name from the path
                if '/' in clean_url:
                    parts = clean_url.split('/')
                    # Get domain
                    domain = parts[0]
                    # Get last meaningful part of path
                    path_parts = [p for p in parts[1:] if p and not p.startswith('?')]
                    
                    if path_parts:
                        # Special handling for common sites
                        if 'wikipedia.org' in domain:
                            # For Wikipedia, use the article name
                            if 'wiki/' in url:
                                title = path_parts[-1].replace('_', ' ')
                            else:
                                title = f"Wikipedia: {path_parts[-1].replace('_', ' ')}"
                        elif 'arxiv.org' in domain:
                            # For arXiv, show paper ID
                            title = f"arXiv: {path_parts[-1]}"
                        elif 'github.com' in domain:
                            # For GitHub, show repo name
                            if len(path_parts) >= 2:
                                title = f"GitHub: {path_parts[0]}/{path_parts[1]}"
                            else:
                                title = f"GitHub: {path_parts[0]}"
                        elif 'stackoverflow.com' in domain:
                            # For StackOverflow, try to get question title
                            title = "StackOverflow: " + (path_parts[-1] if path_parts else "Question")
                        else:
                            # For other sites, use the last path segment
                            last_part = path_parts[-1]
                            # Clean up common file extensions
                            last_part = last_part.replace('.html', '').replace('.php', '').replace('.aspx', '')
                            # Replace hyphens and underscores with spaces
                            last_part = last_part.replace('-', ' ').replace('_', ' ')
                            # Capitalize words
                            title = ' '.join(word.capitalize() for word in last_part.split())
                    else:
                        # If no path, use domain
                        title = domain.split('.')[0].capitalize()
                else:
                    # Just domain, no path
                    title = clean_url.split('.')[0].capitalize()
                    
            # Final fallback if still no title
            if not title:
                title = f"Source {i}"
                
            # Format the citation
            if url:
                # Clean up title if it's too long
                if len(title) > 100:
                    title = title[:97] + "..."
                    
                # Format based on whether we have numbered references in text
                if has_markers:
                    formatted_content += f"[{i}] [{title}]({url})\n"
                else:
                    formatted_content += f"• [{title}]({url})\n"
            else:
                # No URL, just show the title or text
                if has_markers:
                    formatted_content += f"[{i}] {title or citation}\n"
                else:
                    formatted_content += f"• {title or citation}\n"
                        
        return formatted_content
    
    def format_related_questions(self, related_questions: List[str]) -> str:
        """Format related questions as a nice section."""
        if not related_questions:
            return ""
            
        formatted = "\n\n### 💡 Related Questions\n"
        for question in related_questions:
            formatted += f"• {question}\n"
        return formatted
    
    def format_images(self, images: List[Dict]) -> str:
        """Format images if included in the response."""
        if not images:
            return ""
            
        formatted = "\n\n### 🖼️ Related Images\n"
        for img in images:
            if isinstance(img, dict):
                url = img.get('url', '')
                caption = img.get('caption', '') or img.get('alt', '')
                if url:
                    if caption:
                        formatted += f"• ![{caption}]({url})\n"
                    else:
                        formatted += f"• ![Image]({url})\n"
        return formatted
    
    def process_message(self, input_value: Any) -> Message:
        """Process the input and generate a response with citations."""
        # Extract the actual message text
        user_message = ""
        
        if isinstance(input_value, Message):
            user_message = input_value.text
        elif isinstance(input_value, dict):
            user_message = input_value.get('text', '') or input_value.get('content', '') or str(input_value)
        elif isinstance(input_value, str):
            user_message = input_value
        elif hasattr(input_value, 'text'):
            user_message = input_value.text
        elif input_value is not None:
            user_message = str(input_value)
            
        # If still no message, check if input_message has a value
        if not user_message and hasattr(self, 'input_message'):
            if isinstance(self.input_message, Message):
                user_message = self.input_message.text
            elif isinstance(self.input_message, str):
                user_message = self.input_message
            elif self.input_message:
                user_message = str(self.input_message)
        
        if not user_message:
            raise ValueError("No input message provided")
            
        # Build messages array for API
        messages = []
        
        # Add system message if provided
        if self.system_message:
            messages.append({
                "role": "system",
                "content": self.system_message
            })
            
        # Add user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call Perplexity API
        api_response = self.call_perplexity_api(messages)
        
        # Extract the response content
        if 'choices' in api_response and len(api_response['choices']) > 0:
            choice = api_response['choices'][0]
            content = choice.get('message', {}).get('content', '')
            
            # Extract citations if present
            citations = api_response.get('citations', [])
            
            # Extract images if present
            images = api_response.get('images', [])
            
            # Format citations as markdown links if enabled
            if citations and self.format_citations_as_links:
                content = self.format_citations_as_markdown(content, citations)
                
            # Add images if present
            if images and self.return_images:
                content += self.format_images(images)
                
            # Add related questions if enabled and present
            if self.return_related_questions:
                related_questions = api_response.get('related_questions', [])
                if related_questions:
                    content += self.format_related_questions(related_questions)
            
            # Create the Message object with metadata
            message = Message(
                text=content,
                sender_name="Perplexity",
                metadata={
                    "model": self.model_name,
                    "citations": citations,
                    "domain_filter": self.parse_domain_filter(),
                    "recency_filter": self.search_recency_filter,
                    "images": images,
                    "usage": api_response.get('usage', {}),
                    "id": api_response.get('id', ''),
                    "related_questions": api_response.get('related_questions', [])
                }
            )
            
            # Store for output methods
            self.last_message = message
            
            return message
        else:
            raise ValueError("No response from Perplexity API")
    
    def build_model(self) -> Any:
        """Build model is required by LCModelComponent but we'll handle the API call directly."""
        # Return self as we're handling the API calls directly
        return self
    
    def run_model(self, *args, **kwargs) -> Message:
        """Main execution method that processes input and returns response."""
        # Extract input from various possible sources
        input_value = None
        
        # Check args
        if args:
            input_value = args[0]
        # Check kwargs
        elif 'input' in kwargs:
            input_value = kwargs['input']
        elif 'message' in kwargs:
            input_value = kwargs['message']
        elif 'input_message' in kwargs:
            input_value = kwargs['input_message']
        # Check instance attribute
        elif hasattr(self, 'input_message') and self.input_message:
            input_value = self.input_message
            
        if input_value is None:
            raise ValueError("No input provided to process")
            
        return self.process_message(input_value)
    
    def get_message_output(self) -> Message:
        """Return the message for the Chat Output."""
        if hasattr(self, 'last_message'):
            return self.last_message
        
        # If no stored message, run the model
        if hasattr(self, 'input_message') and self.input_message:
            return self.run_model(self.input_message)
        else:
            # Return empty message if no input
            return Message(text="No input provided", sender_name="Perplexity")
    
    def get_text_output(self) -> str:
        """Return just the text for the Text Output."""
        message = self.get_message_output()
        return message.text
    
    def invoke(self, input: Union[str, Message, Dict], config: Optional[Dict] = None) -> Message:
        """Process input and return response with formatted citations."""
        return self.process_message(input)
    
    async def ainvoke(self, input: Union[str, Message, Dict], config: Optional[Dict] = None) -> Message:
        """Async version of invoke."""
        # For now, just call the sync version
        # You could make this truly async with httpx.AsyncClient if needed
        return self.invoke(input, config)