import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ChatProvider } from './contexts/ChatContext';
import { ChatWidgetComponent } from './components/ChatWidget/ChatWidget';

// Parse URL parameters to get configuration
const parseConfig = () => {
  const params = new URLSearchParams(window.location.search);
  const config: any = {};
  
  // Extract all parameters
  for (const [key, value] of params.entries()) {
    // Try to parse JSON objects (like theme)
    try {
      if (key === 'theme' || key.includes('Config')) {
        config[key] = JSON.parse(value);
      } else {
        config[key] = value;
      }
    } catch (e) {
      config[key] = value;
    }
  }
  
  // Always set embedded to true
  config.isEmbedded = true;
  
  return config;
};

const config = parseConfig();

// Create theme from config
const theme = createTheme({
  palette: {
    primary: {
      main: config.theme?.primary || '#d32f2f',
    },
    secondary: {
      main: config.theme?.secondary || '#f5f5f5',
    },
    text: {
      primary: config.theme?.text || '#212121',
    },
    background: {
      default: 'transparent',
      paper: config.theme?.background || '#ffffff',
    },
  },
});

// Render the widget
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatProvider config={config}>
        <ChatWidgetComponent />
      </ChatProvider>
    </ThemeProvider>
  </React.StrictMode>
);