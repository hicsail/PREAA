===
FAQ
===

What Models Can I Use?
======================

LangFlow provides out-of-the-box support for many models/model providers. Some of the most commonly
used ones are listed below.

* Amazon Bedrock
* Anthropic
* Azure
* DeepSeek
* Gemini
* Hugging Face
* Ollama
* OpenAI
* Many more

For more information on the models supported, you can visit
`LangFlow's documentation <https://docs.langflow.org/components-models>`_. Additionally, through custom
components, addition models can be added in as needed.

How is Authentication Handled?
==============================

Currently each component has its own form of authentication. A breakdown of the authentication method
for each of the core components is shown.

LangFlow
--------

* User signup against the page, requires admin confirmation before access is granted
* Allows user permission between admin and super user
* Each user has their own environment with different flows, credentials, etc
* No SSO at the moment, feature in progress

LiteLLM
-------

* User signup against the page
* Can invite users to the platform
* Can organize users based on "teams" to control what user has access to what models
* No SSO, enterprise feature and costs money

LibreChat
---------

* Multiple login providers supported
* Supports Azure Entra for BU login

LangFuse
--------
* User signup against the page
* Can invite users to a project within langfuse
* SSO supported, including Azure Entra
