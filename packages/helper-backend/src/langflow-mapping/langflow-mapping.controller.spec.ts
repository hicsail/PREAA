import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TestingModule, Test } from '@nestjs/testing';
import { LangflowMappingService } from './langflow-mapping.service';
import { LangflowMappingController } from './langflow-mapping.controller';
import { LangFlowMapping } from './langflow-mapping.schema';
import { NotFoundException } from '@nestjs/common';

const sampleMapping: LangFlowMapping = {
  _id: '6401234567890abcdef12345',
  model: 'chatgpt-4o',
  url: 'temp',
  historyComponentID: '5',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('LangFlowMappingController', () => {
  let controller: LangflowMappingController;
  let service: DeepMocked<LangflowMappingService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LangflowMappingController],
      providers: [{ provide: LangflowMappingService, useValue: createMock<LangflowMappingService>() }]
    }).compile();

    controller = module.get<LangflowMappingController>(LangflowMappingController);
    service = module.get(LangflowMappingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw an error trying to get a non-existant model', async () => {
    service.get.mockResolvedValue(null);

    await expect(controller.get('temp')).rejects.toThrow(NotFoundException);
  });
});
