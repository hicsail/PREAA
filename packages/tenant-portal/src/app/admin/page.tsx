import { getServerSession } from 'next-auth/next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { authOptions } from '@/app/lib/auth/config';

/**
 * Admin home — stub. Replaced in commit 9 with the real tenants list +
 * grant-access flow. Renders only as evidence the middleware allowed an
 * admin-role'd user through.
 */
export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Typography variant="h4" fontWeight={700}>
            Admin
          </Typography>

          <Alert severity="info">
            This is a placeholder. Real admin UI (tenant list, grant-access
            form, provisioning status) lands in a later commit.
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
