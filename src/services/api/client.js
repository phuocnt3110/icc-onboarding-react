import axios from 'axios';
import { API_CONFIG } from '../../config';

// Extract values from config
const { TOKEN, BASE_URL, TIMEOUT, MAX_RETRIES } = API_CONFIG;

// Create API client
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'xc-token': TOKEN
  },
  timeout: TIMEOUT
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error;
    
    // Keep track of retry count
    config.retryCount = config.retryCount || 0;
    
    // Check if we should retry the request
    if (config.retryCount < MAX_RETRIES && (!response || response.status >= 500)) {
      config.retryCount += 1;
      
      // Create new promise to delay retry
      const backoffDelay = Math.pow(2, config.retryCount) * 1000;
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(apiClient(config));
        }, backoffDelay);
      });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 