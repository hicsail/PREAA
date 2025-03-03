import { Injectable } from '@nestjs/common';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator, ValidationOptions } from 'class-validator';
import { LangflowMappingService } from '../langflow-mapping.service';


@ValidatorConstraint({ async: true, name: 'IsUniqueModel' })
@Injectable()
export class IsUniqueModel implements ValidatorConstraintInterface {
  constructor(private readonly langFlowMappingSerivce: LangflowMappingService) {}

  async validate(model: string): Promise<boolean> {
    const found = await this.langFlowMappingSerivce.get(model);
    return !!found;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
      return `Model ${validationArguments?.value} already registered`;
  }
}
