import { useState } from 'react';
import { Box, Button, Typography, Paper, Snackbar, Alert } from '@mui/material';
import CreateMappingForm, { MappingFormData } from '../components/mappings/CreateMappingForm';
import { createLangFlowMapping } from '../services/endpoints';
import { LangFlowMapping } from '../types/langflow-mapping';

const MappingsPage = () => {
  const [openForm, setOpenForm] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmitMapping = async (formData: MappingFormData) => {
    try {
      // Convert MappingFormData to LangFlowMapping
      const langflowData: LangFlowMapping = {
        model: formData.modelName,
        url: formData.url,
        historyComponentID: formData.historyComponentID
      };

      // Call the API to create the mapping
      const response = await createLangFlowMapping(langflowData);
      console.log('API Response:', response);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Model mapping created successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating mapping:', error);
      
      // Show error message
      setSnackbar({
        open: true,
        message: 'Failed to create model mapping. Please try again.',
        severity: 'error'
      });
    }
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

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MappingsPage; 