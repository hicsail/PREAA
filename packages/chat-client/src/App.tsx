import { useEffect, useState, useRef } from 'react'
import { DeepChat } from "deep-chat-react";
import './App.css'
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

// Define types for messages
interface MessageContent {
  text?: string;
  html?: string;
  files?: File[];
  role: 'user' | 'assistant';
  [key: string]: any;
}

function App() {
  const [modelId, setModelId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<MessageContent[]>([]);
  const chatRef = useRef<any>(null);
  
  // fetch modelId parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modelId = urlParams.get('modelId');
    if (modelId) {
      fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/deepchat-proxy/${modelId}`)
        .then(response => response.json())
        .then(data => {
          if (data) {
            setModelId(modelId);
          }
        })
        .catch(_error => {
          setErrorMessage('Error while fetching modelId');
        });
    }
  }, []);

  // Save messages when minimizing
  const handleMinimize = () => {
    if (chatRef.current) {
      try {
        const messages = chatRef.current.getMessages();
        if (messages && messages.length > 0) {
          setChatMessages(messages);
        }
      } catch (error) {
        console.error("Failed to get messages:", error);
      }
    }
    setMinimized(true);
  };

  // Restore messages when maximizing
  const handleMaximize = () => {
    setMinimized(false);

    // Use a timeout to ensure the component is rendered before restoring messages
    setTimeout(() => {
      if (chatRef.current && chatMessages.length > 0) {
        try {
          // Clear existing messages
          chatRef.current.clearMessages(true);
          
          // Add saved messages one by one
          chatMessages.forEach(message => {
            chatRef.current.addMessage(message, false);
          });
          
          // Scroll to bottom
          chatRef.current.scrollToBottom();
        } catch (error) {
          console.error("Failed to restore messages:", error);
        }
      }
    }, 100);
  };

  // return error message if modelId is not provided
  if (!modelId && !errorMessage) {
    return <div><h1>Loading...</h1></div>;
  }

  if (errorMessage || !modelId) {
    return (
      <div>
        <h1>Error: modelId parameter is missing</h1>
        {errorMessage && <p>{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="chat-widget-container">
      {minimized ? (
        <div className="chat-widget-button">
          <IconButton 
            onClick={handleMaximize}
            color="primary"
            aria-label="open chat"
            sx={{ 
              backgroundColor: '#0d6efd',
              color: 'white',
              '&:hover': {
                backgroundColor: '#0b5ed7',
              },
              width: '50px',
              height: '50px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <ChatIcon />
          </IconButton>
        </div>
      ) : (
        <div className="chat-widget-expanded">
          <div className="chat-widget-header">
            <span>Chat Assistant</span>
            <IconButton 
              onClick={handleMinimize}
              size="small"
              aria-label="minimize chat"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <div className="chat-widget-body">
            <DeepChat
              ref={chatRef}
              requestBodyLimits={{ maxMessages: -1 }}
              connect={{
                url: `${import.meta.env.VITE_BACKEND_BASE_URL}/deepchat-proxy/proxy/${modelId}`,
              }}
              className="deep-chat-full-size"
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App;