'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Landing / sign-in page.
 *
 * Auth wiring is intentionally deferred to the next commit. For now the
 * "Sign in with Keycloak" button is a non-functional placeholder so the
 * scaffold builds and renders without requiring NextAuth env vars to be
 * present.
 */
export default function HomePage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 8,
        }}
      >
        <Stack spacing={4} alignItems="center" sx={{ width: '100%' }}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h3" component="h1" fontWeight={700} textAlign="center">
              Tenant Portal
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Configure your embedded chat. View your usage and traces.
            </Typography>
          </Stack>

          <Button
            variant="contained"
            size="large"
            startIcon={<LockIcon />}
            disabled
            sx={{ minWidth: 280 }}
          >
            Sign in with Keycloak
          </Button>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            Auth wiring lands in the next commit.
          </Typography>
        </Stack>
      </Box>
    </Container>
  );
}
