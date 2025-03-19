import axios from 'axios';

// API configurations
const API_TOKEN = "45UUXAPg34nKjGVdMpss7iwhccn7xPg4corm_X1c";
const BASE_URL = "https://noco-erp.com/api/v2";

// Maximum number of retries for API calls
const MAX_RETRIES = 2;
// Timeout in milliseconds
const TIMEOUT = 10000;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'xc-token': API_TOKEN
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

// Table IDs
// Bảng data_ban_giao_new (tableID: m6whmcc44o8tgh8)
const STUDENT_TABLE_ID = 'm6whmcc44o8tgh8';
// Bảng form_giu_cho (tableID: mqccf6avwxoqc5n)
const RESERVATION_TABLE_ID = 'mqccf6avwxoqc5n';
// Bảng data_class_total (tableID: mhh0jrb11ycvfzg)
const CLASS_TABLE_ID = 'mhh0jrb11ycvfzg';

/**
 * Fetch student data by ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Student data object
 * @throws {Error} - If student not found or API error
 */
export const fetchStudentData = async (studentId) => {
  if (!studentId) {
    throw new Error('Mã học viên không được bỏ trống');
  }
  
  try {
    const response = await apiClient.get(`/tables/${STUDENT_TABLE_ID}/records?where=(studentId,allof,${studentId})`);
    
    if (!response.data || !response.data.list || response.data.list.length === 0) {
      throw new Error('Không tìm thấy thông tin học viên');
    }
    
    const studentData = response.data.list[0];
    
    // Validate required fields
    if (!studentData.tenSanPham) {
      console.warn('Missing tenSanPham for student ID:', studentId);
    }
    
    if (!studentData.size) {
      console.warn('Missing size for student ID:', studentId);
    }
    
    if (!studentData.loaiGiaoVien) {
      console.warn('Missing loaiGiaoVien for student ID:', studentId);
    }
    
    if (!studentData.trinhDo) {
      console.warn('Missing trinhDo for student ID:', studentId);
    }
    
    return studentData;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Không tìm thấy học viên với mã ${studentId}`);
    }
    
    // Re-throw error from interceptor or new error
    throw error.originalError ? error : new Error(`Lỗi khi tải dữ liệu học viên: ${error.message}`);
  }
};

/**
 * Check reservation in form_giu_cho
 * @param {string} maLopBanGiao - Reservation code
 * @returns {Promise<Object|null>} - Reservation data or null if not found
 * @throws {Error} - If API error
 */
export const checkReservation = async (maLopBanGiao) => {
  if (!maLopBanGiao) {
    return null;
  }
  
  try {
    const response = await apiClient.get(`/tables/${RESERVATION_TABLE_ID}/records?where=(ma_order,allof,${maLopBanGiao})`);
    
    if (response.data && response.data.list && response.data.list.length > 0) {
      return response.data.list[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error checking reservation:', error);
    // Don't throw error if reservation not found, just return null
    return null;
  }
};

/**
 * Fetch available classes based on student requirements
 * @param {Object} filters - Filter criteria
 * @param {string} filters.tenSanPham - Product name
 * @param {string} filters.size - Class size
 * @param {string} filters.loaiGiaoVien - Teacher type
 * @param {string} filters.trinhDo - Class level
 * @returns {Promise<Array>} - List of available classes
 * @throws {Error} - If filters invalid or API error
 */
export const fetchAvailableClasses = async (filters) => {
  // Validate required filters
  if (!filters) {
    throw new Error('Thiếu thông tin tìm kiếm lớp học');
  }
  
  const { tenSanPham, size, loaiGiaoVien, trinhDo } = filters;
  
  if (!tenSanPham || !size || !loaiGiaoVien || !trinhDo) {
    throw new Error('Thiếu thông tin tìm kiếm lớp học: tenSanPham, size, loaiGiaoVien, hoặc trinhDo');
  }
  
  try {
    // Build filter based on student's requirements
    const whereClause = `(Product,allof,${tenSanPham})~and(Size,allof,${size})~and(Teacher_type,allof,${loaiGiaoVien})~and(Level,allof,${trinhDo})~and(Status,allof,Dự kiến khai giảng)~and(soSlotConLai,gt,0)`;
    
    const response = await apiClient.get(`/tables/${CLASS_TABLE_ID}/records?where=${encodeURIComponent(whereClause)}`);
    
    if (response.data && response.data.list) {
      return response.data.list;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching available classes:', error);
    throw error.originalError ? error : new Error(`Lỗi khi tải danh sách lớp học: ${error.message}`);
  }
};

/**
 * Update student class information
 * @param {string} studentId - Student ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated student data
 * @throws {Error} - If update fails or API error
 */
export const updateStudentClass = async (studentId, updateData) => {
  if (!studentId) {
    throw new Error('Thiếu mã học viên');
  }
  
  if (!updateData) {
    throw new Error('Thiếu dữ liệu cập nhật');
  }
  
  try {
    const response = await apiClient.patch(`/tables/${STUDENT_TABLE_ID}/records`, {
      Id: studentId,
      ...updateData
    });
    
    if (response.data) {
      return response.data;
    }
    
    throw new Error('Không nhận được phản hồi khi cập nhật dữ liệu');
  } catch (error) {
    console.error('Error updating student class:', error);
    throw error.originalError ? error : new Error(`Lỗi khi cập nhật thông tin lớp học: ${error.message}`);
  }
};

export default apiClient;