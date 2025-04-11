import { Box, IconButton, Typography, Drawer, useMediaQuery, useTheme, AppBar, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../contexts/ChatContext';
import { ChatBody } from './ChatBody';

interface ExpandedChatProps {
  title?: string;
}

export const ExpandedChat = ({ title }: ExpandedChatProps) => {
  const { setMinimized, chatConfig, minimized, isEmbedded, embedConfig, skipAnimation } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      window.parent.postMessage({ type: 'chat-status', status: 'minimized' }, '*');
    }
  };

  // Determine drawer anchor based on screen size and config
  const getDrawerAnchor = () => {
    if (isMobile) {
      return 'bottom';
    }

    // Use position from config to determine anchor
    const position = chatConfig.position || 'bottom-right';
    if (position.includes('right')) {
      return 'right';
    } else if (position.includes('left')) {
      return 'left';
    } else {
      return 'bottom';
    }
  };

  const anchor = getDrawerAnchor();

  // Determine drawer size based on screen size and config
  const getDrawerSize = () => {
    if (isMobile) {
      return {
        width: '100%',
        // Keep height as is or adjust as needed
        height: '100%'
      };
    }

    return {
      width: chatConfig.width || 800, // Increased from original value
      // Keep height as is or adjust as needed
    };
  };
  //const { width, height } = getDrawerSize();

  // Adjust drawer styling for embed mode
  const getDrawerStyle = () => {
    if (isEmbedded) {
      return {
        width: '100%',
        height: '100%',
        '& .MuiDrawer-paper': {
          width: '100%',
          height: '100%',
          position: 'absolute' as const,
          borderRadius: 0,
        },
      };
    }

    // Return your existing drawer styles for non-embed mode
    return {
      width: getDrawerSize().width,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: getDrawerSize().width,
        height: getDrawerSize().height,
      },
    };
  };

  return (
    <Drawer
      anchor={isEmbedded ? 'bottom' : (anchor as 'bottom' | 'right' | 'left' | 'top')}
      open={!minimized} // Use isOpen state directly for drawer open prop
      onClose={handleMinimize}
      sx={{
        ...getDrawerStyle(),
        '& .MuiDrawer-paper': {
          ...getDrawerStyle()['& .MuiDrawer-paper'],
          ...getTransitionStyle()
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(5px)',
          }
        },
      }}
      ModalProps={{
        keepMounted: true, // Better performance on mobile
      }}
    >
       {!isEmbedded && (
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
      )}
      <ChatBody />
    </Drawer>
  );
};