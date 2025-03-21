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
} from '@mui/material';

import CreateProxyMaps from '../components/CreateProxyMaps';

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
  const [openProxyForm, setOpenProxyForm] = useState(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 12 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Model Proxying</Typography>
      <Button variant="contained" color="primary" onClick={()=>{
        setOpenProxyForm(!openProxyForm);
      }}>Create Proxy Map</Button>
      </Box>
      <CreateProxyMaps open={openProxyForm} setOpen={setOpenProxyForm} />
    </Box>
  );
};

export default ProxyingPage; 