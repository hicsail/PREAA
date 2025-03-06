export class LiteLLMService {

  constructor() {
  }

  async completion(model: string, apiKey: string, url: string, body: any): Promise<Response> {
    body.messages.forEach((message: any) => {
      message.content = message.text;
    });
    body.model = model;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
    });

    // reshape the response
    const responseJson = await response.json();
    responseJson.text = responseJson.choices[0].message.content;
    return responseJson;
  }

}