// API Configuration
// This file handles different API configurations based on the environment

const getApiConfig = () => {
  // Check if we're using nginx reverse proxy or direct connection
  const isHttpsMode = window.location.protocol === 'https:';
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Determine if we're in nginx mode (production or local HTTPS)
  const isNginxMode = 
    // Explicit nginx ports
    port === '80' || port === '443' ||
    // Default ports (empty port)
    port === '' ||
    // Production domains (anything that's not localhost with dev ports)
    (hostname !== 'localhost' && !hostname.startsWith('127.0.0.1')) ||
    // Localhost with standard web ports
    (hostname === 'localhost' && (port === '' || port === '80' || port === '443'));
  
  let config;
  
  if (isNginxMode) {
    // Using nginx reverse proxy (production or local HTTPS setup)
    // For SockJS, use the same protocol as the page (https: or http:)
    const protocol = isHttpsMode ? 'https:' : 'http:';
    config = {
      baseURL: '/api',
      wsURL: `${protocol}//${window.location.host}/ws`,
      timeout: 60000
    };
  } else {
    // Direct connection to backend (local development HTTP setup)
    config = {
      baseURL: 'http://localhost:8080/api',
      wsURL: 'http://localhost:8080/ws',
      timeout: 60000
    };
  }
  
  return config;
};

export const apiConfig = getApiConfig();

// Export individual config values for convenience
export const { baseURL, wsURL, timeout } = apiConfig;
