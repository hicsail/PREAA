import { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import CreateMappingForm, { MappingFormData } from './CreateMappingForm';

const MappingsPage = () => {
  const [openForm, setOpenForm] = useState(false);

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleSubmitMapping = (formData: MappingFormData) => {
    // This would call an API to store the mapping and configure LiteLLM
    console.log('Submitting mapping:', formData);
    // Implementation would:
    // 1. Store mapping in database
    // 2. Call LiteLLM's API to add the model
    // 3. Create mappings for both Langflow and Deep Chat proxies
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Model Mappings</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenForm}
        >
          Create Mapping
        </Button>
      </Box>

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

      <CreateMappingForm 
        open={openForm} 
        onClose={handleCloseForm} 
        onSubmit={handleSubmitMapping} 
      />
    </Box>
  );
};

export default MappingsPage; 