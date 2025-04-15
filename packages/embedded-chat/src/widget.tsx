// src/widget.tsx - Main entry point for the embedded widget
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ChatWidget } from './components/ChatWidget';
import { parseConfigFromUrl } from './config';

// Parse configuration from URL parameters
const config = parseConfigFromUrl();

// Create theme from config
const theme = createTheme({
  palette: {
    primary: {
      main: config.theme?.primary || '#d32f2f'
    },
    background: {
      default: 'transparent',
      paper: config.theme?.background || '#ffffff'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          background-color: transparent !important;
        }
      `
    }
  }
});

// Render the widget
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatWidget config={config} />
    </ThemeProvider>
  </React.StrictMode>
);
