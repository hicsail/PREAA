import { ApiProperty } from '@nestjs/swagger';

class Message {
  @ApiProperty({ description: 'Who made the message content' })
  role: string;

  @ApiProperty({ description: 'Text response' })
  text: string;

  @ApiProperty({ description: 'Content text' })
  content: string;
}

class Choice {
  @ApiProperty({ description: 'The reason for the generation stop' })
  finish_reason: string;

  @ApiProperty({ description: 'Index of the choice' })
  index: number;

  @ApiProperty({ description: 'Content of the choice' })
  message: Message;
}

class Usage {
  @ApiProperty({ description: 'Tokens needed to make completion' })
  completion_tokens: number;

  @ApiProperty({ description: 'Tokens used by prompt' })
  prompt_tokens: number;

  @ApiProperty({ description: 'Total tokens used in interaction' })
  total_tokens: number;

  @ApiProperty({ description: 'Additional context on completion token usagage' })
  completion_tokens_details: any;

  @ApiProperty({ description: 'Additional context on prompt token usage' })
  prompt_tokens_details: any;
}

export class CompletionResponse {
  @ApiProperty({ description: 'The id of the completion' })
  id: string;

  @ApiProperty({ description: 'Creation date' })
  created: number;

  @ApiProperty({ description: 'Model that make the completion' })
  model: string;

  @ApiProperty()
  object: string;

  @ApiProperty()
  choices: Choice[];

  @ApiProperty({ description: 'Usage information' })
  usage: Usage;

  @ApiProperty()
  text: string;
}
