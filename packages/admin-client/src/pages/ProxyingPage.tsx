import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import CreateProxyMaps from '../components/CreateProxyMaps';
import ViewProxyMaps from '../components/ViewProxyMaps';

const ProxyingPage = () => {
  const [openProxyForm, setOpenProxyForm] = useState(false);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Model Proxying
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setOpenProxyForm(!openProxyForm);
          }}
        >
          Create Proxy Map
        </Button>
      </Box>
      <CreateProxyMaps open={openProxyForm} setOpen={setOpenProxyForm} />
      <ViewProxyMaps />
    </Box>
  );
};

export default ProxyingPage;
