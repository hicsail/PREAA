import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyController } from './deepchat-proxy.controller';
import { createMock } from '@golevelup/ts-jest';
import { DeepchatProxyService } from './deepchat-proxy.service';

describe('DeepchatProxyController', () => {
  let controller: DeepchatProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeepchatProxyController],
      providers: [
        { provide: DeepchatProxyService, useValue: createMock<DeepchatProxyService>() }
      ]
    }).compile();

    controller = module.get<DeepchatProxyController>(DeepchatProxyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
