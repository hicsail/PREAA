import { getServerSession } from 'next-auth/next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { authOptions } from '@/app/lib/auth/config';

/**
 * Tenant dashboard — stub. Replaced in commit 10 with the real configure /
 * embed-snippet / deep-link UI. Renders only as evidence the middleware
 * allowed a tenant-role'd (or admin-role'd) user through.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Typography variant="h4" fontWeight={700}>
            Dashboard
          </Typography>

          <Alert severity="info">
            This is a placeholder. Real tenant dashboard (embed snippet,
            chat config form, LiteLLM/Langfuse deep links) lands in a later
            commit.
          </Alert>

          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Session
            </Typography>
            <Typography variant="body2">
              {session?.user?.email ?? session?.user?.name ?? 'no email'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {(session?.realmRoles ?? []).map((r) => (
                <Chip key={r} label={r} size="small" />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
