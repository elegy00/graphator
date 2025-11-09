// Authentication configuration
export const getAuthToken = () => {
  // Try both variable names (HOME_ASSISTANT_TOKEN is preferred)
  if (typeof process !== 'undefined') {
    return process.env.HOME_ASSISTANT_TOKEN || process.env.HA_AUTH_TOKEN || '';
  }
  return '';
};

export const getHomeAssistantUrl = () => {
  if (typeof process !== 'undefined') {
    return process.env.HOME_ASSISTANT_URL || process.env.HA_URL || 'http://homeassistant:8123';
  }
  return 'http://homeassistant:8123';
};
