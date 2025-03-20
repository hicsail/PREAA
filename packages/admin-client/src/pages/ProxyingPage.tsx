import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';

// Mock data - would come from API in a real implementation
const mockModels = [
  { id: 1, name: 'gpt-3.5-turbo', hasProxy: false },
  { id: 2, name: 'claude-2', hasProxy: true, uid: 'claude2-abc123', proxyIdKey: 'proxy_key_claude2' },
  { id: 3, name: 'llama-2-70b', hasProxy: false },
  { id: 4, name: 'mistral-medium', hasProxy: true, uid: 'mistral-xyz789', proxyIdKey: 'proxy_key_mistral' }
];

type ProxyFormData = {
  modelName: string;
  secretKey: string;
};

const ProxyingPage = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [formData, setFormData] = useState<ProxyFormData>({
    modelName: '',
    secretKey: ''
  });

  const handleOpenForm = (modelName: string) => {
    setSelectedModel(modelName);
    setFormData({
      modelName: modelName,
      secretKey: ''
    });
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreateProxy = () => {
    // This would call an API to create a proxy for the model
    console.log('Creating proxy for:', formData);
    // Implementation would:
    // 1. Create a proxy mapping
    // 2. Generate a unique ID
    // 3. Save to database
    handleCloseForm();
  };

  const handleGenerateUID = (modelId: number) => {
    // This would call an API to generate a new UID for the model
    console.log('Generating new UID for model ID:', modelId);
    // Implementation would generate and save a new UID
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Model Proxying</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>UID for Chat Completions</TableCell>
              <TableCell>Proxy ID Key</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockModels.map((model) => (
              <TableRow key={model.id}>
                <TableCell>{model.name}</TableCell>
                <TableCell>
                  {model.hasProxy ? (
                    <Typography color="success.main">Proxy Active</Typography>
                  ) : (
                    <Typography color="text.secondary">No Proxy</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {model.hasProxy ? model.uid : '-'}
                </TableCell>
                <TableCell>
                  {model.hasProxy ? model.proxyIdKey : '-'}
                </TableCell>
                <TableCell>
                  {model.hasProxy ? (
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleGenerateUID(model.id)}
                    >
                      Generate New UID
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => handleOpenForm(model.name)}
                    >
                      Create Proxy
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>Create Proxy for {selectedModel}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Model Name"
              name="modelName"
              value={formData.modelName}
              disabled
              fullWidth
            />
            <TextField
              label="Secret Key"
              name="secretKey"
              value={formData.secretKey}
              onChange={handleTextChange}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button 
            onClick={handleCreateProxy} 
            variant="contained"
            disabled={!formData.secretKey}
          >
            Create Proxy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProxyingPage; 