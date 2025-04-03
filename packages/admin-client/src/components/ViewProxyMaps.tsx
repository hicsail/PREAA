import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Paper } from '@mui/material';
import { DeepchatProxy, deepchatProxyControllerGetAll } from '../client';

export default function ViewProxyMaps() {
  const [rows, setRows] = useState<DeepchatProxy[]>([]);

  const fetchProxies = async () => {
    const response = await deepchatProxyControllerGetAll();
    if (response.error) {
      console.error('Failed to get proxies');
      console.error(response.error);
      return;
    }
    setRows(response.data!);
  }

  useEffect(() => {
    fetchProxies();
  }, []);

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', flex: 1 },
    { field: 'model', headerName: 'Model', flex: 1 },
    { field: 'url', headerName: 'URL', flex: 2 },
  ];

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
        />
      </div>
    </Paper>
  );
}
