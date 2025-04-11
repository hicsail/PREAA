import { useChat } from '../../contexts/ChatContext';
import { MinimizedChat } from './MinimizedChat';
import { ExpandedChat } from './ExpandedChat';
import { Box } from '@mui/material';
import { useEffect } from 'react';

export const ChatWidgetComponent = () => {
  const { minimized, chatConfig, isEmbedded, embedConfig } = useChat();

  // Handle iframe-specific adjustments
  useEffect(() => {
    // Check if we're in an iframe
    const isInIframe = window !== window.parent;

    if (isInIframe) {
      // Add message listener for parent window communication
      const handleMessage = (event: MessageEvent) => {
        // Handle any messages from parent frame if needed
        if (event.data && event.data.type === 'chat-command') {
          console.log('Received command from parent:', event.data);
          // Handle commands like minimize/maximize if needed
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Position styling based on config
   // Position styling based on config and embed mode
   const getPositionStyle = () => {
    // When in embed mode, take up the full space of the iframe
    if (isEmbedded) {
      return {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        margin: 0,
        padding: 0,
        background: 'transparent',
      };
    }

    // Normal positioning when not in iframe
    const position = chatConfig.position || 'bottom-right';
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    if (position.includes('bottom')) {
      style.bottom = '20px';
    } else {
      style.top = '20px';
    }

    if (position.includes('right')) {
      style.right = '20px';
    } else {
      style.left = '20px';
    }

    return style;
  };

  return (
    <Box sx={getPositionStyle()} className="chat-widget-container">
      {minimized && (
        <MinimizedChat />
      )}
      <ExpandedChat title={chatConfig.title} />
    </Box>
  );
};