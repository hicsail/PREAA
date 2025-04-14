import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { MinimizedChat } from './MinimizedChat';
import { ExpandedChat } from './ExpandedChat';
import { ChatConfig } from '../config';

interface ChatWidgetProps {
  config: ChatConfig;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ config }) => {
  const [minimized, setMinimized] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const chatRef = useRef<any>(null);
  
  // Notify parent window about size changes
  useEffect(() => {
    window.parent.postMessage({
      type: 'chat-widget-resize',
      size: minimized ? 'minimized' : 'expanded'
    }, '*');
  }, [minimized]);
  
  // Listen for commands from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'chat-command') {
        switch (event.data.action) {
          case 'open':
            setMinimized(false);
            break;
          case 'minimize':
            setMinimized(true);
            break;
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Notify parent that widget is ready
    window.parent.postMessage({ type: 'chat-widget-ready' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Save messages when chat is minimized
  const handleMinimize = () => {
    if (!minimized && chatRef.current) {
      try {
        const currentMessages = chatRef.current.getMessages();
        if (currentMessages?.length) {
          setMessages(currentMessages);
        }
      } catch (e) {
        console.error('Failed to save messages:', e);
      }
    }
    setMinimized(true);
  };
  
  // Restore messages when chat is expanded
  const handleExpand = () => {
    setMinimized(false);
    
    // Restore messages after a short delay to ensure the component is mounted
    if (messages.length > 0) {
      setTimeout(() => {
        if (chatRef.current) {
          try {
            chatRef.current.clearMessages(true);
            messages.forEach(msg => {
              chatRef.current.addMessage(msg, false);
            });
            chatRef.current.scrollToBottom();
          } catch (e) {
            console.error('Failed to restore messages:', e);
          }
        }
      }, 100);
    }
  };
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {minimized ? (
        <MinimizedChat 
          config={config} 
          onExpand={handleExpand} 
        />
      ) : (
        <ExpandedChat 
          config={config} 
          onMinimize={handleMinimize}
          chatRef={chatRef}
        />
      )}
    </Box>
  );
};