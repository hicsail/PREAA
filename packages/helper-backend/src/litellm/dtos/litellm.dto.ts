export class CompletionResponse {
  id: string;
  created: number;
  model: string;
  object: string;
  choices: Choice[];
  usage: Usage;
  text: string;
}

interface Choice {
  finish_reason: string;
  index: number;
  message: Message;
}

interface Message {
  role: string;
  text: string;
  content: string;
}

interface Usage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
  completion_tokens_details: any;
  prompt_tokens_details: any;
}
