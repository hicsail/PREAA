import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Input,
  InputLabel
} from '@mui/material';
import { deepchatProxyControllerCreate } from '../client';
import { useSnackbar } from '../contexts/Snackbar.context';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function CreateProxyMaps({ open, setOpen }: Props) {
  const { showSnackbar } = useSnackbar();

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const model = form.querySelector('#model-name') as HTMLInputElement;
    const baseUrl = form.querySelector('#base-url') as HTMLInputElement;
    const key = form.querySelector('#key') as HTMLInputElement;

    try {
      const response = await deepchatProxyControllerCreate({
        body: {
          model: model.value,
          url: baseUrl.value,
          apiKey: key.value
        }
      });

      if (response.error) {
        throw new Error(response.error.toString() || 'Failed to create proxy mapping');
      }

      showSnackbar('Proxy mapping created successfully', 'success');
      setOpen(false);
    } catch (error) {
      console.error('Failed to make deepchat proxy', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to create proxy mapping', 'error');
    }
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Create Proxy Mapping</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel htmlFor="model-name">Model Name</InputLabel>
            <Input id="model-name" />
            <FormHelperText>The name of the model from litellm you want to create a proxy for.</FormHelperText>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel htmlFor="base-url">Base URL</InputLabel>
            <Input id="base-url" />
            <FormHelperText>Base URL for the proxy mapping.</FormHelperText>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel htmlFor="key">Lite LLM Key</InputLabel>
            <Input id="key" />
            <FormHelperText>API Key for the model</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
