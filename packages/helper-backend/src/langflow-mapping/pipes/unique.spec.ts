import { Test, TestingModule } from '@nestjs/testing';
import { IsUniqueModelRule } from './unique';
import { LangflowMappingService } from '../langflow-mapping.service';
import { ValidationArguments } from 'class-validator';

describe('IsUniqueModelRule', () => {
  let validatorRule: IsUniqueModelRule;
  let langflowMappingService: LangflowMappingService;

  // Mock the langflow mapping service
  const mockLangflowMappingService = {
    get: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsUniqueModelRule,
        {
          provide: LangflowMappingService,
          useValue: mockLangflowMappingService
        }
      ]
    }).compile();

    validatorRule = module.get<IsUniqueModelRule>(IsUniqueModelRule);
    langflowMappingService = module.get<LangflowMappingService>(LangflowMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(validatorRule).toBeDefined();
  });

  describe('validate', () => {
    it('should return true if the model does not exist', async () => {
      // Mock service to return null (model not found)
      mockLangflowMappingService.get.mockResolvedValue(null);

      const result = await validatorRule.validate('newModel');

      expect(mockLangflowMappingService.get).toHaveBeenCalledWith('newModel');
      expect(result).toBe(true);
    });

    it('should return false if the model already exists', async () => {
      // Mock service to return a model (model found)
      mockLangflowMappingService.get.mockResolvedValue({
        model: 'existingModel',
        url: 'http://example.com/flow/123',
        historyComponentID: 'component123'
      });

      const result = await validatorRule.validate('existingModel');

      expect(mockLangflowMappingService.get).toHaveBeenCalledWith('existingModel');
      expect(result).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return a message with the model name', () => {
      const validationArguments: ValidationArguments = {
        value: 'testModel',
        constraints: [],
        targetName: '',
        property: '',
        object: {},
      };

      const message = validatorRule.defaultMessage(validationArguments);

      expect(message).toBe('Model testModel already registered');
    });
  });
}); 