import { Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const MappingList = () => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/mapping`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch langflow mappings');
        }
        const data = await response.json();
        setMappings(data);
      } catch (error) {
        console.error('Error fetching mappings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMappings();
  }, []);

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', flex: 1 },
    { field: 'model', headerName: 'Model Name', flex: 1 },
    { field: 'url', headerName: 'URL', flex: 2 },
    { field: 'historyComponentID', headerName: 'History Component ID', flex: 1.5 },
  ];

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={mappings}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </div>
    </Paper>
  );
};

export default MappingList;