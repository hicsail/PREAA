import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowId } from '@mui/x-data-grid';
import { Alert, Paper, Snackbar } from '@mui/material';
import { DeepchatProxy, deepchatProxyControllerGetAll, deepchatProxyControllerDelete } from '../client';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ViewProxyMaps() {
  const [rows, setRows] = useState<DeepchatProxy[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDeleteClick = (id: GridRowId, model: string) => async () => {
    try {
      const response = await deepchatProxyControllerDelete({ 
        path: { model }
      });
      
      if (response.error) {
        throw new Error(response.error.toString() || 'Failed to delete proxy');
      }
      
      setRows(rows.filter((row) => row._id.toString() !== id.toString()));
      setSnackbar({
        open: true,
        message: 'Proxy deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting proxy:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete proxy',
        severity: 'error',
      });
    }
  };

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', flex: 1 },
    { field: 'model', headerName: 'Model', flex: 1 },
    { field: 'url', headerName: 'URL', flex: 2 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={handleDeleteClick(params.id, params.row.model)}
          color="inherit"
        />,
      ],
    },
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
