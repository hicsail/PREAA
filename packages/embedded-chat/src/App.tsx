import React, { useState } from 'react';
import { Box, Button, Container, Typography, TextField, Paper } from '@mui/material';

// Demo page to showcase how to embed the widget
const App: React.FC = () => {
  const [widgetConfig, setWidgetConfig] = useState({
    modelId: 'demo-model',
    title: 'Chat with us',
    theme: {
      primary: '#1976d2',
      background: '#ffffff'
    }
  });
  
  // Function to load the widget script
  const loadWidget = () => {
    // Set global config
    (window as any).chatWidgetConfig = widgetConfig;
    
    // Create script element
    const script = document.createElement('script');
    script.src = '/chatWidget.js';
    script.async = true;
    document.body.appendChild(script);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Chat Widget Demo
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Widget Configuration
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Model ID"
            fullWidth
            margin="normal"
            value={widgetConfig.modelId}
            onChange={(e) => setWidgetConfig({
              ...widgetConfig,
              modelId: e.target.value
            })}
          />
          
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={widgetConfig.title}
            onChange={(e) => setWidgetConfig({
              ...widgetConfig,
              title: e.target.value
            })}
          />
          
          <TextField
            label="Primary Color"
            fullWidth
            margin="normal"
            value={widgetConfig.theme.primary}
            onChange={(e) => setWidgetConfig({
              ...widgetConfig,
              theme: {
                ...widgetConfig.theme,
                primary: e.target.value
              }
            })}
          />
        </Box>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={loadWidget}
        >
          Load Widget
        </Button>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Widget Controls
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => (window as any).chatWidget?.open()}
          >
            Open Chat
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => (window as any).chatWidget?.close()}
          >
            Minimize Chat
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => (window as any).chatWidget?.toggle()}
          >
            Toggle Chat
          </Button>
          
          <Button 
            variant="outlined"
            color="error"
            onClick={() => (window as any).chatWidget?.hide()}
          >
            Hide Widget
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default App;