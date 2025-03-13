import { IsString, IsArray, ValidateNested } from 'class-validator';

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
