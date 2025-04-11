(function() {
  // Version tracking for debugging
  const WIDGET_VERSION = '1.0.0';
  console.log(`Chat Widget v${WIDGET_VERSION} initializing...`);
  
  try {
    // Create container for the widget
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'chat-widget-container';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.bottom = '20px';
    widgetContainer.style.right = '20px';
    widgetContainer.style.zIndex = '2147483647'; // Maximum z-index
    document.body.appendChild(widgetContainer);

    // Create and load the widget iframe
    const widgetIframe = document.createElement('iframe');
    widgetIframe.id = 'chat-widget-iframe';
    widgetIframe.style.border = 'none';
    widgetIframe.style.width = '420px'; 
    widgetIframe.style.height = '300px'; // Adjusted height for welcome box
    widgetIframe.style.maxWidth = '420px';
    widgetIframe.style.maxHeight = '300px'; // Adjusted max height
    widgetIframe.style.borderRadius = '10px';
    widgetIframe.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    widgetIframe.style.transition = 'all 0.3s ease';
    widgetIframe.style.zIndex = '2147483647';
    widgetIframe.style.backgroundColor = 'transparent'; // Make background transparent
    widgetIframe.allow = 'microphone';
    
    // Build the URL with config parameters
    const config = window.chatWidgetConfig || {};
    const params = new URLSearchParams();
    
    // Add all config properties as URL parameters
    Object.keys(config).forEach(key => {
      try {
        // Handle nested objects like theme
        if (typeof config[key] === 'object') {
          params.append(key, JSON.stringify(config[key]));
        } else {
          params.append(key, config[key]);
        }
      } catch (e) {
        console.error(`Error adding parameter ${key}:`, e);
      }
    });
    
    // Always add embed=true parameter
    params.append('embed', 'true');
    
    // Set the iframe source
    const baseUrl = config.baseUrl || window.location.origin;
    widgetIframe.src = `${baseUrl}/widget/?${params.toString()}`;
    
    // Add iframe to container
    widgetContainer.appendChild(widgetIframe);
    
    // Create a backdrop element for expanded mode
    const backdrop = document.createElement('div');
    backdrop.id = 'chat-widget-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.right = '0';
    backdrop.style.bottom = '0';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.backdropFilter = 'blur(5px)';
    backdrop.style.zIndex = '2147483646'; // Just below the widget
    backdrop.style.display = 'none'; // Hidden by default
    backdrop.style.transition = 'opacity 0.3s ease';
    backdrop.style.opacity = '0';
    document.body.appendChild(backdrop);
    
    // Set up communication with the iframe
    window.addEventListener('message', function(event) {
      try {
        // Only accept messages from our iframe
        if (event.source !== widgetIframe.contentWindow) return;
        
        const { type, size } = event.data || {};
        
        if (type === 'chat-widget-resize') {
          if (size === 'minimized') {
            // Minimized state - show just enough for welcome box and button
            widgetIframe.style.width = '420px';
            widgetIframe.style.height = '300px'; // Adjusted height
            widgetIframe.style.maxWidth = '420px';
            widgetIframe.style.maxHeight = '300px'; // Adjusted max height
            widgetIframe.style.position = 'fixed';
            widgetIframe.style.bottom = '20px';
            widgetIframe.style.right = '20px';
            widgetIframe.style.top = 'auto'; // Reset top position
            widgetIframe.style.left = 'auto'; // Reset left position
            widgetIframe.style.borderRadius = '10px';
            
            // Hide backdrop
            backdrop.style.opacity = '0';
            setTimeout(() => {
              backdrop.style.display = 'none';
            }, 300);
          } else if (size === 'expanded') {
            // Show backdrop
            backdrop.style.display = 'block';
            setTimeout(() => {
              backdrop.style.opacity = '1';
            }, 10);
            
            // Expanded state - full height drawer
            if (window.innerWidth < 768) {
              // Mobile - full screen
              widgetIframe.style.width = '100%';
              widgetIframe.style.height = '100%';
              widgetIframe.style.maxWidth = '100%';
              widgetIframe.style.maxHeight = '100%';
              widgetIframe.style.position = 'fixed';
              widgetIframe.style.top = '0';
              widgetIframe.style.left = '0';
              widgetIframe.style.right = '0';
              widgetIframe.style.bottom = '0';
              widgetIframe.style.borderRadius = '0';
            } else {
              // Desktop - drawer from right
              widgetIframe.style.width = '420px';
              widgetIframe.style.height = '100%';
              widgetIframe.style.maxWidth = '420px';
              widgetIframe.style.maxHeight = '100%';
              widgetIframe.style.position = 'fixed';
              widgetIframe.style.top = '0';
              widgetIframe.style.right = '0';
              widgetIframe.style.bottom = '0';
              widgetIframe.style.left = 'auto'; // Reset left position
              widgetIframe.style.borderRadius = '10px 0 0 10px';
            }
          }
        } else if (type === 'chat-widget-ready') {
          console.log('Chat widget is ready');
        } else if (type === 'chat-widget-error') {
          console.error('Chat widget error:', event.data.error);
        }
      } catch (e) {
        console.error('Error handling message from chat widget:', e);
      }
    });
    
    // Handle backdrop click to minimize the chat
    backdrop.addEventListener('click', function() {
      widgetIframe.contentWindow.postMessage({
        type: 'chat-command',
        action: 'minimize'
      }, '*');
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
      try {
        // Adjust iframe size based on window size
        if (widgetIframe.style.maxHeight === '100%') {
          if (window.innerWidth < 768) {
            widgetIframe.style.width = '100%';
            widgetIframe.style.maxWidth = '100%';
            widgetIframe.style.borderRadius = '0';
          } else {
            widgetIframe.style.width = '420px';
            widgetIframe.style.maxWidth = '420px';
            widgetIframe.style.borderRadius = '10px 0 0 10px';
          }
        }
      } catch (e) {
        console.error('Error handling window resize:', e);
      }
    });
    
    console.log('Chat Widget initialized successfully');
  } catch (e) {
    console.error('Error initializing chat widget:', e);
  }
})();