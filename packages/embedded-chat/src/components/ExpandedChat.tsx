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

export const ExpandedChat: React.FC<ExpandedChatProps> = ({ config, onMinimize, chatRef }) => {
  const primaryColor = config.theme?.primary || '#c00';
  return (
    <Box
      sx={{
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
      }}
    >
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {config.title || 'May I help you?'}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onMinimize} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 64px)'
        }}
      >
        <DeepChat
          ref={chatRef}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
          requestBodyLimits={{ maxMessages: 6 }}
          connect={
            config.streaming === true
              ? {
                  stream: true,
                  handler: async (body: any, signals: any) => {
                    const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/proxies/proxy/${config.modelId}`;

                    // Set up abort controller for stop button functionality
                    const abortController = new AbortController();
                    signals.stopClicked.listener = () => {
                      abortController.abort();
                    };

                    try {
                      const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          ...body,
                          stream: true
                        }),
                        signal: abortController.signal
                      });

                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error('[DeepChat] Request failed:', response.status, errorText);
                        signals.onResponse({ error: `Request failed: ${response.status}` });
                        signals.onClose();
                        return;
                      }

                      const reader = response.body?.getReader();
                      if (!reader) {
                        console.error('[DeepChat] No stream reader available');
                        signals.onResponse({ error: 'No stream reader available' });
                        signals.onClose();
                        return;
                      }

                      // Initialize streaming session
                      signals.onOpen();

                      const decoder = new TextDecoder();
                      let buffer = '';

                      while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                          signals.onClose();
                          break;
                        }

                        // Decode and buffer chunks
                        buffer += decoder.decode(value, { stream: true });

                        // Process complete SSE lines (format: "data: {...}\n\n")
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                          if (line.trim() === '') continue;

                          if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                              signals.onClose();
                              return;
                            }

                            try {
                              const parsed = JSON.parse(data);

                              // Extract content from OpenAI-compatible SSE format
                              if (parsed.choices && parsed.choices[0]) {
                                const delta = parsed.choices[0].delta || {};
                                const content = delta.content || '';
                                const finishReason = parsed.choices[0].finish_reason;

                                if (content) {
                                  // Send chunk content - DeepChat appends automatically
                                  await signals.onResponse({ text: content });
                                }

                                if (finishReason) {
                                  signals.onClose();
                                  return;
                                }
                              }
                            } catch (parseError) {
                              console.error('[DeepChat] Error parsing SSE chunk:', parseError);
                            }
                          }
                        }
                      }
                    } catch (error: any) {
                      // Handle abort and other errors
                      if (error.name === 'AbortError') {
                        signals.onClose();
                        return;
                      }
                      console.error('[DeepChat] Streaming error:', error);
                      signals.onResponse({ error: error?.message || 'Unknown error occurred' });
                      signals.onClose();
                    }
                  }
                }
              : {
                  // Non-streaming: use simple connect
                  url: `${import.meta.env.VITE_BACKEND_BASE_URL}/api/proxies/proxy/${config.modelId}`
                }
          }
          requestInterceptor={(requestDetails) => {
            // Ensure stream parameter is set for non-streaming requests
            if (!config.streaming && requestDetails.body && typeof requestDetails.body === 'object') {
              requestDetails.body = {
                ...requestDetails.body,
                stream: false
              };
            }
            return requestDetails;
          }}
          responseInterceptor={
            config.streaming
              ? undefined
              : (response: any) => {
                  // Transform OpenAI format to DeepChat format for non-streaming responses
                  if (response && typeof response === 'object' && response.choices) {
                    const content = response.choices[0]?.message?.content;
                    if (content) {
                      return { text: content };
                    }
                  }
                  return response;
                }
          }
          onError={(error: any) => {
            console.error('[DeepChat] Error:', error);
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
            position: 'inside-right',
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
            }
          }}
          introMessage={{
            text: `Hi there! I'm ${config.botName || 'BUzz'}, a chatbot here to answer your ${config.supportTopics ? config.supportTopics : 'questions'}. What would you like to know? Remember, AI can sometimes make mistakes, so please double-check all information provided, especially for important decisions or factual claims.`
          }}
        >
          <div
            style={{
              width: '280px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '10px',
              padding: '16px',
              display: 'none'
            }}
          >
            <div>
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#856404'
                }}
              >
                Important Notice
              </div>
              <div style={{ fontSize: '14px', lineHeight: '20px', color: '#856404' }}>
                AI can sometimes make mistakes. Please double-check all information provided, especially for important
                decisions or factual claims.
              </div>
            </div>
          </div>
        </DeepChat>
      </Box>
    </Box>
  );
};
