import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Paper } from '@mui/material';

export default function ViewProxyMaps() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/deepchat-proxy`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch deepchat proxies');
        }
        const data = await response.json();
        setRows(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
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
          // If Mongoose documents contain `_id` instead of `id`, you can map it like this:
          getRowId={(row) => row._id}
        // Alternatively, if your backend returns 'id' already, just omit getRowId prop.
        />
      </div>
    </Paper>
  );
}
