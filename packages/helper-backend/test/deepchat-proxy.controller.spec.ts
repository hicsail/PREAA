import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyController } from '../src/deepchat-proxy/deepchat-proxy.controller';

describe('DeepchatProxyController', () => {
  let controller: DeepchatProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeepchatProxyController]
    }).compile();

    controller = module.get<DeepchatProxyController>(DeepchatProxyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
