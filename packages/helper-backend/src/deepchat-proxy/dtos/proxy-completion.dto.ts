import { IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Message {
  @IsString()
  role: string;

  @IsString()
  text: string;
}

export class ProxyCompletion {
  @IsArray()
  @ValidateNested({ each: true })
  messages: Message[];
}

export class ProxyCompletionDto {
  @ApiProperty({ description: 'The messages to send to the proxy' })
  messages: Message[];
}
