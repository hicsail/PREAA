import { Box, IconButton, Typography, useMediaQuery, useTheme, AppBar, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../contexts/ChatContext';
import { ChatBody } from './ChatBody';
import { useEffect } from 'react';
import { getExpandedBoxStyle, chatWidgetStyles, getThemeColors } from '../../styleUtils';

interface ExpandedChatProps {
  title?: string;
}

export const ExpandedChat = ({ title }: ExpandedChatProps) => {
  const { setMinimized, chatConfig, isEmbedded, skipAnimation } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const colors = getThemeColors(chatConfig, theme);

  // Notify parent window when component mounts
  useEffect(() => {
    if (isEmbedded && window !== window.parent) {
      window.parent.postMessage({
        type: 'chat-widget-resize',
        size: 'expanded'
      }, '*');
    }
  }, [isEmbedded]);

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

  return (
    <Box sx={getExpandedBoxStyle(isMobile, skipAnimation)}>
      <AppBar
        position="static"
        color="primary"
        sx={{
          bgcolor: colors.primary,
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
        height: `calc(100% - ${chatWidgetStyles.sizes.headerHeight}px)` // Adjust for AppBar height
      }}>
        <ChatBody />
      </Box>
    </Box>
  );
};