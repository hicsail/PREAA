// src/hooks/useChatMessages.ts
import { useChat } from "../contexts/ChatContext";

export const useChatMessages = () => {
  const { chatRef, setChatMessages, chatMessages } = useChat();

  const saveMessages = () => {
    if (chatRef.current) {
      try {
        const messages = chatRef.current.getMessages();
        if (messages && messages.length > 0) {
          setChatMessages(messages);
        }
      } catch (error) {
        console.error("Failed to get messages:", error);
      }
    }
  };

  const restoreMessages = () => {
    setTimeout(() => {
      if (chatRef.current && chatMessages.length > 0) {
        try {
          // Clear existing messages
          chatRef.current.clearMessages(true);

          // Add saved messages one by one
          chatMessages.forEach((message) => {
            chatRef.current.addMessage(message, false);
          });

          // Scroll to bottom
          chatRef.current.scrollToBottom();
        } catch (error) {
          console.error("Failed to restore messages:", error);
        }
      }
    }, 100);
  };

  return { saveMessages, restoreMessages };
};
