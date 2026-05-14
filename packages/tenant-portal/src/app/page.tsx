'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import { ROLES, isAdmin, isTenant } from './lib/auth/roles';

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!session) {
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
          <Stack spacing={4} alignItems="center">
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
              onClick={() => signIn('keycloak')}
              sx={{ minWidth: 280 }}
            >
              Sign in with Keycloak
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  const roles = session.realmRoles ?? [];
  const admin = isAdmin(roles);
  const tenant = isTenant(roles);

  return (
    <Container maxWidth="md">
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 8 }}>
        <Stack spacing={5}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4" component="h1" fontWeight={700}>
              Tenant Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Signed in as {session.user?.email ?? session.user?.name ?? '(no email)'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              {roles.length === 0 && (
                <Chip label="no realm roles assigned" color="warning" size="small" />
              )}
              {roles.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  size="small"
                  color={
                    r === ROLES.ADMIN
                      ? 'primary'
                      : r === ROLES.TENANT
                        ? 'secondary'
                        : 'default'
                  }
                />
              ))}
            </Stack>
          </Stack>

          <Stack spacing={2} alignItems="center">
            {admin && (
              <Button
                component={Link}
                href="/admin"
                variant="contained"
                size="large"
                sx={{ minWidth: 320 }}
              >
                Admin · manage tenants
              </Button>
            )}
            {tenant && (
              <Button
                component={Link}
                href="/dashboard"
                variant={admin ? 'outlined' : 'contained'}
                size="large"
                sx={{ minWidth: 320 }}
              >
                Tenant · configure my chat
              </Button>
            )}
            {!admin && !tenant && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 480 }}>
                Your account doesn&apos;t have any tenant-portal roles yet. Ask an
                administrator to grant access.
              </Typography>
            )}
            <Button
              onClick={() => signOut()}
              startIcon={<LogoutIcon />}
              color="inherit"
              size="small"
              sx={{ mt: 2 }}
            >
              Sign out
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
