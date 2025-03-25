import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, Input, InputLabel, Snackbar, Alert } from '@mui/material'
import { createProxy } from '../../services/apiService';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateProxyMaps({ open, setOpen, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const form = e.currentTarget;
    const model = form.querySelector('#model-name') as HTMLInputElement;
    const baseUrl = form.querySelector('#base-url') as HTMLInputElement;
    const key = form.querySelector('#key') as HTMLInputElement;

    // Make sure all required fields have values
    if (!model.value || !baseUrl.value || !key.value) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    const payload = {
      model: model.value,
      url: baseUrl.value,
      apiKey: key.value
    };

    try {
      await createProxy(payload);
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error creating proxy mapping:', err);
      setError(err.response?.data?.message || 'Failed to create proxy mapping');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Create Proxy Mapping</DialogTitle>
        <form onSubmit={handleSubmit}>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="model-name">Model Name</InputLabel>
            <Input id="model-name" required />
            <FormHelperText>
              The name of the model from litellm you want to create a proxy for.
            </FormHelperText>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="base-url">Base URL</InputLabel>
            <Input id="base-url" required />
            <FormHelperText>
              Base URL for the proxy mapping.
            </FormHelperText>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="key">API Key</InputLabel>
            <Input id="key" required type="password" />
            <FormHelperText>
              API Key for the model (apiKey field in database)
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Submit'}
          </Button>
        </DialogActions>
        </form>
      </Dialog>
      
      {error && (
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      )}
    </>
  )
}
