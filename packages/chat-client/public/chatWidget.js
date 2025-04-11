(function () {
  // Create the widget container
  const widgetContainer = document.createElement("div");
  widgetContainer.id = "chat-widget-container";
  widgetContainer.style.position = "fixed";
  widgetContainer.style.bottom = "20px";
  widgetContainer.style.right = "20px";
  //widgetContainer.style.zIndex = '2147483647'; // Maximum z-index value
  widgetContainer.style.display = "flex";
  widgetContainer.style.flexDirection = "column";
  widgetContainer.style.alignItems = "flex-end";
  document.body.appendChild(widgetContainer);

  // Create welcome message box (initially visible)
  const welcomeBox = document.createElement("div");
  welcomeBox.id = "chat-widget-welcome";
  welcomeBox.style.width = "350px";
  welcomeBox.style.backgroundColor = "white";
  welcomeBox.style.borderRadius = "8px";
  welcomeBox.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  welcomeBox.style.marginBottom = "10px";
  welcomeBox.style.overflow = "hidden";
  welcomeBox.style.order = "1";
  welcomeBox.style.zIndex = '2147483646'; // Very high z-index
  // Welcome box header
  const welcomeHeader = document.createElement("div");
  welcomeHeader.style.backgroundColor =
    window.chatWidgetConfig?.theme?.primary || "#d32f2f";
  welcomeHeader.style.color = "white";
  welcomeHeader.style.padding = "12px 16px";
  welcomeHeader.style.display = "flex";
  welcomeHeader.style.justifyContent = "space-between";
  welcomeHeader.style.alignItems = "center";

  const welcomeTitle = document.createElement("div");
  welcomeTitle.textContent =
    window.chatWidgetConfig?.title || "May I help you?";
  welcomeTitle.style.fontWeight = "bold";
  welcomeTitle.style.fontSize = "18px";

  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  closeButton.style.background = "none";
  closeButton.style.border = "none";
  closeButton.style.color = "white";
  closeButton.style.fontSize = "20px";
  closeButton.style.cursor = "pointer";
  closeButton.style.padding = "0";
  closeButton.style.lineHeight = "1";

  welcomeHeader.appendChild(welcomeTitle);
  welcomeHeader.appendChild(closeButton);
  welcomeBox.appendChild(welcomeHeader);

  // Welcome box content
  const welcomeContent = document.createElement("div");
  welcomeContent.style.padding = "16px";
  welcomeContent.style.display = "flex";
  welcomeContent.style.alignItems = "center";
  welcomeContent.style.gap = "16px";

  const avatarImg = document.createElement("img");
  avatarImg.src =
     "https://64.media.tumblr.com/avatar_571393a671a2_512.pnj";
  avatarImg.alt = "Chat Avatar";
  avatarImg.style.width = "60px";
  avatarImg.style.height = "60px";
  avatarImg.style.borderRadius = "50%";

  const messageDiv = document.createElement("div");
  messageDiv.style.textAlign = "center";
  messageDiv.style.width = "100%";

  const botName = window.chatWidgetConfig?.botName || "Assistant";
  const supportTopics = window.chatWidgetConfig?.supportTopics || "questions";

  const welcomeMessage = document.createElement("p");
  welcomeMessage.style.fontWeight = "bold";
  welcomeMessage.style.margin = "0 0 8px 0";
  welcomeMessage.textContent = `Hi there! I'm ${botName}, a chatbot here to answer your ${supportTopics}.`;

  const promptMessage = document.createElement("p");
  promptMessage.style.margin = "0";
  promptMessage.textContent = "What would you like to know?";

  messageDiv.appendChild(welcomeMessage);
  messageDiv.appendChild(promptMessage);

  welcomeContent.appendChild(avatarImg);
  welcomeContent.appendChild(messageDiv);
  welcomeBox.appendChild(welcomeContent);

  widgetContainer.appendChild(welcomeBox);

  // Create the chat button
  const chatButton = document.createElement("div");
  chatButton.id = "chat-widget-button";
  chatButton.style.width = "60px";
  chatButton.style.height = "60px";
  chatButton.style.borderRadius = "50%";
  chatButton.style.backgroundColor =
    window.chatWidgetConfig?.theme?.primary || "#d32f2f";
  chatButton.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  chatButton.style.cursor = "pointer";
  chatButton.style.display = "flex";
  chatButton.style.justifyContent = "center";
  chatButton.style.alignItems = "center";
  // Add this to ensure it's below the welcome box
  chatButton.style.order = "2";
  chatButton.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
  widgetContainer.appendChild(chatButton);

  // Create backdrop for drawer
  const backdrop = document.createElement("div");
  backdrop.id = "chat-widget-backdrop";
  backdrop.style.position = "fixed";
  backdrop.style.top = "0";
  backdrop.style.left = "0";
  backdrop.style.width = "100%";
  backdrop.style.height = "100%";
  backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  backdrop.style.backdropFilter = "blur(5px)";
  backdrop.style.zIndex = "9998";
  backdrop.style.opacity = "0";
  backdrop.style.visibility = "hidden";
  backdrop.style.transition = "opacity 0.3s ease, visibility 0.3s ease";
  document.body.appendChild(backdrop);

  // Create the chat drawer
  const chatDrawer = document.createElement("div");
  chatDrawer.id = "chat-widget-drawer";
  chatDrawer.style.position = "fixed";
  chatDrawer.style.top = "0";
  chatDrawer.style.right = "-400px"; // Start off-screen
  chatDrawer.style.width = "400px";
  chatDrawer.style.height = "100%";
  chatDrawer.style.backgroundColor = "white";
  chatDrawer.style.boxShadow = "-2px 0 10px rgba(0,0,0,0.2)";
  chatDrawer.style.zIndex = "99999";
  chatDrawer.style.transition = "right 0.3s ease";
  chatDrawer.style.display = "flex";
  chatDrawer.style.flexDirection = "column";
  chatDrawer.style.borderRadius = "8px 0 0 8px";
  chatDrawer.style.overflow = "hidden";
  document.body.appendChild(chatDrawer);

  // Create drawer header
  const drawerHeader = document.createElement("div");
  drawerHeader.style.backgroundColor =
    window.chatWidgetConfig?.theme?.primary || "#d32f2f";
  drawerHeader.style.color = "white";
  drawerHeader.style.padding = "16px";
  drawerHeader.style.display = "flex";
  drawerHeader.style.justifyContent = "space-between";
  drawerHeader.style.alignItems = "center";

  const drawerTitle = document.createElement("div");
  drawerTitle.textContent =
    window.chatWidgetConfig?.title || "What would you like to know?";
  drawerTitle.style.fontWeight = "bold";
  drawerTitle.style.fontSize = "18px";

  const drawerCloseButton = document.createElement("button");
  drawerCloseButton.innerHTML = "&times;";
  drawerCloseButton.style.background = "none";
  drawerCloseButton.style.border = "none";
  drawerCloseButton.style.color = "white";
  drawerCloseButton.style.fontSize = "24px";
  drawerCloseButton.style.cursor = "pointer";
  drawerCloseButton.style.padding = "0";
  drawerCloseButton.style.lineHeight = "1";

  drawerHeader.appendChild(drawerTitle);
  drawerHeader.appendChild(drawerCloseButton);
  chatDrawer.appendChild(drawerHeader);

  // Create iframe for chat content
  const chatIframe = document.createElement("iframe");
  const modelId = window.chatWidgetConfig?.modelId || "";

  // Update the iframe URL to include a parameter that indicates it should start in expanded mode
  chatIframe.src = `${window.chatWidgetConfig?.baseUrl || window.location.origin}/?modelId=${modelId}&embed=true&startExpanded=true`;
  chatIframe.style.width = "100%";
  chatIframe.style.height = "100%";
  chatIframe.style.border = "none";
  chatIframe.style.flex = "1";
  chatIframe.style.opacity = "0"; // Start hidden
  chatIframe.style.transition = "opacity 0.3s ease";
  chatIframe.allow = "microphone";
  chatDrawer.appendChild(chatIframe);

  // Track iframe loaded state
  let iframeLoaded = false;
  chatIframe.onload = function () {
    iframeLoaded = true;
    // If drawer is already open, show iframe content
    if (chatDrawer.style.right === "0px") {
      setTimeout(() => {
        chatIframe.style.opacity = "1";
      }, 100);
    }
  };

  // Close welcome box when close button is clicked
  closeButton.addEventListener("click", function (e) {
    e.stopPropagation();
    welcomeBox.style.display = "none";
  });

  // Open drawer when chat button is clicked
  chatButton.addEventListener("click", function () {
    welcomeBox.style.display = "none"; // Hide welcome box

    // Show backdrop and drawer
    backdrop.style.opacity = "1";
    backdrop.style.visibility = "visible";
    chatDrawer.style.right = "0";

    // Only show iframe content after drawer animation completes
    setTimeout(() => {
      chatIframe.style.opacity = "1";

      // If iframe is already loaded, tell it to show expanded view
      if (iframeLoaded) {
        chatIframe.contentWindow.postMessage(
          {
            type: "chat-command",
            action: "open",
            skipAnimation: true, // Tell iframe to skip its own animations
          },
          "*"
        );
      }
    }, 300); // Match this to your drawer animation duration
  });

  // Close drawer when close button or backdrop is clicked
  const closeDrawer = function () {
    // First hide the iframe content
    chatIframe.style.opacity = "0";

    // Tell iframe to prepare for closing
    if (iframeLoaded) {
      chatIframe.contentWindow.postMessage(
        {
          type: "chat-command",
          action: "minimize",
          skipAnimation: true, // Tell iframe to skip its own animations
        },
        "*"
      );
    }

    // After a short delay, close the drawer
    setTimeout(() => {
      chatDrawer.style.right = "-400px";
      backdrop.style.opacity = "0";
      backdrop.style.visibility = "hidden";
    }, 100);
  };

  drawerCloseButton.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  // Handle responsive design
  const updateDrawerSize = function () {
    if (window.innerWidth < 768) {
      chatDrawer.style.width = "100%";
      chatDrawer.style.borderRadius = "0";
    } else {
      chatDrawer.style.width = "400px";
      chatDrawer.style.borderRadius = "8px 0 0 8px";
    }
  };

  window.addEventListener("resize", updateDrawerSize);
  updateDrawerSize(); // Initial call

  // If initiallyOpen is true, open the drawer
  if (window.chatWidgetConfig?.initiallyOpen) {
    welcomeBox.style.display = "none";
    backdrop.style.opacity = "1";
    backdrop.style.visibility = "visible";
    chatDrawer.style.right = "0";

    // Show iframe after a short delay
    setTimeout(() => {
      chatIframe.style.opacity = "1";
    }, 300);
  }
})();
