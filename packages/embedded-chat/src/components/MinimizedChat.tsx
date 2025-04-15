import React from 'react';
import { Box, Paper, Typography, IconButton, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ChatConfig } from '../config';
import { useTheme } from '@mui/material/styles';

interface MinimizedChatProps {
  config: ChatConfig;
  onExpand: () => void;
}

export const MinimizedChat: React.FC<MinimizedChatProps> = ({ config, onExpand }) => {
  const theme = useTheme();

  // Use the primary color from config or default to the BU red
  const primaryColor = config.theme?.primary || '#c00';

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        maxWidth: '350px',
        width: 'calc(100% - 32px)',
        zIndex: 2147483647,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '10px',
        overflow: 'hidden'
      }}
    >
      {/* Header section */}
      <Box
        sx={{
          bgcolor: primaryColor,
          color: '#fff',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {config.title || 'May I help you?'}
        </Typography>
        <IconButton
          size="small"
          sx={{ color: '#fff' }}
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content section */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#fff',
          p: 2,
          cursor: 'pointer'
        }}
        onClick={onExpand}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* BU Logo */}
          <Avatar
            src={config.botAvatarSrc || '/assets/bu-logo.png'}
            alt="BU"
            sx={{
              width: 56,
              height: 56,
              bgcolor: primaryColor,
              '& img': {
                objectFit: 'contain',
                p: 1
              }
            }}
          >
            {!config.botAvatarSrc && (
              <Typography
                variant="h5"
                component="span"
                sx={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}
              >
                BU
              </Typography>
            )}
          </Avatar>

          {/* Welcome message */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              Hi there! I'm {config.botName || 'BUzz'}, a chatbot here to answer your
              {config.supportTopics ? ` ${config.supportTopics}` : ' questions'}.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              What would you like to know?
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
