import { Box, Typography, Paper, Grid } from '@mui/material';

const DashboardPage = () => {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Models Overview
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <Box>
                <Typography variant="h4">4</Typography>
                <Typography color="text.secondary">Total Models</Typography>
              </Box>
              <Box>
                <Typography variant="h4">2</Typography>
                <Typography color="text.secondary">Active Proxies</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Typography paragraph>
              Use the sidebar to navigate between Mappings and Proxying pages to manage your model configurations.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No recent activity to display.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
