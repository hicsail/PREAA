// Detect if the app is running in an iframe and add appropriate classes
export const setupIframeDetection = () => {
  if (window !== window.parent) {
    document.documentElement.classList.add('in-chat-iframe');
    document.body.classList.add('in-chat-iframe');
    
    // Notify parent that the chat is ready
    try {
      window.parent.postMessage({ type: 'chat-ready' }, '*');
    } catch (e) {
      console.error('Failed to send ready message to parent:', e);
    }
  }
};

// Call this function in your main index.ts or App.tsx