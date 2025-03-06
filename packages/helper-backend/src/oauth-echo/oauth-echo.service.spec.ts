import { Test, TestingModule } from '@nestjs/testing';
import { OauthEchoService } from './oauth-echo.service';

describe('OauthEchoService', () => {
  let service: OauthEchoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OauthEchoService],
    }).compile();

    service = module.get<OauthEchoService>(OauthEchoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
