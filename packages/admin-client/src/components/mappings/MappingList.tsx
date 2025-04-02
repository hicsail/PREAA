import { Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { LangFlowMapping, langflowMappingControllerGetAll } from '../../client';

const MappingList = () => {
  const [mappings, setMappings] = useState<LangFlowMapping[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMappings = async () => {
      const response = await langflowMappingControllerGetAll();
      if (response.error) {
        console.log(response.error);
        return;
      }

      setMappings(response.data!);
      setLoading(false);
  };

  useEffect(() => {
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
