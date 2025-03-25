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
import { LiteLLMMapping } from '../../types/litellm-mapping';
import { LangFlowMapping } from '../../types/langflow-mapping';
import { createLangFlowMapping, createNewModelLiteLLM } from '../../services/endpoints';

type CreateMappingFormProps = {
  open: boolean;
  onClose: () => void;
};

<<<<<<< HEAD
export type MappingFormData = {
  url: string;
  modelName: string;
  historyComponentID: string;
  provider: string;
};

const CreateMappingForm = ({ open, onClose, onSubmit }: CreateMappingFormProps) => {
  const [formData, setFormData] = useState<MappingFormData>({
    url: '',
    modelName: '',
    historyComponentID: '',
    provider: 'Langflow'
=======
const CreateMappingForm = ({ open, onClose }: CreateMappingFormProps) => {
  const [formData, setFormData] = useState<LiteLLMMapping>({
    provider: 'langflow',
    url: '',
    modelName: '',
    historyComponentID: '',
    apiKey: '',
>>>>>>> f26343756422e509f3c16b3bdbb0825e51f94a81
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const langflowData: LangFlowMapping= {
        model: formData.modelName,
        url: formData.url,
        historyComponentID: formData.historyComponentID
      };
  
      const langFlowResponse = await createLangFlowMapping(langflowData);
      console.log('API Response:', langFlowResponse);

      const liteLLMResponse = await createNewModelLiteLLM(formData);
      console.log('API Response:', liteLLMResponse);
      
    } catch (error) {
      console.error('Error creating mapping:', error);
    }

    // Reset Form Data
    setFormData({
      url: '',
      modelName: '',
      historyComponentID: '',
<<<<<<< HEAD
      provider: 'Langflow'
=======
      provider: 'langflow',
      apiKey: '',
>>>>>>> f26343756422e509f3c16b3bdbb0825e51f94a81
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Mapping</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
<<<<<<< HEAD
            <TextField
              label="URL of Langflow Model"
              name="url"
              value={formData.url}
              onChange={handleTextChange}
              fullWidth
              required
            />
            <TextField
              label="Model Name"
              name="modelName"
              value={formData.modelName}
              onChange={handleTextChange}
              fullWidth
              required
              helperText="Must be unique"
            />
            <TextField
              label="History Component ID"
              name="historyComponentID"
              value={formData.historyComponentID}
              onChange={handleTextChange}
              fullWidth
              required
              helperText="Same as Completion ID"
            />
=======
>>>>>>> f26343756422e509f3c16b3bdbb0825e51f94a81
            <FormControl fullWidth>
              <InputLabel id="provider-label">Provider</InputLabel>
              <Select
                labelId="provider-label"
                name="provider"
                value={formData.provider}
                label="Provider"
                onChange={e => setFormData({ ...formData, provider: e.target.value })}
              >
                <MenuItem value="langflow">Langflow</MenuItem>
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
              label="API Key"
              name="apiKey"
              value={formData.apiKey}
              onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
              fullWidth
              required
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