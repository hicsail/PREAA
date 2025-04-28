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
  MenuItem
} from '@mui/material';
import { liteLlmControllerCreate } from '../../client';
import { useSnackbar } from '../../contexts/Snackbar.context';

type CreateMappingFormProps = {
  open: boolean;
  onClose: () => void;
};

interface FormProps {
  provider: string;
  url: string;
  modelName: string;
  flowID: string;
  apiKey: string;
}

const CreateMappingForm = ({ open, onClose }: CreateMappingFormProps) => {
  const { showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<FormProps>({
    provider: 'langflow',
    url: '',
    flowID: '',
    modelName: '',
    apiKey: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const liteLLMResponse = await liteLlmControllerCreate({
        body: {
          model_name: formData.modelName,
          litellm_params: {
            model: formData.flowID,
            api_base: formData.url,
            api_key: formData.apiKey,
            custom_llm_provider: formData.provider
          }
        }
      });

      if (liteLLMResponse.error) {
        throw new Error(`Failed to create LiteLLM model: ${JSON.stringify(liteLLMResponse.error) || 'Unknown error'}`);
      }

      // Success case
      showSnackbar('Mapping created successfully!', 'success');

      // Reset Form Data
      setFormData({
        url: '',
        modelName: '',
        flowID: '',
        provider: 'langflow',
        apiKey: ''
      });

      // Close the dialog after a short delay to allow the user to see the success message
      onClose();
    } catch (error) {
      console.error(error);
      showSnackbar(error instanceof Error ? error.message : 'An unknown error occurred', 'error');
    }
  };

  return (
    <>
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
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                >
                  <MenuItem value="langflow">Langflow</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Base URL of LangFlow (no trailing slash)"
                name="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Human Readable Model Name"
                name="modelName"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                fullWidth
                required
                helperText="Must be unique"
              />
              <TextField
                label="LangFlow flow ID"
                name="flowID"
                value={formData.flowID}
                onChange={(e) => setFormData({ ...formData, flowID: e.target.value })}
                fullWidth
                required
                helperText="Must be unique"
              />
              <TextField
                label="API Key"
                name="apiKey"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                fullWidth
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default CreateMappingForm;
