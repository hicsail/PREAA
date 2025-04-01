import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { getModelToken } from '@nestjs/mongoose';
import { DeepchatProxy } from './deepchat-proxy.schema';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import mongoose, { model } from 'mongoose';
import { LiteLLMService } from '../litellm/litellm.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const sampleModel = {
  _id: new mongoose.Types.ObjectId('6401234567890abcdef12345'),
 model: 'gpt-4o',
 url: 'temp',
 apiKey: 'temp'
};

const sampleModel2 = {
  _id: new mongoose.Types.ObjectId('6401234567890abcdef12345'),
 model: 'gpt-4o',
 url: 'temp',
 apiKey: 'temp'
};

describe('DeepchatService', () => {
  let service: DeepchatProxyService;

  let model = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn()
  };

  let litellm: DeepMocked<LiteLLMService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeepchatProxyService,
        { provide: getModelToken(DeepchatProxy.name), useValue: model },
        { provide: LiteLLMService, useValue: createMock<LiteLLMService> }
      ]
    }).compile();

    service = module.get<DeepchatProxyService>(DeepchatProxyService);
    litellm = module.get(LiteLLMService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get model without API field', async () => {
    model.exec.mockResolvedValue(sampleModel);

    const result = await service.get('anything');
    expect(result).toMatchObject({
      ...sampleModel,
      _id: sampleModel._id.toString(),
      apiKey: undefined
    });
  });

  it('should get multiple models without API fields', async () => {
    const models = [sampleModel, sampleModel2];
    model.exec.mockResolvedValue([sampleModel, sampleModel2]);
    const expectedResults = models.map((example) => ({
      ...example,
      _id: example._id.toString(),
      apiKey: undefined
    }));

    const result = await service.getAll();
    expect(result).toMatchObject(expectedResults);
  });

  it('should block having duplicate models', async () => {
    // Model finding an existing model
    model.exec.mockResolvedValue(sampleModel);

    // Make sure an exception is thrown
    await expect(service.create(sampleModel)).rejects.toThrow(BadRequestException);
  });

  it('should allow making a new, valid model', async () => {
    // Represent not finding an existing model
    model.exec.mockResolvedValue(null);

    // Mock the created value
    model.create.mockResolvedValue(sampleModel);

    const result = await service.create(sampleModel);
    expect(result).toMatchObject({
      ...sampleModel,
      _id: sampleModel._id.toString(),
      apiKey: undefined
    });
  });

  it('should not allow you to update a model to have the same name', async () => {
    model.exec.mockResolvedValue(sampleModel);

    await expect(service.update(sampleModel._id.toString(), sampleModel)).rejects.toThrow(BadRequestException);
  });

  it('should return back the update model', async () => {
    model.exec.mockResolvedValue(null);
    model.findOneAndUpdate.mockResolvedValue(sampleModel);

    const result = await service.update('anything', sampleModel);
    expect(result).toMatchObject({
      ...sampleModel,
      _id: sampleModel._id.toString(),
      apiKey: undefined
    });
  });

  it('should throw an error on an invalid proxy request', async () => {
    model.exec.mockResolvedValue(null);

    await expect(service.proxyRequest('anything', null)).rejects.toThrow(NotFoundException);
  });

  it('should pass on valid proxy request', async () => {
    model.exec.mockResolvedValue(sampleModel);
    litellm.completion = jest.fn();

    await service.proxyRequest('anything', null);

    expect(litellm.completion).toHaveBeenCalled();
  });
});
