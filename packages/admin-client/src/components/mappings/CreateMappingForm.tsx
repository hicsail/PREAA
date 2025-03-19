import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MappingFormData } from '../../types/mapping-form';
import { LangFlowMapping} from '../../types/langflow-mapping';
import { createLangFlowMapping } from '../../services/endpoints';

type CreateMappingFormProps = {
  open: boolean;
  onClose: () => void;
};

const CreateMappingForm = ({ open, onClose }: CreateMappingFormProps) => {
  const [formData, setFormData] = useState<MappingFormData>({
    url: '',
    modelName: '',
    historyComponentID: '',
    provider: 'Langflow'
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const langflowData: LangFlowMapping = {
        model: formData.modelName,
        url: formData.url,
        historyComponentID: formData.historyComponentID
      };
  
      const response = await createLangFlowMapping(langflowData);
      console.log('API Response:', response);
      
    } catch (error) {
      console.error('Error creating mapping:', error);
    }

    // Reset Form Data
    setFormData({
      url: '',
      modelName: '',
      historyComponentID: '',
      provider: 'Langflow'
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Mapping</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="provider-label">Provider</InputLabel>
              <Select
                labelId="provider-label"
                name="provider"
                value={formData.provider}
                label="Provider"
                onChange={e => setFormData({ ...formData, provider: e.target.value })}
              >
                <MenuItem value="Langflow">Langflow</MenuItem>
                </Select>
            </FormControl>
            <TextField
              label="URL of Langflow Model"
              name="url"
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Model Name"
              name="modelName"
              value={formData.modelName}
              onChange={e => setFormData({ ...formData, modelName: e.target.value })}
              fullWidth
              required
              helperText="Must be unique"
            />
            <TextField
              label="History Component ID"
              name="historyComponentID"
              value={formData.historyComponentID}
              onChange={e => setFormData({ ...formData, historyComponentID: e.target.value })}
              fullWidth
              required
              helperText="Same as Completion ID"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Submit</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateMappingForm; 