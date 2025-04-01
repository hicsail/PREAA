import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyController } from './deepchat-proxy.controller';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { NotFoundException } from '@nestjs/common';
import { DeepchatProxy } from './deepchat-proxy.schema';
import mongoose from 'mongoose';
import { ProxyCompletion } from './dtos/proxy-completion.dto';
import { CompletionResponse } from 'src/litellm/dtos/litellm.dto';

const sampleProxy: DeepchatProxy = {
  _id: new mongoose.Types.ObjectId('6401234567890abcdef12345'),
  model: 'chatGPT',
  url: 'http://example.com',
  apiKey: 'test key'
};

const sampleCompletionRequest: ProxyCompletion = {
  messages: [{ role: 'user', text: 'Hello!' }]
};

const sampleCompletionResponse: CompletionResponse = {
  id: 'sample',
  created: 1,
  model: 'chatGPT',
  object: 'hi',
  choices: [{ finish_reason: 'stop', index: 0, message: { role: 'user', text: 'hi', content: 'hi' } }],
  usage: {
    completion_tokens: 1,
    prompt_tokens: 1,
    total_tokens: 2,
    completion_tokens_details: {},
    prompt_tokens_details: {}
  },
  text: 'hi'
};

describe('DeepchatProxyController', () => {
  let controller: DeepchatProxyController;
  let service: DeepMocked<DeepchatProxyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeepchatProxyController],
      providers: [{ provide: DeepchatProxyService, useValue: createMock<DeepchatProxyService>() }]
    }).compile();

    controller = module.get<DeepchatProxyController>(DeepchatProxyController);
    service = module.get(DeepchatProxyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw not found if mapping does not exist', async () => {
    service.get.mockResolvedValue(null);

    await expect(controller.get('anything')).rejects.toThrow(NotFoundException);
  });

  it('should return mapping if found', async () => {
    service.get.mockResolvedValue(sampleProxy);

    await expect(controller.get('anything')).resolves.toBe(sampleProxy);
  });

  it('should get all mappings', async () => {
    service.getAll.mockResolvedValue([sampleProxy]);

    await expect(controller.getAll()).resolves.toStrictEqual([sampleProxy]);
  });

  it('should throw an error trying to update non-existing model', async () => {
    service.update.mockResolvedValue(null);

    await expect(controller.update('test', sampleProxy)).rejects.toThrow(NotFoundException);
  });

  it('should return updated model', async () => {
    service.update.mockResolvedValue(sampleProxy);

    await expect(controller.update('test', sampleProxy)).resolves.toBe(sampleProxy);
  });

  it('should create new models', async () => {
    service.create.mockResolvedValue(sampleProxy);

    await expect(controller.create(sampleProxy)).resolves.toBe(sampleProxy);
  });

  it('should throw not found on proxy request on non-existing model', async () => {
    service.proxyRequest.mockRejectedValue(new NotFoundException());

    await expect(controller.proxyRequest(sampleCompletionRequest, 'test')).rejects.toThrow(NotFoundException);
  });

  it('should be able to make completion responses', async () => {
    service.proxyRequest.mockResolvedValue(sampleCompletionResponse);

    await expect(controller.proxyRequest(sampleCompletionRequest, 'text')).resolves.toStrictEqual(
      sampleCompletionResponse
    );
  });
});
