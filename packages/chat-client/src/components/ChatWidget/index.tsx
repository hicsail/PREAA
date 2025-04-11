// src/components/ChatWidget/index.tsx
import { ChatProvider } from '../../contexts/ChatContext';
import { ChatWidgetComponent } from './ChatWidget';
import { ChatWidgetProps } from '../../types/chat';

export const ChatWidget = (props: ChatWidgetProps) => {

  return (
    <ChatProvider config={props.config}>
      <ChatWidgetComponent />
    </ChatProvider>
  );
};

export default ChatWidget;