import axios from 'axios';
import { API_CONFIG } from '../config';

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
      
      // Exponential backoff delay
      const delay = Math.pow(2, config.retryCount) * 1000;
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return apiClient(config);
    }
    
    // Format error message
    let errorMessage = 'Có lỗi xảy ra khi kết nối với máy chủ';
    
    if (response) {
      if (response.status === 401) {
        errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng tải lại trang';
      } else if (response.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này';
      } else if (response.status === 404) {
        errorMessage = 'Không tìm thấy dữ liệu yêu cầu';
      } else if (response.status >= 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
      }
      
      // Include server message if available
      if (response.data && response.data.message) {
        errorMessage += ` - ${response.data.message}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại';
    } else if (error.message && error.message.includes('Network Error')) {
      errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng';
    }
    
    // Create error with formatted message
    const formattedError = new Error(errorMessage);
    formattedError.originalError = error;
    formattedError.response = response;
    
    return Promise.reject(formattedError);
  }
);

export default apiClient;