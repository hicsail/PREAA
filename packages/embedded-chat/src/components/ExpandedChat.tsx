import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DeepChat } from 'deep-chat-react';
import { ChatConfig } from '../config';

interface ExpandedChatProps {
  config: ChatConfig;
  onMinimize: () => void;
  chatRef: React.RefObject<any>;
}

export const ExpandedChat: React.FC<ExpandedChatProps> = ({
  config,
  onMinimize,
  chatRef
}) => {
  const primaryColor = config.theme?.primary || '#c00';
  return (
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRadius: { xs: 0, sm: '10px' },
      overflow: 'hidden',
      boxShadow: { xs: 'none', sm: '0 4px 12px rgba(0,0,0,0.15)' }
    }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {config.title || 'May I help you?'}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onMinimize}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{
        flexGrow: 1,
        overflow: 'hidden',
        display: 'flex', // Add flex display
        flexDirection: 'column', // Stack children vertically
        height: 'calc(100% - 64px)' // Subtract AppBar height
      }}>
        <DeepChat
          ref={chatRef}
          style={{
            width: '100%',
            height: '100%', // Take full height
            border: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
          requestBodyLimits={{ maxMessages: -1 }}
          connect={{
            url: `${import.meta.env.VITE_BACKEND_BASE_URL}/deepchat-proxy/proxy/${config.modelId}`
          }}
          messageStyles={{
            default: {
              user: {
                bubble: {
                  backgroundColor: primaryColor,
                  color: '#ffffff'
                }
              },
              assistant: {
                bubble: {
                  backgroundColor: '#f1f1f1',
                  color: '#212121'
                }
              }
            }
          }}
          inputAreaStyle={{
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'center'
          }}
          textInput={{
            placeholder: {
              text: config.placeholder || 'Ask me anything!',
              style: {
                color: '#757575'
              }
            },
            styles: {
              container: {
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '24px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '100%',
                margin: '16px'
              },
              text: {
                fontSize: '16px',
                color: '#212121',
                fontFamily: 'inherit'
              },
              focus: {
                borderColor: primaryColor,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.05)'
              }
            }
          }}
          submitButtonStyles={{
            position: "inside-right",
            submit: {
              container: {
                default: {
                  backgroundColor: 'transparent',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '8px',
                  marginRight: '16px',
                  padding: '6px',
                  minWidth: 'unset'
                },
                hover: {
                  backgroundColor: 'rgba(0,0,0,0.05)'
                },
                click: {
                  backgroundColor: 'rgba(0,0,0,0.1)'
                }
              }
            },
            loading: {
              container: {
                default: {
                  backgroundColor: 'transparent',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '8px',
                  padding: '6px',
                  minWidth: 'unset'
                }
              }
            },
          }}
          introMessage={{
            text: `Hi there! I'm ${config.botName || 'BUzz'}, a chatbot here to answer your ${config.supportTopics ? config.supportTopics : 'questions'}. What would you like to know?`
          }}
        />
      </Box>
    </Box>
  );
};