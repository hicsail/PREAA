import { Alert, Paper, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowId, GridRowModel } from '@mui/x-data-grid';
import Delete from '@mui/icons-material/Delete';
import { LangFlowMapping, langflowMappingControllerGetAll, langflowMappingControllerDelete, langflowMappingControllerUpdate } from '../../client';

const MappingList = () => {
  const [mappings, setMappings] = useState<LangFlowMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchMappings = async () => {
    const response = await langflowMappingControllerGetAll();
    if (response.error) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch mappings',
        severity: 'error',
      });
      setLoading(false);
      return;
    }

    setMappings(response.data!);
    setLoading(false);
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDeleteClick = (id: GridRowId, modelName: string) => async () => {
    try {
      const response = await langflowMappingControllerDelete({
        path: {
          model: modelName,
        }
      });
      if (!response.response.ok) {
        throw new Error(response.error as string || 'Failed to delete mapping');
      }
      
      setMappings(mappings.filter((mapping) => mapping._id !== id));
      setSnackbar({
        open: true,
        message: 'Mapping deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting mapping:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete mapping',
        severity: 'error',
      });
    }
  };
  const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {

    try {
      const response = await langflowMappingControllerUpdate(newRow._id, {
        model: newRow.model,
        url: newRow.url,
        historyComponentID: newRow.historyComponentID,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update mapping');
      }

      setSnackbar({
        open: true,
        message: 'Mapping updated successfully',
        severity: 'success',
      });

      return newRow;
    } catch (error) {
      console.error('Error updating mapping:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to update mapping',
        severity: 'error',
      });
      return oldRow;
    }
  };

  const handleProcessRowUpdateError = (error: any) => {
    console.error('Error during row update:', error);
    setSnackbar({
      open: true,
      message: 'An error occurred while updating the mapping',
      severity: 'error',
    });
  };

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', flex: 1, editable: false },
    { field: 'model', headerName: 'Model Name', flex: 1, editable: true },
    { field: 'url', headerName: 'URL', flex: 2, editable: true },
    { field: 'historyComponentID', headerName: 'History Component ID', flex: 1.5, editable: true },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Delete />}
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
          rows={mappings}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          editMode="row"
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
};

export default MappingList;
