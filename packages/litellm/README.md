# LiteLLM Custom Components

## Introduction

The LiteLLM package contains custom integrations with LiteLLM. LiteLLM supports having custom LLM providers which can be integrated with the existing LiteLLM proxy.

## Components

### `LangFlow`

The LangFlow component provides an interface for running LangFlow workflows as if they are normal chat completion endpoints. The component handles mapping LiteLLM model names to LangFlow workflows. The component requires two pieces of information to execute the chat completion.

1. The URL of the LangFlow workflow
2. The component ID of the custom chat completion component ([see langflow package for more details](../langflow/README.md) on the component)

## Getting Started

From this directory, run the following.

```bash
pip install -r requirements.txt
```

With the required packages installed, you can test and update the code.

## Testing

Testing the component is possible through `pytest` which is part of the `requirements.txt` file.

```bash
pytest tests/
```

## Running

You can reference [LiteLLM's documentation](https://docs.litellm.ai/docs/providers/custom_llm_server)  on adding in custom LLM providers. The local deployment in this repository by default references the custom provider included here.

## Code Formatting

You can verify the Python code format is correct using the following command. Please ensure no formatting issues are thrown before making a PR.

```bash
flake8 custom/ tests/
```

