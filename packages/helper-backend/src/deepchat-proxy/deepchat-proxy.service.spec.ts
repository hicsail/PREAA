import { Test, TestingModule } from "@nestjs/testing";
import { DeepchatProxyService } from "./deepchat-proxy.service";
import { getModelToken } from "@nestjs/mongoose";
import { DeepchatProxy, DeepchatProxyDocument } from "./deepchat-proxy.schema";
import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { Model } from "mongoose";

describe('DeepchatSerivce', () => {
  let service: DeepchatProxyService;
  let model: DeepMocked<Model<DeepchatProxyDocument>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeepchatProxyService,
        { provide: getModelToken(DeepchatProxy.name), useValue: createMock<Model<DeepchatProxyDocument>>() }
      ]
    }).compile();

    service = module.get<DeepchatProxyService>(DeepchatProxyService);
    model = module.get(getModelToken(DeepchatProxy.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
