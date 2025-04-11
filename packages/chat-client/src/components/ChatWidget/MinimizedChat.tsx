// src/components/ChatWidget/MinimizedChat.tsx
import { useState } from 'react';
import { Box, IconButton, Typography, Avatar, Paper } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../contexts/ChatContext';
import { useChatMessages } from '../../hooks/useChatMessages';

export const MinimizedChat = () => {
  const { setMinimized, chatConfig, isEmbedded, embedConfig } = useChat();
  const { restoreMessages } = useChatMessages();
  const [showInfo, setShowInfo] = useState(true);
  
  const handleMaximize = () => {
    setMinimized(false);
    restoreMessages();
  };

  const handleCloseInfo = () => {
    setShowInfo(false);
  };

  const getMinimizedStyle = () => {
    if (isEmbedded) {
      return {
        position: 'absolute' as const,
        bottom: '0',
        right: '0',
        // Other styles specific to embed mode
      };
    }
    
    return {}; // Default styles for non-embed mode
  };

  return (
    <Box sx={getMinimizedStyle()}>
      {showInfo && (
        <Paper 
          elevation={3}
          sx={{
            width: '350px',
            borderRadius: '8px',
            overflow: 'hidden',
            mb: 2
          }}
          className="chat-widget-minimized"
        >
          <Box 
            sx={{ 
              bgcolor: chatConfig.theme?.primary || '#d32f2f', 
              color: 'white',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            className="chat-widget-minimized-header"
          >
            <Typography variant="h6" component="div">
              {chatConfig.title || 'May I help you?'}
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleCloseInfo}
              sx={{ color: 'white' }}
              aria-label="close welcome message"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box className="chat-widget-minimized-content" sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar 
                src={chatConfig.avatarSrc || "/BU-logo.png"} 
                alt="Chat Avatar"
                sx={{ width: 60, height: 60 }}
              />
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="body1" fontWeight="bold">
                  Hi there! I'm {chatConfig.botName || "BUzz"}, a chatbot here to answer your 
                  {chatConfig.supportTopics ? ` ${chatConfig.supportTopics}` : " questions"}.
                </Typography>
                <Typography variant="body2" mt={1}>
                  What would you like to know?
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* Chat icon button - always visible, positioned outside the info box */}
      <IconButton
        onClick={handleMaximize}
        sx={{
          bgcolor: chatConfig.theme?.primary || '#d32f2f',
          color: 'white',
          '&:hover': {
            bgcolor: '#b71c1c',
          },
          width: 56,
          height: 56,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
        aria-label="open chat"
      >
        <ChatIcon fontSize="large" />
      </IconButton>
    </Box>
  );
};