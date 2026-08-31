import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Paper,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  Grid,
  FormControlLabel,
  Switch
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
  streaming: boolean;
  theme: {
    primary: string;
    background: string;
    text: string;
  };
}

// Backend that stores bot-level (server-side) settings — the same API the
// admin dashboard uses.
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

// Server-side state of the bot named by the Model ID field. Unlike the rest
// of this page (per-embed presentation config), these settings live in the
// backend and apply to the bot everywhere it is embedded.
type BotSettingsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; id: string; modelName: string; enabled: boolean; saving: boolean; saveFailed?: boolean }
  | { status: 'notfound' }
  | { status: 'error' };

const botSettingsUrl = (modelId: string) => `${BACKEND_BASE_URL}/api/proxies/${encodeURIComponent(modelId)}`;

const loadedBotSettings = (
  id: string,
  proxy: { modelName: string; suggestionsEnabled?: unknown }
): BotSettingsState => ({
  status: 'loaded',
  id,
  modelName: proxy.modelName,
  enabled: proxy.suggestionsEnabled === true,
  saving: false
});

// Demo page to showcase how to embed the widget
const App: React.FC = () => {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    modelId: '',
    title: 'May I help you?',
    botName: 'Hariri Chat',
    placeholder: 'Ask me anything about HIC @ BU...',
    supportTopics: 'BU HIC',
    botAvatarSrc: '/assets/bu-logo.svg',
    baseUrl: window.location.origin,
    language: 'en',
    streaming: false,
    theme: {
      primary: '#cc0000',
      background: '#ffffff',
      text: '#212121'
    }
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [botSettings, setBotSettings] = useState<BotSettingsState>({ status: 'idle' });

  // Current Model ID, readable from async completions so a stale response
  // never overwrites state that belongs to a different bot.
  const modelIdRef = useRef(widgetConfig.modelId);
  modelIdRef.current = widgetConfig.modelId;

  // Look up the bot's server-side settings whenever the Model ID changes.
  useEffect(() => {
    const modelId = widgetConfig.modelId;
    if (!modelId) {
      setBotSettings((prev) => (prev.status === 'idle' ? prev : { status: 'idle' }));
      return;
    }

    setBotSettings((prev) => (prev.status === 'loading' ? prev : { status: 'loading' }));
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(botSettingsUrl(modelId), { signal: controller.signal });
        if (response.ok) {
          const proxy = await response.json();
          setBotSettings(loadedBotSettings(modelId, proxy));
        } else if (response.status === 404) {
          setBotSettings({ status: 'notfound' });
        } else {
          setBotSettings({ status: 'error' });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Failed to load bot settings:', err);
          setBotSettings({ status: 'error' });
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [widgetConfig.modelId]);

  // Persist the follow-up-suggestions flag on the bot the panel has loaded.
  const toggleBotSuggestions = async (enabled: boolean) => {
    if (botSettings.status !== 'loaded' || botSettings.saving) return;
    const target = botSettings;
    setBotSettings({ ...target, enabled, saving: true, saveFailed: false });
    try {
      const response = await fetch(botSettingsUrl(target.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionsEnabled: enabled })
      });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      const proxy = await response.json();
      // The Model ID field moved on — the lookup effect owns the state now.
      if (modelIdRef.current !== target.id) return;
      setBotSettings(loadedBotSettings(target.id, proxy));
    } catch (err) {
      console.error('Failed to update follow-up suggestions:', err);
      if (modelIdRef.current !== target.id) return;
      setBotSettings({ ...target, saving: false, saveFailed: true });
    }
  };

  const botSuggestionsCaption = (): string => {
    switch (botSettings.status) {
      case 'idle':
        return 'Enter a Model ID above to load this bot’s setting';
      case 'loading':
        return 'Loading bot settings…';
      case 'notfound':
        return 'No bot found with this Model ID';
      case 'error':
        return 'Could not load bot settings';
      case 'loaded':
        if (botSettings.saving) return 'Saving…';
        if (botSettings.saveFailed) return 'Couldn’t save — check your connection and try again';
        return `Show clickable follow-up questions after each answer from “${botSettings.modelName}”`;
    }
  };

  // Function to safely escape strings for embedding in JavaScript source
  const escapeJsString = (str: string): string => {
    // Use JSON.stringify to handle quotes, backslashes, control chars, etc.,
    // then remove the surrounding quotes to embed into single-quoted literals.
    const jsonEscaped = JSON.stringify(str);
    const inner = jsonEscaped.substring(1, jsonEscaped.length - 1);
    // JSON.stringify never escapes single quotes, but the generated script
    // interpolates into single-quoted literals — escape them, plus characters
    // that could interfere with HTML parsing.
    return inner.replace(/'/g, '\\u0027').replace(/</g, '\\u003C').replace(/>/g, '\\u003E').replace(/&/g, '\\u0026');
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
      language: '${escapeJsString(widgetConfig.language)}',
      streaming: ${widgetConfig.streaming}
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
      language: widgetConfig.language,
      streaming: widgetConfig.streaming
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
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Widget Configuration
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              {/* Basic Settings */}
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Basic Settings
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Model ID"
                  fullWidth
                  value={widgetConfig.modelId}
                  onChange={(e) =>
                    setWidgetConfig({
                      ...widgetConfig,
                      // Trimmed at the source so the lookup, the saved setting,
                      // and the generated embed script all target the same id.
                      modelId: e.target.value.trim()
                    })
                  }
                  helperText="Required — the ID of the AI model to use"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
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

              <Grid size={{ xs: 12, sm: 6 }}>
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

              <Grid size={{ xs: 12, sm: 6 }}>
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

              <Grid size={12}>
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

              <Grid size={12}>
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

              <Grid size={12}>
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

              <Grid size={{ xs: 12, sm: 6 }}>
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

              <Grid size={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.streaming}
                      onChange={(e) =>
                        setWidgetConfig({
                          ...widgetConfig,
                          streaming: e.target.checked
                        })
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Enable Streaming
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enable real-time streaming responses for better user experience
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              {/* Bot Settings (server-side, keyed by Model ID) */}
              <Grid size={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Bot Settings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unlike the settings above, these are saved on the bot itself and apply everywhere this Model ID is
                  embedded.
                </Typography>
              </Grid>

              <Grid size={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={botSettings.status === 'loaded' && botSettings.enabled}
                      disabled={botSettings.status !== 'loaded' || botSettings.saving}
                      onChange={(e) => toggleBotSuggestions(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Follow-up suggestions
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {botSuggestionsCaption()}
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              {/* Theme Settings */}
              <Grid size={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Theme Settings
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
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

              <Grid size={{ xs: 12, sm: 4 }}>
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

              <Grid size={{ xs: 12, sm: 4 }}>
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
              <Button variant="contained" color="primary" onClick={loadWidget} disabled={!widgetConfig.modelId}>
                Test Widget
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={copySuccess ? <CheckIcon /> : <ContentCopyIcon />}
                onClick={copyToClipboard}
                disabled={!widgetConfig.modelId}
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
        <Grid size={{ xs: 12, md: 4 }}>
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
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{generateScript()}</pre>
            </Box>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              startIcon={<ContentCopyIcon />}
              onClick={copyToClipboard}
              disabled={!widgetConfig.modelId}
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
        <Alert onClose={handleCloseSnackbar} severity={copySuccess ? 'success' : 'error'} sx={{ width: '100%' }}>
          {copySuccess ? 'Script copied to clipboard!' : 'Failed to copy script'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default App;
