# LangFlow Custom Components

## Introduction

The LangFlow package contains custom components to be integrated into LangFlow. Custom components can be passed into
a LangFlow container which then makes the components available to the user through the UI.

## Components

### `CompletionInterface`

The `CompletionInterface` provides a ChatGPT like component interface that takes in message history through a JSON object. The component parses the JSON and produces a LangChain `BaseChatMessageHistory` which allows it to integrate with components that typically rely on chat history components. This allows chat history to be passed in via the API rather then relying on a database to keep track of the history.

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

> [!WARNING]  
> LangFlow currently has a bug that induces a circular dependency. Running the tests will result in an exception, therefore testing is currently not supported. You can follow the issue [here](https://github.com/langflow-ai/langflow/issues/6188). A workaround may need to be implemented

## Running

You can reference [LangFlow's Documentation](https://docs.langflow.org/components-custom-components) on custom components to see how to include the desired component in LangFlow. The local deployment defined in this repository automatically includes the custom components in the local LangFlow deployment. Restart the local deployment to see changes reflected in the LangFlow instance.

## Code Formatting

You can verify the Python code format is correct using the following command. Please ensure no formatting issues are thrown before making a PR.

```bash
flake8 custom/ tests/
```

