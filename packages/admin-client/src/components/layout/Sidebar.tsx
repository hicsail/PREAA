import { useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Drawer, ListItemIcon } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';

type SidebarProps = {
  onNavigate: (page: string) => void;
  selectedPage: string;
};

const drawerWidth = 240;

const Sidebar = ({ onNavigate, selectedPage }: SidebarProps) => {
  const menuItems = [
    { id: 'mappings', text: 'Mappings', icon: <MapIcon /> },
    { id: 'proxying', text: 'Proxying', icon: <SettingsInputComponentIcon /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton 
                selected={selectedPage === item.id}
                onClick={() => onNavigate(item.id)}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
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