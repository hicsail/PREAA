(function() {
  // Version tracking
  const WIDGET_VERSION = '1.0.0';
  console.log(`Chat Widget v${WIDGET_VERSION} initializing...`);
  
  // Create container for the widget
  const container = document.createElement('div');
  container.id = 'chat-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '0';
  container.style.right = '0';
  container.style.width = '350px'; // Default to minimized width
  container.style.height = '200px'; // Height for minimized state with message
  container.style.maxWidth = '100%';
  container.style.maxHeight = '100%';
  container.style.zIndex = '2147483647';
  container.style.border = 'none';
  container.style.display = 'none'; // Start hidden
  document.body.appendChild(container);
  
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'chat-widget-iframe';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.backgroundColor = 'transparent';
  iframe.allow = 'microphone';
  
  // Get config from window object
  const config = window.chatWidgetConfig || {};
  
  // Add default BU-specific settings if not provided
  if (!config.theme) {
    config.theme = {};
  }
  if (!config.theme.primary) {
    config.theme.primary = '#c00'; // BU red
  }
  if (!config.botName) {
    config.botName = 'BUzz';
  }
  if (!config.supportTopics && !config.supportTopicsConfig) {
    config.supportTopics = 'Financial Assistance, Undergraduate Admissions, University Registrar, Student Employment and University Service Center questions';
  }
  
  // Build URL with parameters
  const params = new URLSearchParams();
  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
    } else {
      params.append(key, String(value));
    }
  });
  
  // Set iframe source - use current origin for development
  const baseUrl = config.baseUrl || window.location.origin;
  const widgetUrl = `${baseUrl}/widget/?${params.toString()}`;
  iframe.src = widgetUrl;
  
  // Add iframe to container
  container.appendChild(iframe);
  
  // Handle messages from iframe
  window.addEventListener('message', function(event) {
    // Skip origin check in development
    if (event.data) {
      switch (event.data.type) {
        case 'chat-widget-ready':
          // Widget is ready to be shown
          container.style.display = 'block';
          break;
          
        case 'chat-widget-resize':
          // Resize the container based on widget state
          if (event.data.size === 'minimized') {
            container.style.width = '350px';
            container.style.height = '200px'; // Taller to accommodate the message
          } else {
            container.style.width = '420px';
            container.style.height = '600px';
          }
          break;
      }
    }
  });
  
  // Expose API for controlling the widget
  window.chatWidget = {
    open: function() {
      container.style.display = 'block';
      iframe.contentWindow.postMessage({
        type: 'chat-command',
        action: 'open'
      }, '*');
    },
    
    close: function() {
      iframe.contentWindow.postMessage({
        type: 'chat-command',
        action: 'minimize'
      }, '*');
    },
    
    toggle: function() {
      if (container.style.display === 'none') {
        this.open();
      } else {
        this.close();
      }
    },
    
    hide: function() {
      container.style.display = 'none';
    }
  };
})();