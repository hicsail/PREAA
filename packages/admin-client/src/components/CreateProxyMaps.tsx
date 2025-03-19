import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, Input, InputLabel } from '@mui/material'

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function CreateProxyMaps({ open, setOpen }: Props) {

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Create Proxy Mapping</DialogTitle>
      <DialogContent>
        <FormControl fullWidth>
          <InputLabel htmlFor="model-name">Model Name</InputLabel>
          <Input id="model-name" />
          <FormHelperText>
            The name of the model from litellm you want to create a proxy for.
          </FormHelperText>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel htmlFor="base-url">Base URL</InputLabel>
          <Input id="base-url" />
          <FormHelperText>
            Base URL for the proxy mapping.
          </FormHelperText>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel htmlFor="key">Lite LLM Key</InputLabel>
          <Input id="key" />
          <FormHelperText>
            API Key for the model
          </FormHelperText>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit" variant="contained">Submit</Button>
      </DialogActions>
    </Dialog>
  )
}
