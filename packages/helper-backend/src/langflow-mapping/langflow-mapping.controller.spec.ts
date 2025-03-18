import { Test, TestingModule } from '@nestjs/testing';
import { LangflowMappingController } from './langflow-mapping.controller';
import { LangflowMappingService } from './langflow-mapping.service';
import { NotFoundException } from '@nestjs/common';
import { CreateLangFlowMapping } from './dtos/create.dto';
import { UpdateLangFlowMapping } from './dtos/update.dto';
import { LangFlowMapping } from './langflow-mapping.schema';

describe('LangflowMappingController', () => {
  let controller: LangflowMappingController;
  let service: LangflowMappingService;

  // Mock the service
  const mockLangflowMappingService = {
    get: jest.fn(),
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LangflowMappingController],
      providers: [
        {
          provide: LangflowMappingService,
          useValue: mockLangflowMappingService,
        },
      ],
    }).compile();

    controller = module.get<LangflowMappingController>(LangflowMappingController);
    service = module.get<LangflowMappingService>(LangflowMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new model mapping', async () => {
      const createDto: CreateLangFlowMapping = {
        model: 'newModel',
        url: 'http://example.com/flow/123',
        historyComponentID: 'component123',
      };

      const expectedResult = {
        ...createDto,
      } as LangFlowMapping;

      mockLangflowMappingService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('get', () => {
    it('should return a single model mapping', async () => {
      const model = 'testModel';
      const mockMapping = {
        model,
        url: 'http://example.com/flow/123',
        historyComponentID: 'component123',
      } as LangFlowMapping;

      mockLangflowMappingService.get.mockResolvedValue(mockMapping);

      const result = await controller.get(model);

      expect(service.get).toHaveBeenCalledWith(model);
      expect(result).toEqual(mockMapping);
    });

    it('should throw NotFoundException if model not found', async () => {
      const model = 'nonExistentModel';
      mockLangflowMappingService.get.mockResolvedValue(null);

      await expect(controller.get(model)).rejects.toThrow(NotFoundException);
      expect(service.get).toHaveBeenCalledWith(model);
    });
  });

  describe('getAll', () => {
    it('should return an array of model mappings', async () => {
      const mockMappings = [
        {
          model: 'model1',
          url: 'http://example.com/flow/123',
          historyComponentID: 'component123',
        },
        {
          model: 'model2',
          url: 'http://example.com/flow/456',
          historyComponentID: 'component456',
        },
      ] as LangFlowMapping[];

      mockLangflowMappingService.getAll.mockResolvedValue(mockMappings);

      const result = await controller.getAll();

      expect(service.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockMappings);
    });
  });

  describe('update', () => {
    it('should update an existing model mapping', async () => {
      const updateDto: UpdateLangFlowMapping = {
        model: 'existingModel',
        url: 'http://example.com/flow/updated',
        historyComponentID: 'componentUpdated',
      };

      const updatedMapping = {
        ...updateDto,
      } as LangFlowMapping;

      mockLangflowMappingService.update.mockResolvedValue(updatedMapping);

      const result = await controller.update(updateDto);

      expect(service.update).toHaveBeenCalledWith(updateDto);
      expect(result).toEqual(updatedMapping);
    });

    it('should throw NotFoundException if update fails', async () => {
      const updateDto: UpdateLangFlowMapping = {
        model: 'nonExistentModel',
        url: 'http://example.com/flow/new',
        historyComponentID: ''
      };

      mockLangflowMappingService.update.mockResolvedValue(null);

      await expect(controller.update(updateDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('delete', () => {
    it('should delete a model mapping', async () => {
      const model = 'modelToDelete';
      mockLangflowMappingService.delete.mockResolvedValue(undefined);

      await controller.delete(model);

      expect(service.delete).toHaveBeenCalledWith(model);
    });
  });
}); 