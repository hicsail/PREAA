import { Injectable } from '@nestjs/common';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, ValidationOptions, registerDecorator } from 'class-validator';
import { LangflowMappingService } from '../langflow-mapping.service';


@ValidatorConstraint({ async: true, name: 'IsUniqueModel' })
@Injectable()
export class IsUniqueModelRule implements ValidatorConstraintInterface {
  constructor(private readonly langFlowMappingSerivce: LangflowMappingService) {}

  async validate(model: string): Promise<boolean> {
    const found = await this.langFlowMappingSerivce.get(model);
    return !found;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
      return `Model ${validationArguments?.value} already registered`;
  }
}

export function IsUniqueModel(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsUniqueModel',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsUniqueModelRule,
    });
  };
}

