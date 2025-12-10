import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Paper,
  Grid,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface WidgetConfig {
  modelId: string;
  title: string;
  botName: string;
  placeholder: string;
  supportTopics: string;
  botAvatarSrc: string;
  baseUrl: string;
  language: string;
  theme: {
    primary: string;
    background: string;
    text: string;
  };
}

// Demo page to showcase how to embed the widget
const App: React.FC = () => {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    modelId: '688a954d91c7a967e8ad6584',
    title: 'May I help you?',
    botName: 'Hariri Chat',
    placeholder: 'Ask me anything about HIC @ BU...',
    supportTopics: 'BU HIC',
    botAvatarSrc: '/assets/bu-logo.svg',
    baseUrl: 'https://embedded-preaa.sail.codes',
    language: 'en',
    theme: {
      primary: '#c00',
      background: '#ffffff',
      text: '#212121'
    }
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Function to escape single quotes for JavaScript strings
  const escapeJsString = (str: string): string => {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  };

  // Function to generate the script tag
  const generateScript = (): string => {
    return `<script>
  (function() {
    // Widget configuration
    window.chatWidgetConfig = {
      modelId: '${escapeJsString(widgetConfig.modelId)}',
      title: '${escapeJsString(widgetConfig.title)}',
      botName: '${escapeJsString(widgetConfig.botName)}',
      placeholder: '${escapeJsString(widgetConfig.placeholder)}',
      supportTopics: '${escapeJsString(widgetConfig.supportTopics)}',
      botAvatarSrc: '${escapeJsString(widgetConfig.botAvatarSrc)}',
      theme: {
        primary: '${escapeJsString(widgetConfig.theme.primary)}',
        background: '${escapeJsString(widgetConfig.theme.background)}',
        text: '${escapeJsString(widgetConfig.theme.text)}'
      },
      baseUrl: '${escapeJsString(widgetConfig.baseUrl)}',
      language: '${escapeJsString(widgetConfig.language)}'
    };

    // Load the widget script
    const script = document.createElement('script');
    script.src = window.chatWidgetConfig.baseUrl + '/chatWidget.js';
    script.async = true;
    script.onload = function() {
      console.log('Chat widget loaded successfully');
      // Automatically open the widget after loading
      setTimeout(() => window.chatWidget.open(), 1000);
    };
    script.onerror = function() {
      console.error('Failed to load chat widget');
    };
    document.body.appendChild(script);
  })();
</script>`;
  };

  // Function to copy script to clipboard
  const copyToClipboard = async () => {
    try {
      const script = generateScript();
      await navigator.clipboard.writeText(script);
      setCopySuccess(true);
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopySuccess(false);
      setSnackbarOpen(true);
    }
  };

  // Function to load the widget script for testing
  const loadWidget = () => {
    // Set global config
    (window as any).chatWidgetConfig = {
      modelId: widgetConfig.modelId,
      title: widgetConfig.title,
      botName: widgetConfig.botName,
      placeholder: widgetConfig.placeholder,
      supportTopics: widgetConfig.supportTopics,
      botAvatarSrc: widgetConfig.botAvatarSrc,
      theme: widgetConfig.theme,
      baseUrl: widgetConfig.baseUrl,
      language: widgetConfig.language
    };

    // Remove existing widget if present
    const existingContainer = document.getElementById('chat-widget-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create script element
    const script = document.createElement('script');
    script.src = '/chatWidget.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Chat Widget Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure your chat widget settings and generate the embed script for your website.
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Widget Configuration
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {/* Basic Settings */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Basic Settings
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Model ID"
                  fullWidth
                  value={widgetConfig.modelId}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      modelId: e.target.value
                    })
                  }
                  helperText="The ID of the AI model to use"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Base URL"
                  fullWidth
                  value={widgetConfig.baseUrl}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      baseUrl: e.target.value
                    })
                  }
                  helperText="Base URL where the widget is hosted"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Title"
                  fullWidth
                  value={widgetConfig.title}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      title: e.target.value
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Bot Name"
                  fullWidth
                  value={widgetConfig.botName}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      botName: e.target.value
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Placeholder Text"
                  fullWidth
                  value={widgetConfig.placeholder}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      placeholder: e.target.value
                    })
                  }
                  helperText="Placeholder text shown in the input field"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Support Topics"
                  fullWidth
                  value={widgetConfig.supportTopics}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      supportTopics: e.target.value
                    })
                  }
                  helperText="Topics the bot can help with (comma-separated)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Bot Avatar Source"
                  fullWidth
                  value={widgetConfig.botAvatarSrc}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      botAvatarSrc: e.target.value
                    })
                  }
                  helperText="URL or path to the bot avatar image"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Language"
                  fullWidth
                  value={widgetConfig.language}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      language: e.target.value
                    })
                  }
                  helperText="Language code (e.g., en, es, fr)"
                />
              </Grid>

              {/* Theme Settings */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Theme Settings
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Primary Color"
                  fullWidth
                  type="color"
                  value={widgetConfig.theme.primary}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      theme: {
                        ...widgetConfig.theme,
                        primary: e.target.value
                      }
                    })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            bgcolor: widgetConfig.theme.primary,
                            border: '1px solid #ccc'
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Background Color"
                  fullWidth
                  type="color"
                  value={widgetConfig.theme.background}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      theme: {
                        ...widgetConfig.theme,
                        background: e.target.value
                      }
                    })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            bgcolor: widgetConfig.theme.background,
                            border: '1px solid #ccc'
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Text Color"
                  fullWidth
                  type="color"
                  value={widgetConfig.theme.text}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      theme: {
                        ...widgetConfig.theme,
                        text: e.target.value
                      }
                    })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            bgcolor: widgetConfig.theme.text,
                            border: '1px solid #ccc'
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={loadWidget}>
                Test Widget
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={copySuccess ? <CheckIcon /> : <ContentCopyIcon />}
                onClick={copyToClipboard}
              >
                Copy Script to Clipboard
              </Button>
            </Box>
          </Paper>

          {/* Widget Controls */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Widget Controls
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={() => (window as any).chatWidget?.open()}>
                Open Chat
              </Button>
              <Button variant="outlined" onClick={() => (window as any).chatWidget?.close()}>
                Minimize Chat
              </Button>
              <Button variant="outlined" onClick={() => (window as any).chatWidget?.toggle()}>
                Toggle Chat
              </Button>
              <Button variant="outlined" color="error" onClick={() => (window as any).chatWidget?.hide()}>
                Hide Widget
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Script Preview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Generated Script
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                p: 2,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                maxHeight: '600px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.75rem'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {generateScript()}
              </pre>
            </Box>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              startIcon={<ContentCopyIcon />}
              onClick={copyToClipboard}
            >
              Copy Script
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={copySuccess ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {copySuccess ? 'Script copied to clipboard!' : 'Failed to copy script'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default App;
