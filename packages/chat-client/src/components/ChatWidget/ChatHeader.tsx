// src/components/ChatWidget/ChatHeader.tsx
import { IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../contexts/ChatContext';
import { useChatMessages } from '../../hooks/useChatMessages';

interface ChatHeaderProps {
  title?: string;
}

export const ChatHeader = ({ title = 'Chat Assistant' }: ChatHeaderProps) => {
  const { setMinimized, chatConfig } = useChat();
  const { saveMessages } = useChatMessages();
  
  const handleMinimize = () => {
    saveMessages();
    setMinimized(true);
  };

  return (
    <Box className="chat-widget-header">
      <Typography variant="h6" component="span">
        {chatConfig.title || title}
      </Typography>
      <IconButton 
        onClick={handleMinimize}
        size="small"
        aria-label="minimize chat"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};