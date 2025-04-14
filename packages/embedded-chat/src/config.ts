// Simple utility to parse URL parameters into configuration
export interface ChatConfig {
  modelId?: string;
  title?: string;
  botName?: string;
  placeholder?: string;
  supportTopics?: string[];
  introMessage?: string;
  introMessageDelay?: number;
  botAvatarSrc?: string;
  theme?: {
    primary?: string;
    background?: string;
    text?: string;
  };
}

export function parseConfigFromUrl(): ChatConfig {
  const params = new URLSearchParams(window.location.search);
  const config: ChatConfig = {
    theme: {}
  };
  
  // Extract basic parameters
  if (params.has('modelId')) config.modelId = params.get('modelId')!;
  if (params.has('title')) config.title = params.get('title')!;
  if (params.has('botName')) config.botName = params.get('botName')!;
  if (params.has('placeholder')) config.placeholder = params.get('placeholder')!;
  
  // Parse theme if provided
  try {
    if (params.has('theme')) {
      config.theme = JSON.parse(params.get('theme')!);
    }
  } catch (e) {
    console.error('Failed to parse theme:', e);
  }
  
  return config;
}