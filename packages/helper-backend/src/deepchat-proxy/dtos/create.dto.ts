import { IsString, IsArray, ValidateNested } from 'class-validator';

export class CreateProxyMappingDto {

  @IsString()
  model: string;

  @IsString()
  url: string;

  @IsString()
  apiKey: string;

}