import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowId } from '@mui/x-data-grid';
import { Paper } from '@mui/material';
import { DeepchatProxy, deepchatProxyControllerGetAll, deepchatProxyControllerDelete } from '../client';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from '../contexts/Snackbar.context';

export default function ViewProxyMaps() {
  const [rows, setRows] = useState<DeepchatProxy[]>([]);
  const { showSnackbar } = useSnackbar();

  const fetchProxies = async () => {
    const response = await deepchatProxyControllerGetAll();
    if (response.error) {
      console.error('Failed to get proxies');
      console.error(response.error);
      return;
    }
    setRows(response.data!);
  };

  useEffect(() => {
    fetchProxies();
  }, []);

  const handleDeleteClick = (id: GridRowId, model: string) => async () => {
    try {
      const response = await deepchatProxyControllerDelete({
        path: { model }
      });

      if (response.error) {
        throw new Error(response.error.toString() || 'Failed to delete proxy');
      }

      setRows(rows.filter((row) => row._id.toString() !== id.toString()));
      showSnackbar('Proxy deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting proxy:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to delete proxy', 'error');
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
        />
      ]
    }
  ];

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} />
      </div>
    </Paper>
  );
}
