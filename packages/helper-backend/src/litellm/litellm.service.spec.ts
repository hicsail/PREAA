import { Test, TestingModule } from '@nestjs/testing';
import { LiteLLMService } from './litellm.service';
import { CompletionResponse } from './dtos/litellm.dto';

describe('LiteLLMService', () => {
  let service: LiteLLMService;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    // Mock the global fetch function
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [LiteLLMService]
    }).compile();

    service = module.get<LiteLLMService>(LiteLLMService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('completion', () => {
    it('should transform messages correctly and call the API', async () => {
      // Mock data
      const model = 'llama3.1';
      const apiKey = 'test-api-key';
      const url = 'http://example.com/api';
      const body = {
        messages: [
          { role: 'user', text: 'Hello world' }
        ]
      };

      // Mock the API response
      const mockResponse = {
        id: 'response-id',
        created: 1620000000,
        model: 'llama3.1',
        object: 'chat.completion',
        choices: [
          {
            finish_reason: 'stop',
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you today?'
            }
          }
        ],
        usage: {
          completion_tokens: 10,
          prompt_tokens: 5,
          total_tokens: 15,
          completion_tokens_details: {},
          prompt_tokens_details: {}
        }
      };

      // Setup the fetch mock
      fetchMock.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      // Call the method
      const result = await service.completion(model, apiKey, url, body);

      // Assertions
      expect(fetchMock).toHaveBeenCalledWith(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          ...body,
          model,
          messages: [
            { role: 'user', text: 'Hello world', content: 'Hello world' }
          ]
        })
      });

      // Verify the result is correctly transformed
      expect(result).toEqual({
        ...mockResponse,
        text: 'Hello! How can I help you today?'
      });
    });

    it('should handle API errors properly', async () => {
      // Mock data
      const model = 'llama3.1';
      const apiKey = 'test-api-key';
      const url = 'http://example.com/api';
      const body = {
        messages: [
          { role: 'user', text: 'Hello world' }
        ]
      };

      // Setup the fetch mock to throw an error
      fetchMock.mockRejectedValueOnce(new Error('API error'));

      // Call the method and expect it to throw
      await expect(service.completion(model, apiKey, url, body)).rejects.toThrow('API error');
    });

    it('should handle malformed API responses', async () => {
      // Mock data
      const model = 'llama3.1';
      const apiKey = 'test-api-key';
      const url = 'http://example.com/api';
      const body = {
        messages: [
          { role: 'user', text: 'Hello world' }
        ]
      };

      // Setup the fetch mock to return a malformed response
      fetchMock.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({
          // Missing required fields
          id: 'response-id',
          created: 1620000000,
          // No choices array
        })
      });

      // Call the method and expect it to throw (attempting to access undefined choices[0])
      await expect(service.completion(model, apiKey, url, body)).rejects.toThrow();
    });
  });
}); 