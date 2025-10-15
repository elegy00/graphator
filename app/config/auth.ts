// Authentication configuration
export const getAuthToken = () => {
  // In dev mode, use environment variable
  if (process.env.NODE_ENV === 'development') {
    return process.env.HA_AUTH_TOKEN || '';
  }
  
  // In production, use environment variable
  return process.env.HA_AUTH_TOKEN || '';
};

export const getHomeAssistantUrl = () => {
  return process.env.HA_URL || 'http://homeassistant:8123';
};
