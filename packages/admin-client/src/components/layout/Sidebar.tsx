import { Box, List, ListItem, ListItemButton, ListItemText, Drawer, ListItemIcon } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { id: '/', text: 'Dashboard', icon: <DashboardIcon /> },
    { id: '/mappings', text: 'Mappings', icon: <MapIcon /> },
    { id: '/proxying', text: 'Proxying', icon: <SettingsInputComponentIcon /> }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box'
        }
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={currentPath === item.id || (item.id === '/' && currentPath === '')}
                onClick={() => handleNavigate(item.id)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
