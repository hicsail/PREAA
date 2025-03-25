import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import { ProxyModel } from '../../services/apiService';

interface ProxyListProps {
  proxies: ProxyModel[] | null;
  loading: boolean;
}

const ProxyList = ({ proxies, loading }: ProxyListProps) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!proxies || proxies.length === 0) {
    return (
      <Paper sx={{ p: 3, my: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No proxy configurations found. Create one to get started.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Model Name</TableCell>
            <TableCell>Base URL</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>ID</TableCell>
            <TableCell>Last Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proxies.map((proxy) => (
            <TableRow key={proxy._id}>
              <TableCell>{proxy.model}</TableCell>
              <TableCell>{proxy.url}</TableCell>
              <TableCell>
                <Typography color="success.main">Active</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {proxy._id}
                </Typography>
              </TableCell>
              <TableCell>
                {proxy.updatedAt ? new Date(proxy.updatedAt).toLocaleString() : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProxyList; 