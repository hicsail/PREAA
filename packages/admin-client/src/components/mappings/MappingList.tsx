import { Box, Paper, Typography } from '@mui/material';

const MappingList = () => {
  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Mappings List</Typography>
      <Box 
        sx={{ 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px dashed #ccc',
          borderRadius: 1
        }}
      >
        <Typography color="text.secondary">
          LiteLLM Models Screen Placeholder
        </Typography>
      </Box>
    </Paper>
  );
};

export default MappingList;