import { Test, TestingModule } from '@nestjs/testing';
import { LangflowMappingService } from './langflow-mapping.service';
import { getModelToken } from '@nestjs/mongoose';
import { LangFlowMapping, LangFlowMappingDocument } from './langflow-mapping.schema';
import { Model } from 'mongoose';
import { CreateLangFlowMapping } from './dtos/create.dto';
import { UpdateLangFlowMapping } from './dtos/update.dto';

describe('LangflowMappingService', () => {
  let service: LangflowMappingService;
  let model: Model<LangFlowMappingDocument>;

  const mockLangFlowMappingModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LangflowMappingService,
        {
          provide: getModelToken(LangFlowMapping.name),
          useValue: mockLangFlowMappingModel,
        },
      ],
    }).compile();

    service = module.get<LangflowMappingService>(LangflowMappingService);
    model = module.get<Model<LangFlowMappingDocument>>(
      getModelToken(LangFlowMapping.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return a single model mapping by name', async () => {
      const mockMapping = {
        model: 'testModel',
        url: 'http://example.com/flow/123',
        historyComponentID: 'component123',
      };

      mockLangFlowMappingModel.findOne.mockResolvedValue(mockMapping);

      const result = await service.get('testModel');
      
      expect(mockLangFlowMappingModel.findOne).toHaveBeenCalledWith({ model: 'testModel' });
      expect(result).toEqual(mockMapping);
    });

    it('should return null if no model is found', async () => {
      mockLangFlowMappingModel.findOne.mockResolvedValue(null);

      const result = await service.get('nonExistentModel');
      
      expect(mockLangFlowMappingModel.findOne).toHaveBeenCalledWith({ model: 'nonExistentModel' });
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all model mappings', async () => {
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
      ];

      mockLangFlowMappingModel.find.mockResolvedValue(mockMappings);

      const result = await service.getAll();
      
      expect(mockLangFlowMappingModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockMappings);
    });
  });

  describe('create', () => {
    it('should create a new model mapping', async () => {
      const createDto: CreateLangFlowMapping = {
        model: 'newModel',
        url: 'http://example.com/flow/new',
        historyComponentID: 'componentNew',
      };

      const createdMapping = { ...createDto };
      mockLangFlowMappingModel.create.mockResolvedValue(createdMapping);

      const result = await service.create(createDto);
      
      expect(mockLangFlowMappingModel.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdMapping);
    });
  });

  describe('update', () => {
    it('should update an existing model mapping', async () => {
      const updateDto: UpdateLangFlowMapping = {
        model: 'existingModel',
        url: 'http://example.com/flow/updated',
        historyComponentID: 'componentUpdated',
      };

      const updatedMapping = { ...updateDto };
      mockLangFlowMappingModel.findOneAndUpdate.mockResolvedValue(updatedMapping);

      const result = await service.update(updateDto);
      
      expect(mockLangFlowMappingModel.findOneAndUpdate).toHaveBeenCalledWith(
        { model: 'existingModel' },
        updateDto,
        { new: true, upsert: true },
      );
      expect(result).toEqual(updatedMapping);
    });

    it('should create a new mapping if model does not exist (upsert)', async () => {
      const updateDto: UpdateLangFlowMapping = {
        model: 'nonExistentModel',
        url: 'http://example.com/flow/new',
        historyComponentID: 'componentNew',
      };

      const newMapping = { ...updateDto };
      mockLangFlowMappingModel.findOneAndUpdate.mockResolvedValue(newMapping);

      const result = await service.update(updateDto);
      
      expect(mockLangFlowMappingModel.findOneAndUpdate).toHaveBeenCalledWith(
        { model: 'nonExistentModel' },
        updateDto,
        { new: true, upsert: true },
      );
      expect(result).toEqual(newMapping);
    });
  });

  describe('delete', () => {
    it('should delete a model mapping', async () => {
      mockLangFlowMappingModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.delete('modelToDelete');
      
      expect(mockLangFlowMappingModel.deleteOne).toHaveBeenCalledWith({ model: 'modelToDelete' });
    });

    it('should not throw error if model to delete does not exist', async () => {
      mockLangFlowMappingModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.delete('nonExistentModel')).resolves.not.toThrow();
      
      expect(mockLangFlowMappingModel.deleteOne).toHaveBeenCalledWith({ model: 'nonExistentModel' });
    });
  });
}); 