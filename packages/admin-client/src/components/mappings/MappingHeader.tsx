import { Box, Button, Typography } from '@mui/material';

type MappingHeaderProps = {
  onOpen: () => void;
};

const MappingHeader = ({ onOpen }: MappingHeaderProps) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5">Model Mappings</Typography>
      <Button variant="contained" color="primary" onClick={onOpen}>
        Create Mapping
      </Button>
    </Box>
  );
};

export default MappingHeader;
