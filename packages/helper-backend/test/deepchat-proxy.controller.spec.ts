import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyController } from './deepchat-proxy.controller';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { NotFoundException } from '@nestjs/common';
import { DeepchatProxy } from './deepchat-proxy.schema';
import mongoose from 'mongoose';

const sampleProxy: DeepchatProxy = {
  _id: new mongoose.Types.ObjectId('6401234567890abcdef12345'),
  model: 'chatGPT',
  url: 'http://example.com',
  apiKey: 'test key'
};

describe('DeepchatProxyController', () => {
  let controller: DeepchatProxyController;
  let service: DeepMocked<DeepchatProxyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeepchatProxyController],
      providers: [
        { provide: DeepchatProxyService, useValue: createMock<DeepchatProxyService>() }
      ]
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
});
