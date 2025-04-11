import { Box, IconButton, Typography, Drawer, useMediaQuery, useTheme, AppBar, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../contexts/ChatContext';
import { ChatBody } from './ChatBody';
import { useEffect } from 'react';

interface ExpandedChatProps {
  title?: string;
}

export const ExpandedChat = ({ title }: ExpandedChatProps) => {
  const { setMinimized, chatConfig, isEmbedded, skipAnimation } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Notify parent window when component mounts
  useEffect(() => {
    if (isEmbedded && window !== window.parent) {
      window.parent.postMessage({
        type: 'chat-widget-resize',
        size: 'expanded'
      }, '*');
    }
  }, [isEmbedded]);

  // Adjust transition based on skipAnimation flag
  const getTransitionStyle = () => {
    if (skipAnimation) {
      return {
        transition: 'none'
      };
    }
    
    return {
      transition: 'transform 0.3s ease, opacity 0.3s ease'
    };
  };

  const handleMinimize = () => {
    setMinimized(true);

    // If in embed mode, notify parent window
    if (isEmbedded && window !== window.parent) {
      window.parent.postMessage({
        type: 'chat-widget-resize',
        size: 'minimized'
      }, '*');
    }
  };

  // Get box styling based on device size
  const getBoxStyle = () => {
    // Base styles for all devices
    const baseStyle = {
      position: 'fixed' as const,
      display: 'flex' as const,
      flexDirection: 'column' as const,
      bgcolor: 'background.paper',
      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
      overflow: 'hidden' as const,
      zIndex: 2147483647,
      ...getTransitionStyle()
    };
    
    // Mobile styles - full screen
    if (isMobile) {
      return {
        ...baseStyle,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        borderRadius: 0,
      };
    }
    
    // Desktop styles - side drawer
    return {
      ...baseStyle,
      top: 0,
      right: 0,
      bottom: 0,
      width: '420px',
      borderRadius: '10px 0 0 10px',
    };
  };

  return (
    <Box sx={getBoxStyle()}>
      <AppBar
        position="static"
        color="primary"
        sx={{
          bgcolor: chatConfig.theme?.primary || '#d32f2f',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
            {title || chatConfig.title || 'What would you like to know?'}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMinimize}
            color="inherit"
            aria-label="close chat"
            edge="end"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        height: 'calc(100% - 64px)' // Adjust for AppBar height
      }}>
        <ChatBody />
      </Box>
    </Box>
  );
};