import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyController } from './deepchat-proxy.controller';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { NotFoundException } from '@nestjs/common';
import { DeepchatProxy } from './deepchat-proxy.schema';
import { ProxyCompletion } from './dtos/proxy-completion.dto';
import { CompletionResponse } from '../litellm/dtos/litellm.dto';

// Manually defining interfaces to match what's expected in the tests 
// to avoid dependency on actual implementation
interface Message {
  role: string;
  content: string;
  text?: string;
}

describe('DeepchatProxyController', () => {
  let controller: DeepchatProxyController;
  let service: DeepchatProxyService;

  const mockDeepchatProxyService = {
    get: jest.fn(),
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    proxyRequest: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeepchatProxyController],
      providers: [
        {
          provide: DeepchatProxyService,
          useValue: mockDeepchatProxyService
        }
      ]
    }).compile();

    controller = module.get<DeepchatProxyController>(DeepchatProxyController);
    service = module.get<DeepchatProxyService>(DeepchatProxyService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get', () => {
    it('should return a single model by ID', async () => {
      const modelId = 'test-id-123';
      const mockModel: DeepchatProxy = {
        model: 'testModel',
        url: 'http://example.com/api',
        apiKey: 'test-api-key'
      };

      mockDeepchatProxyService.get.mockResolvedValue(mockModel);

      const result = await controller.get(modelId);

      expect(service.get).toHaveBeenCalledWith(modelId);
      expect(result).toEqual(mockModel);
    });

    it('should throw NotFoundException if model not found', async () => {
      const modelId = 'non-existent-id';
      mockDeepchatProxyService.get.mockResolvedValue(null);

      await expect(controller.get(modelId)).rejects.toThrow(NotFoundException);
      expect(service.get).toHaveBeenCalledWith(modelId);
    });
  });

  describe('getAll', () => {
    it('should return all models', async () => {
      const mockModels: DeepchatProxy[] = [
        {
          model: 'model1',
          url: 'http://example.com/api/1',
          apiKey: 'api-key-1'
        },
        {
          model: 'model2',
          url: 'http://example.com/api/2',
          apiKey: 'api-key-2'
        }
      ];

      mockDeepchatProxyService.getAll.mockResolvedValue(mockModels);

      const result = await controller.getAll();

      expect(service.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockModels);
    });
  });

  describe('create', () => {
    it('should create a new model', async () => {
      const newModel: DeepchatProxy = {
        model: 'newModel',
        url: 'http://example.com/api/new',
        apiKey: 'new-api-key'
      };

      const createdModel = { ...newModel };
      mockDeepchatProxyService.create.mockResolvedValue(createdModel);

      const result = await controller.create(newModel);

      expect(service.create).toHaveBeenCalledWith(newModel);
      expect(result).toEqual(createdModel);
    });
  });

  describe('update', () => {
    it('should update an existing model', async () => {
      const modelId = 'model-id-123';
      const updateData: DeepchatProxy = {
        model: 'updatedModel',
        url: 'http://example.com/api/updated',
        apiKey: 'updated-api-key'
      };

      const updatedModel = { ...updateData };
      mockDeepchatProxyService.update.mockResolvedValue(updatedModel);

      const result = await controller.update(modelId, updateData);

      expect(service.update).toHaveBeenCalledWith(modelId, updateData);
      expect(result).toEqual(updatedModel);
    });

    it('should throw NotFoundException if update fails', async () => {
      const modelId = 'non-existent-id';
      const updateData: DeepchatProxy = {
        model: 'updatedModel',
        url: 'http://example.com/api/updated',
        apiKey: 'updated-api-key'
      };

      mockDeepchatProxyService.update.mockResolvedValue(null);

      await expect(controller.update(modelId, updateData)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(modelId, updateData);
    });
  });

  describe('delete', () => {
    it('should delete a model', async () => {
      const model = 'modelToDelete';
      mockDeepchatProxyService.delete.mockResolvedValue(undefined);

      await controller.delete(model);

      expect(service.delete).toHaveBeenCalledWith(model);
    });
  });

  describe('proxyRequest', () => {
    it('should proxy request to the LiteLLM service', async () => {
      const modelId = 'model-id-123';
      const requestBody: ProxyCompletion = {
        messages: [
          { role: 'user', text: 'Hello' }
        ]
      };

      const mockResponse: CompletionResponse = {
        id: 'response-id',
        created: 1620000000,
        model: 'testModel',
        object: 'chat.completion',
        choices: [
          {
            finish_reason: 'stop',
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
              text: 'Hello! How can I help you?'
            }
          }
        ],
        usage: {
          completion_tokens: 10,
          prompt_tokens: 5,
          total_tokens: 15,
          completion_tokens_details: {},
          prompt_tokens_details: {}
        },
        text: 'Hello! How can I help you?'
      };

      mockDeepchatProxyService.proxyRequest.mockResolvedValue(mockResponse);

      const result = await controller.proxyRequest(requestBody, modelId);

      expect(service.proxyRequest).toHaveBeenCalledWith(modelId, requestBody);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate exceptions from the service', async () => {
      const modelId = 'non-existent-id';
      const requestBody: ProxyCompletion = {
        messages: [
          { role: 'user', text: 'Hello' }
        ]
      };

      mockDeepchatProxyService.proxyRequest.mockRejectedValue(
        new NotFoundException(`No model ${modelId} found`)
      );

      await expect(controller.proxyRequest(requestBody, modelId)).rejects.toThrow(NotFoundException);
      expect(service.proxyRequest).toHaveBeenCalledWith(modelId, requestBody);
    });
  });
});
