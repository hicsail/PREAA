import { Theme } from "@mui/material";

// Common style configurations for the chat widget
export const chatWidgetStyles = {
  // Z-index values
  zIndex: {
    max: 2147483647,
    backdrop: 2147483646,
    widget: 2147483647,
  },

  // Transition styles
  transitions: {
    standard: "all 0.3s ease",
    none: "none",
  },

  // Border radius values
  borderRadius: {
    standard: "10px",
    drawer: "10px 0 0 10px",
    none: "0",
  },

  // Shadow values
  shadows: {
    widget: "0 4px 8px rgba(0,0,0,0.2)",
    drawer: "0 0 10px rgba(0,0,0,0.2)",
  },

  // Size configurations
  sizes: {
    desktopWidth: 420,
    headerHeight: 64,
  },
};

// Helper function to get theme-aware colors
export const getThemeColors = (chatConfig: any, theme: Theme) => {
  return {
    primary: chatConfig.theme?.primary || theme.palette.primary.main,
    secondary: chatConfig.theme?.secondary || theme.palette.grey[100],
    background: chatConfig.theme?.background || theme.palette.background.paper,
    text: chatConfig.theme?.text || theme.palette.text.primary,
  };
};

// Helper function to get transition style based on skipAnimation flag
export const getTransitionStyle = (skipAnimation?: boolean) => {
  return {
    transition: skipAnimation
      ? chatWidgetStyles.transitions.none
      : chatWidgetStyles.transitions.standard,
  };
};

// Helper function to get responsive box styles for expanded chat
export const getExpandedBoxStyle = (
  isMobile: boolean,
  skipAnimation?: boolean,
) => {
  // Base styles for all devices
  const baseStyle = {
    position: "fixed" as const,
    display: "flex" as const,
    flexDirection: "column" as const,
    bgcolor: "background.paper",
    boxShadow: chatWidgetStyles.shadows.drawer,
    overflow: "hidden" as const,
    zIndex: chatWidgetStyles.zIndex.widget,
    ...getTransitionStyle(skipAnimation),
  };

  // Mobile styles - full screen
  if (isMobile) {
    return {
      ...baseStyle,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      borderRadius: chatWidgetStyles.borderRadius.none,
    };
  }

  // Desktop styles - side drawer
  return {
    ...baseStyle,
    top: 0,
    right: 0,
    bottom: 0,
    width: `${chatWidgetStyles.sizes.desktopWidth}px`,
    borderRadius: chatWidgetStyles.borderRadius.drawer,
  };
};
