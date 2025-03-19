import { Dialog, DialogTitle } from '@mui/material'

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;    
} 

export default function CreateProxyMaps({open, setOpen}: Props) {

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Create Proxy Mapping</DialogTitle>
    </Dialog>
  )
}
