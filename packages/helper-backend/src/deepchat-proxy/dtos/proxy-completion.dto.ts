import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class Message {
  @ApiProperty({
    description: 'Role of the message sender',
    example: 'user',
    enum: ['system', 'user', 'assistant']
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello, how can you help me today?'
  })
  @IsString()
  content: string;
}

export class ProxyCompletion {
  @ApiProperty({
    description: 'Array of messages in the conversation',
    type: [Message],
    example: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'What can you help me with?'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Message)
  messages: Message[];

  @ApiProperty({
    description: 'Maximum number of tokens to generate',
    example: 1000,
    required: false
  })
  @IsNumber()
  @IsOptional()
  max_tokens?: number;

  @ApiProperty({
    description: 'Sampling temperature (0-2)',
    example: 0.7,
    required: false
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;
}

// We can remove this since ProxyCompletion now has proper decorators
// export class ProxyCompletionDto {
//   @ApiProperty({ description: 'The messages to send to the proxy' })
//   messages: Message[];
// }
