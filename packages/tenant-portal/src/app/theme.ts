'use client';

import { createTheme } from '@mui/material/styles';

// Minimal default theme. Branding / color customizations should land here
// when the embedded-chat per-tenant theming model is ready.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f6feb' },
    secondary: { main: '#6e7681' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

export default theme;
