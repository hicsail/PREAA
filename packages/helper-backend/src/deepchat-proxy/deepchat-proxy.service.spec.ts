import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { getModelToken } from '@nestjs/mongoose';
import { DeepchatProxy } from './deepchat-proxy.schema';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import mongoose from 'mongoose';
import { LiteLLMService } from '../litellm/litellm.service';

const sampleModel = {
  _id: new mongoose.Types.ObjectId('6401234567890abcdef12345'),
 model: 'gpt-4o',
 url: 'temp',
 apiKey: 'temp'
};

describe('DeepchatSerivce', () => {
  let service: DeepchatProxyService;

  let model = {
    findOne: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn()
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

  it('should get model', async () => {
    model.exec.mockResolvedValue(sampleModel);

    const result = await service.get('anything');
    expect(result).toMatchObject({
      ...sampleModel,
      _id: sampleModel._id.toString(),
      apiKey: undefined
    });
  })
});
