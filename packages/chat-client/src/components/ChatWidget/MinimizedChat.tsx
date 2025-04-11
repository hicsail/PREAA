import { Box, Paper, Typography, IconButton, Avatar } from "@mui/material";
import { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useChatMessages } from "../../hooks/useChatMessages";
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import { chatWidgetStyles, getThemeColors } from "../../styleUtils";
import { useTheme } from "@mui/material/styles";

export const MinimizedChat = () => {
  const { setMinimized, chatConfig, isEmbedded } = useChat();
  const { restoreMessages } = useChatMessages();
  const [showInfo, setShowInfo] = useState(true);
  const theme = useTheme();
  const colors = getThemeColors(chatConfig, theme);
  
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

  // Container styles based on embed mode
  const containerStyle = {
    position: isEmbedded ? 'absolute' : 'relative',
    bottom: isEmbedded ? '16px' : undefined,
    right: isEmbedded ? '16px' : undefined,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: isEmbedded ? 'calc(100% - 32px)' : '100%',
    maxWidth: '350px',
    zIndex: chatWidgetStyles.zIndex.widget,
    background: 'transparent',
    padding: isEmbedded ? 0 : '16px',
    height: isEmbedded ? 'auto' : '100%',
    boxSizing: 'border-box',
  } as const;

  // Welcome box component
  const renderWelcomeBox = () => {
    if (!showInfo) return null;
    
    return (
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
            bgcolor: colors.primary, 
            color: 'white',
            p: 1.5,
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
    );
  };

  return (
    <Box sx={containerStyle}>
      {renderWelcomeBox()}
      
      {/* Chat icon button - always visible, positioned at the bottom right */}
      <IconButton
        onClick={handleMaximize}
        sx={{
          bgcolor: colors.primary,
          color: 'white',
          '&:hover': {
            bgcolor: theme.palette.mode === 'light' ? '#b71c1c' : '#f44336',
          },
          width: 56,
          height: 56,
          boxShadow: chatWidgetStyles.shadows.widget,
        }}
        aria-label="open chat"
      >
        <ChatIcon fontSize="large" />
      </IconButton>
    </Box>
  );
};