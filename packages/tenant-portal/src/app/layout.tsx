import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './lib/auth/config';
import SessionProvider from './components/SessionProvider';
import theme from './theme';

export const metadata: Metadata = {
  title: 'Tenant Portal',
  description:
    'Provision and configure embedded-chat tenants across Langflow, Langfuse, and LiteLLM.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Hydrate the client-side session provider with the server-side session so
  // the initial render isn't a flash of "signed out" before the JWT cookie
  // is consulted client-side.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SessionProvider session={session}>{children}</SessionProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
