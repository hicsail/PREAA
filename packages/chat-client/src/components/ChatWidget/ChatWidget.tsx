import { useChat } from '../../contexts/ChatContext';
import { MinimizedChat } from './MinimizedChat';
import { ExpandedChat } from './ExpandedChat';
import { Box } from '@mui/material';
import { useEffect } from 'react';

export const ChatWidgetComponent = () => {
  const { minimized, setMinimized, chatConfig, isEmbedded } = useChat();

  // Handle iframe-specific adjustments
  useEffect(() => {
    // Check if we're in an iframe
    const isInIframe = window !== window.parent;

    if (isInIframe) {
      // Add message listener for parent window communication
      const handleMessage = (event: MessageEvent) => {
        // Handle commands from parent window
        if (event.data && event.data.type === 'chat-command') {
          console.log('Received command from parent:', event.data);
          
          const { action } = event.data;
          
          switch (action) {
            case 'open':
              setMinimized(false);
              break;
            case 'minimize':
              setMinimized(true);
              break;
            default:
              console.log('Unknown command:', action);
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [setMinimized]);

  // Notify parent window about size changes
  useEffect(() => {
    if (isEmbedded && window !== window.parent) {
      window.parent.postMessage({
        type: 'chat-widget-resize',
        size: minimized ? 'minimized' : 'expanded'
      }, '*');
    }
  }, [minimized, isEmbedded]);

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
        zIndex: 2147483647, // Maximum z-index
        margin: 0,
        padding: 0,
        background: 'transparent', // Ensure transparent background
      };
    }

    // Normal positioning when not in iframe
    const position = chatConfig.position || 'bottom-right';
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 2147483647, // Maximum z-index
      background: 'transparent', // Ensure transparent background
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

  // Create a backdrop for the expanded chat when not in embed mode
  const renderBackdrop = () => {
    if (!isEmbedded && !minimized) {
      return (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 2147483646, // Just below the chat widget
            transition: 'opacity 0.3s ease',
          }}
          onClick={() => setMinimized(true)}
        />
      );
    }
    return null;
  };

  return (
    <>
      {renderBackdrop()}
      <Box 
        sx={{
          ...getPositionStyle(),
          background: 'transparent', // Ensure transparent background
        }} 
        className="chat-widget-container"
        role="region"
        aria-label="Chat widget"
      >
        {minimized ? (
          <MinimizedChat />
        ) : (
          <ExpandedChat title={chatConfig.title} />
        )}
      </Box>
    </>
  );
};