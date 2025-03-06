import { Test, TestingModule } from '@nestjs/testing';
import { OauthEchoController } from './oauth-echo.controller';

describe('OauthEchoController', () => {
  let controller: OauthEchoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OauthEchoController],
    }).compile();

    controller = module.get<OauthEchoController>(OauthEchoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
