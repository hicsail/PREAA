import { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, CssBaseline } from '@mui/material';
import Sidebar from './Sidebar';

type MainLayoutProps = {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            PREAA Admin
          </Typography>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout; 