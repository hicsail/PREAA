import { DeepChat } from "deep-chat-react";
import { useChat } from '../../contexts/ChatContext';
import { Box, Typography, Paper } from '@mui/material';

export const ChatBody = () => {
  const { chatRef, modelId, chatConfig, isEmbedded } = useChat();


  // Define custom styles for DeepChat
  const deepChatStyles = {
    messageStyles: {
      default: {
        user: {
          bubble: {
            backgroundColor: "#ff2020"
          }
        }
      }
    },
    chatStyle: {
      backgroundColor: chatConfig.theme?.background || '#ffffff',
      height: '100%',
      width: '100%'
    },
    inputAreaStyle: {
      backgroundColor: chatConfig.theme?.secondary || '#f5f5f5',
      borderTop: '1px solid #e0e0e0',
      padding: '16px'
    },
    textInput: {
      styles: {
        container: {
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '24px',
          padding: '12px 16px'
        },
        focus: {
          border: `1px solid ${chatConfig.theme?.primary || '#d32f2f'}`,
          boxShadow: `0 0 0 2px ${chatConfig.theme?.primary || '#d32f2f'}20`
        },
        text: { fontSize: '16px' }
      },
      placeholder: {
        text: chatConfig.placeholder || "Type your message here...",
        style: { color: '#757575' }
      }
    },
    submitButtonStyles: {
      submit: {
        container: {
          default: {
            backgroundColor: 'transparent',
            marginLeft: '8px',
            marginRight: '8px'
          },
          hover: { backgroundColor: 'transparent' },
          click: { backgroundColor: 'transparent' }
        },
        svg: {
          styles: {
            default: {
              filter: 'brightness(0) saturate(100%) invert(49%) sepia(99%) saturate(477%) hue-rotate(343deg) brightness(100%) contrast(101%)'
            }
          }
        }
      }
    },
    auxiliaryStyle: `
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-thumb {
        background-color: #d1d1d1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-track {
        background-color: #f5f5f5;
      }
      .deep-chat-message {
        margin: 12px 16px;
        max-width: 80%;
      }
      .deep-chat-user-message {
        background-color: #f0f0f0;
        border-radius: 18px 18px 4px 18px;
        padding: 12px 16px;
        margin-left: auto;
      }
      .deep-chat-assistant-message {
        background-color: #f9f9f9;
        border-radius: 18px 18px 18px 4px;
        padding: 12px 16px;
        border-left: 3px solid ${chatConfig.theme?.primary || '#d32f2f'};
      }
      .deep-chat-messages-container {
        padding: 16px 0;
        height: calc(100% - 70px) !important;
      }
      .deep-chat-input {
        border-radius: 24px !important;
      }
      .deep-chat-submit-button {
        margin-right: 8px;
      }
      .deep-chat-full-size {
        height: 100% !important;
        display: flex;
        flex-direction: column;
      }
      .intro-panel {
        margin-top: 20px !important;
        margin-left: 16px !important;
        margin-right: 16px !important;
        width: calc(100% - 32px) !important;
        max-width: 80% !important;
      }
      ${isEmbedded ? `
      .deep-chat-container {
        height: 100% !important;
        display: flex;
        flex-direction: column;
      }
      ` : ''}
    `
  };

  // Render intro panel if enabled in config
  const renderIntroPanel = () => {
    // Check if intro panel is enabled and should be shown
    if (!chatConfig.introPanel) {
      return null;
    }

    return (
      <Paper 
        elevation={2}
        className="chat-intro-panel"
        sx={{
          marginTop: '20%',
          bgcolor: '#f3f3f3',
          borderRadius: '10px',
          p: 2,
          textAlign: 'left',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: `3px solid ${chatConfig.theme?.primary || '#d32f2f'}`,
          maxWidth: '80%',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" mb={0.5}>
          {chatConfig.introPanel.title || 'Intro panel'}
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
          {chatConfig.introPanel.description || 
            'Insert a description to help your users understand how to use the component.'}
        </Typography>
      </Paper>
    );
  };

  // Ensure we have a modelId before rendering the chat
  if (!modelId) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 2
      }}>
        <p>Error: No model ID provided</p>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      flex: 1, 
      position: 'relative', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <DeepChat
        ref={chatRef}
        requestBodyLimits={{ maxMessages: -1 }}
        connect={{
          url: `${import.meta.env.VITE_BACKEND_BASE_URL}/deepchat-proxy/proxy/${modelId}`,
        }}
        className="deep-chat-full-size"
        style={{ height: '100%', width: '100%' }}
        {...deepChatStyles}
      >
      {renderIntroPanel()}
      </DeepChat>
    </Box>
  );
};