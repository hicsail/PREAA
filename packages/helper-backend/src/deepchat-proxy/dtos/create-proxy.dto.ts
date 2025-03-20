import { ApiProperty } from '@nestjs/swagger';

export class ProxyDto {
  @ApiProperty({  description: 'The model name' })
  modelName: string;

  @ApiProperty({ description: 'The secret key for the proxy' })
  secretKey: string;
}

