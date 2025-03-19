import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';

type CreateMappingFormProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: MappingFormData) => void;
};

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
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form
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
            <FormControl fullWidth>
              <InputLabel id="provider-label">Provider</InputLabel>
              <Select
                labelId="provider-label"
                name="provider"
                value={formData.provider}
                label="Provider"
                onChange={handleSelectChange}
              >
                <MenuItem value="Langflow">Langflow</MenuItem>
              </Select>
            </FormControl>
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