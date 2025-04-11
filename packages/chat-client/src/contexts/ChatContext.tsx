// src/contexts/ChatContext.tsx
import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { MessageContent, ChatConfig } from '../types/chat';

interface ChatContextType {
  minimized: boolean;
  setMinimized: (value: boolean) => void;
  chatMessages: MessageContent[];
  setChatMessages: (messages: MessageContent[]) => void;
  chatRef: React.RefObject<any>;
  modelId: string | null;
  setModelId: (id: string | null) => void;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
  chatConfig: ChatConfig;
  isEmbedded: boolean;
  embedConfig: {
    position: string;
    theme: any;
  };
  handleExternalCommand: (command: string) => void;
  skipAnimation: boolean;
  setSkipAnimation: (value: boolean) => void;
}

const defaultConfig: ChatConfig = {
  title: 'Chat Assistant',
  botName: 'Assistant',
  avatarSrc: null,
  supportTopics: null,
  placeholder: 'Type your message here...',
  position: 'bottom-right',
  width: 400,
  height: 600,
  theme: {
    primary: '#d32f2f',
    secondary: '#f5f5f5',
    text: '#212121',
    background: '#ffffff'
  }
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode, config?: Partial<ChatConfig> }> = ({ children, config }) => {

  const [minimized, setMinimized] = useState(true); // Start minimized by default
  const [chatMessages, setChatMessages] = useState<MessageContent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatRef = useRef<any>(null);
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);
  const [skipAnimation, setSkipAnimation] = useState<boolean>(false);
  const [embedConfig, setEmbedConfig] = useState<{ position: string, theme: any }>({
    position: 'bottom-right',
    theme: {}
  });

  // Merge default config with provided config
  const chatConfig = { ...defaultConfig, ...config };

  const [modelId, setModelId] = useState<string | null>(chatConfig.modelId || null);

  useEffect(() => {
    if (chatConfig.modelId) {
      setModelId(chatConfig.modelId);
    }
  }, [chatConfig.modelId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbed = urlParams.get('embed') === 'true';
    const startExpanded = urlParams.get('startExpanded') === 'true';

    if (isEmbed) {
      setIsEmbedded(true);

      // If startExpanded is true, start in expanded mode
      if (startExpanded) {
        setMinimized(false);
      }

      // Set up message listener for parent window communication
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'chat-command') {
          const skipAnimation = event.data.skipAnimation === true;

          switch (event.data.action) {
            case 'open':
              // If skipAnimation is true, we should avoid any animations
              if (skipAnimation) {
                // You might need to set a flag or use a different state setter
                // that bypasses animations in your components
                setMinimizedWithoutAnimation(false);
              } else {
                setMinimized(false);
              }
              break;

            case 'minimize':
              if (skipAnimation) {
                setMinimizedWithoutAnimation(true);
              } else {
                setMinimized(true);
              }

              // Notify parent that chat is minimized
              if (window !== window.parent) {
                window.parent.postMessage({ type: 'chat-status', status: 'minimized' }, '*');
              }
              break;

            default:
              console.log('Unknown command:', event.data.action);
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Add this function to your context
  const setMinimizedWithoutAnimation = (value: boolean) => {
    // You might need to add a new state variable to track animation skipping
    setSkipAnimation(true);
    setMinimized(value);

    // Reset the skip animation flag after a short delay
    setTimeout(() => {
      setSkipAnimation(false);
    }, 50);
  };

  // Function to handle commands from parent window
  const handleExternalCommand = (command: string) => {
    switch (command) {
      case 'open':
        setMinimized(false);
        break;
      case 'minimize':
        setMinimized(true);
        // Notify parent that chat is minimized
        if (window !== window.parent) {
          window.parent.postMessage({ type: 'chat-status', status: 'minimized' }, '*');
        }
        break;
      default:
        console.log('Unknown command:', command);
    }
  };

  return (
    <ChatContext.Provider value={{
      minimized,
      setMinimized,
      chatMessages,
      setChatMessages,
      chatRef,
      modelId,
      setModelId,
      errorMessage,
      setErrorMessage,
      chatConfig,
      isEmbedded,
      embedConfig,
      handleExternalCommand,
      skipAnimation,
      setSkipAnimation,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};