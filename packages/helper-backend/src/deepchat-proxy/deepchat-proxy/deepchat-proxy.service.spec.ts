import { Test, TestingModule } from '@nestjs/testing';
import { DeepchatProxyService } from './deepchat-proxy.service';

describe('DeepchatProxyService', () => {
  let service: DeepchatProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeepchatProxyService],
    }).compile();

    service = module.get<DeepchatProxyService>(DeepchatProxyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
