import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { getModelToken } from '@nestjs/mongoose';
import { DeepchatProxy, DeepchatProxyDocument } from './deepchat-proxy.schema';
import { Model } from 'mongoose';
import { LiteLLMService } from '../litellm/litellm.service';
import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

jest.mock('class-transformer', () => ({
  plainToInstance: jest.fn((cls, obj) => obj)
}));

describe('DeepchatProxyService', () => {
  let service: DeepchatProxyService;
  let deepchatProxyModel: Model<DeepchatProxyDocument>;
  let liteLLMService: LiteLLMService;

  const mockDeepChatProxyModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn()
  };

  mockDeepChatProxyModel.findOne.mockReturnValue({
    lean: () => mockDeepChatProxyModel,
    exec: () => Promise.resolve()
  });

  mockDeepChatProxyModel.find.mockReturnValue({
    lean: () => mockDeepChatProxyModel,
    exec: () => Promise.resolve([])
  });

  const mockLiteLLMService = {
    completion: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeepchatProxyService,
        {
          provide: getModelToken(DeepchatProxy.name),
          useValue: mockDeepChatProxyModel
        },
        {
          provide: LiteLLMService,
          useValue: mockLiteLLMService
        }
      ]
    }).compile();

    service = module.get<DeepchatProxyService>(DeepchatProxyService);
    deepchatProxyModel = module.get<Model<DeepchatProxyDocument>>(getModelToken(DeepchatProxy.name));
    liteLLMService = module.get<LiteLLMService>(LiteLLMService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return a proxy model by ID', async () => {
      const mockProxy = {
        _id: 'model-id-123',
        model: 'testModel',
        url: 'http://example.com/api',
        apiKey: 'test-api-key'
      };

      mockDeepChatProxyModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProxy)
        })
      });

      const result = await service.get('model-id-123');
      
      expect(mockDeepChatProxyModel.findOne).toHaveBeenCalledWith({ _id: 'model-id-123' });
      expect(plainToInstance).toHaveBeenCalledWith(DeepchatProxy, mockProxy);
      expect(result).toEqual(mockProxy);
    });
  });

  describe('getAll', () => {
    it('should return all proxy models', async () => {
      const mockProxies = [
        {
          _id: 'model-id-1',
          model: 'model1',
          url: 'http://example.com/api/1',
          apiKey: 'api-key-1'
        },
        {
          _id: 'model-id-2',
          model: 'model2',
          url: 'http://example.com/api/2',
          apiKey: 'api-key-2'
        }
      ];

      mockDeepChatProxyModel.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProxies)
        })
      });

      const result = await service.getAll();
      
      expect(mockDeepChatProxyModel.find).toHaveBeenCalled();
      expect(plainToInstance).toHaveBeenCalledWith(DeepchatProxy, mockProxies);
      expect(result).toEqual(mockProxies);
    });
  });

  describe('create', () => {
    it('should create a new proxy model', async () => {
      const newProxy = {
        model: 'newModel',
        url: 'http://example.com/api/new',
        apiKey: 'new-api-key'
      };

      const createdProxy = { 
        _id: 'new-id',
        ...newProxy 
      };

      mockDeepChatProxyModel.create.mockResolvedValue(createdProxy);

      const result = await service.create(newProxy as DeepchatProxy);
      
      expect(mockDeepChatProxyModel.create).toHaveBeenCalledWith(newProxy);
      expect(plainToInstance).toHaveBeenCalledWith(DeepchatProxy, createdProxy);
      expect(result).toEqual(createdProxy);
    });
  });

  describe('update', () => {
    it('should update an existing proxy model', async () => {
      const id = 'model-id-123';
      const updateData = {
        model: 'updatedModel',
        url: 'http://example.com/api/updated',
        apiKey: 'updated-api-key'
      };

      const updatedProxy = { 
        _id: id,
        ...updateData 
      };

      mockDeepChatProxyModel.findOneAndUpdate.mockResolvedValue(updatedProxy);

      const result = await service.update(id, updateData as DeepchatProxy);
      
      expect(mockDeepChatProxyModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: id },
        updateData,
        { new: true, upsert: true }
      );
      expect(plainToInstance).toHaveBeenCalledWith(DeepchatProxy, updatedProxy);
      expect(result).toEqual(updatedProxy);
    });
  });

  describe('delete', () => {
    it('should delete a proxy model', async () => {
      mockDeepChatProxyModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.delete('testModel');
      
      expect(mockDeepChatProxyModel.deleteOne).toHaveBeenCalledWith({ model: 'testModel' });
    });
  });

  describe('proxyRequest', () => {
    it('should proxy the request to the LiteLLM service', async () => {
      const modelId = 'model-id-123';
      const modelData = {
        _id: modelId,
        model: 'testModel',
        url: 'http://example.com/api',
        apiKey: 'test-api-key'
      };

      const requestBody = {
        messages: [{ role: 'user', text: 'Hello' }]
      };

      const completionResponse = {
        id: 'response-id',
        text: 'Hello! How can I help you?',
        choices: [
          {
            message: {
              content: 'Hello! How can I help you?'
            }
          }
        ]
      };

      mockDeepChatProxyModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(modelData)
        })
      });

      mockLiteLLMService.completion.mockResolvedValue(completionResponse);

      const result = await service.proxyRequest(modelId, requestBody);
      
      expect(mockDeepChatProxyModel.findOne).toHaveBeenCalledWith({ _id: modelId });
      expect(mockLiteLLMService.completion).toHaveBeenCalledWith(
        modelData.model,
        modelData.apiKey,
        modelData.url,
        requestBody
      );
      expect(result).toEqual(completionResponse);
    });

    it('should throw NotFoundException if model not found', async () => {
      mockDeepChatProxyModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        })
      });

      await expect(service.proxyRequest('non-existent-id', {})).rejects.toThrow(NotFoundException);
      expect(mockDeepChatProxyModel.findOne).toHaveBeenCalledWith({ _id: 'non-existent-id' });
      expect(mockLiteLLMService.completion).not.toHaveBeenCalled();
    });
  });
}); 