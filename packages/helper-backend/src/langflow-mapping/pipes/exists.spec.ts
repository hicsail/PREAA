import { Test, TestingModule } from '@nestjs/testing';
import { DoesExistModelRule } from './exists';
import { LangflowMappingService } from '../langflow-mapping.service';
import { ValidationArguments } from 'class-validator';
//checking if the model exists
describe('DoesExistModelRule', () => {
  let validatorRule: DoesExistModelRule;
  let langflowMappingService: LangflowMappingService;

  // Mock the langflow mapping service
  const mockLangflowMappingService = {
    get: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoesExistModelRule,
        {
          provide: LangflowMappingService,
          useValue: mockLangflowMappingService
        }
      ]
    }).compile();

    validatorRule = module.get<DoesExistModelRule>(DoesExistModelRule);
    langflowMappingService = module.get<LangflowMappingService>(LangflowMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(validatorRule).toBeDefined();
  });

  describe('validate', () => {
    it('should return false if the model does not exist', async () => {
      // Mock service to return null (model not found)
      mockLangflowMappingService.get.mockResolvedValue(null);

      const result = await validatorRule.validate('nonExistentModel');

      expect(mockLangflowMappingService.get).toHaveBeenCalledWith('nonExistentModel');
      expect(result).toBe(false);
    });

    it('should return true if the model exists', async () => {
      // Mock service to return a model (model found)
      mockLangflowMappingService.get.mockResolvedValue({
        model: 'existingModel',
        url: 'http://example.com/flow/123',
        historyComponentID: 'component123'
      });

      const result = await validatorRule.validate('existingModel');

      expect(mockLangflowMappingService.get).toHaveBeenCalledWith('existingModel');
      expect(result).toBe(true);
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

      expect(message).toBe('Model testModel not found');
    });
  });
}); 