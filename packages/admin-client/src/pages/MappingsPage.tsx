import { useState } from 'react';
import { Box } from '@mui/material';
import CreateMappingForm from '../components/mappings/CreateMappingForm';
import MappingHeader from '../components/mappings/MappingHeader';
import MappingList from '../components/mappings/MappingList';

const MappingsPage = () => {
  const [openForm, setOpenForm] = useState(false);

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  return (
    <Box>
      <MappingHeader onOpen={handleOpenForm} />
      <MappingList />
      <CreateMappingForm open={openForm} onClose={handleCloseForm} />
    </Box>
  );
};

export default MappingsPage;
