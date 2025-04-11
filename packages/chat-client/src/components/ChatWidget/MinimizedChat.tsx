import { Box, Paper, Typography, IconButton, Avatar } from "@mui/material";
import { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useChatMessages } from "../../hooks/useChatMessages";
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';

export const MinimizedChat = () => {
  const { setMinimized, chatConfig, isEmbedded } = useChat();
  const { restoreMessages } = useChatMessages();
  const [showInfo, setShowInfo] = useState(true);
  
  const handleMaximize = () => {
    setMinimized(false);
    restoreMessages();
    
    // Notify parent window if in iframe
    if (isEmbedded && window !== window.parent) {
      window.parent.postMessage({
        type: 'chat-widget-resize',
        size: 'expanded'
      }, '*');
    }
  };

  const handleCloseInfo = () => {
    setShowInfo(false);
  };

  const getMinimizedStyle = () => {
    if (isEmbedded) {
      return {
        position: 'absolute' as const,
        bottom: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-end',
        width: 'calc(100% - 32px)', // Account for padding
        maxWidth: '350px',
        zIndex: 1000,
        background: 'transparent', // Ensure transparent background
      };
    }
    
    return {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      padding: '16px',
      height: '100%',
      width: '100%',
      position: 'relative' as const,
      boxSizing: 'border-box' as const,
      background: 'transparent', // Ensure transparent background
    }; 
  };

  return (
    <Box sx={getMinimizedStyle()}>
      {showInfo && (
        <Paper 
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: '350px',
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
              p: 1.5, // Slightly reduced padding
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            className="chat-widget-minimized-header"
          >
            <Typography variant="subtitle1" component="div">
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
          
          <Box className="chat-widget-minimized-content" sx={{ p: 1.5 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar 
                src={chatConfig.avatarSrc || "/BU-logo.png"} 
                alt="Chat Avatar"
                sx={{ width: 50, height: 50 }}
              />
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Hi there! I'm {chatConfig.botName || "BUzz"}, a chatbot here to answer your 
                  {chatConfig.supportTopics ? ` ${chatConfig.supportTopics}` : " questions"}.
                </Typography>
                <Typography variant="body2" mt={0.5}>
                  What would you like to know?
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* Chat icon button - always visible, positioned at the bottom right */}
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