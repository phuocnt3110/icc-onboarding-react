import axios from 'axios';
import { API_CONFIG, TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';

// Extract values from config
const { TOKEN, BASE_URL, TIMEOUT, MAX_RETRIES } = API_CONFIG;
const { STUDENT, RESERVATION, CLASS } = TABLE_IDS;
const { STUDENT: STUDENT_FIELDS, CLASS: CLASS_FIELDS, RESERVATION: RESERVATION_FIELDS } = FIELD_MAPPINGS;

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

/**
 * Fetch student data by ID
 * @param {string} id - Bill Item ID
 * @returns {Promise<Object>} - Student data object
 * @throws {Error} - If student not found or API error
 */
export const fetchStudentData = async (id) => {
  if (!id) {
    throw new Error(MESSAGES.MISSING_ID);
  }
  
  try {
    // Search by billItemId
    const response = await apiClient.get(`/tables/${STUDENT}/records?where=(${STUDENT_FIELDS.BILL_ITEM_ID},eq,${id})`);
    
    if (!response.data || !response.data.list || response.data.list.length === 0) {
      throw new Error('Không tìm thấy thông tin học viên');
    }
    
    const studentData = response.data.list[0];
    
    // Validate required fields
    if (!studentData[STUDENT_FIELDS.PRODUCT] && !studentData[STUDENT_FIELDS.PACKAGE]) {
      console.warn('Missing product info for student ID:', id);
    }
    
    // Map field names for consistency in the application
    return {
      ...studentData,
      // Add legacy field mappings for backward compatibility
      tenSanPham: studentData[STUDENT_FIELDS.PACKAGE] || studentData[STUDENT_FIELDS.PRODUCT],
      size: studentData[STUDENT_FIELDS.CLASS_SIZE],
      loaiGiaoVien: studentData[STUDENT_FIELDS.TEACHER_TYPE],
      trinhDo: studentData[STUDENT_FIELDS.LEVEL] || 'Beginner', // Default if missing
      studentId: studentData[STUDENT_FIELDS.BILL_ITEM_ID], // Map billItemId to studentId for compatibility
      hoTenHocVien: studentData[STUDENT_FIELDS.NAME],
      sdtHocVien: studentData[STUDENT_FIELDS.PHONE],
      emailHocVien: studentData[STUDENT_FIELDS.EMAIL],
      hoTenDaiDien: studentData[STUDENT_FIELDS.GUARDIAN_NAME],
      sdtDaiDien: studentData[STUDENT_FIELDS.GUARDIAN_PHONE],
      emailDaiDien: studentData[STUDENT_FIELDS.GUARDIAN_EMAIL],
      giaThucDong: studentData[STUDENT_FIELDS.PRICE]
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Không tìm thấy học viên với mã ${id}`);
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
    const response = await apiClient.get(`/tables/${RESERVATION}/records?where=(${RESERVATION_FIELDS.ORDER_CODE},allof,${maLopBanGiao})`);
    
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
 * @returns {Promise<Array>} - List of available classes
 * @throws {Error} - If filters invalid or API error
 */
export const fetchAvailableClasses = async (filters) => {
  // Validate required filters
  if (!filters) {
    throw new Error('Thiếu thông tin tìm kiếm lớp học');
  }
  
  // Get values from the updated field names
  const { sanPham, sizeLop, loaiGv, goiMua } = filters;
  
  console.log('Searching classes with filters:', { sanPham, sizeLop, loaiGv, goiMua });
  
  // Check if we have at least some search criteria
  if (!sanPham && !goiMua) {
    throw new Error('Thiếu thông tin tìm kiếm lớp học: cần có ít nhất thông tin khóa học');
  }
  
  try {
    // Simplest approach: get all available classes first with minimal filtering
    const response = await apiClient.get(`/tables/${CLASS}/records?limit=100`);
    
    if (!response.data || !response.data.list) {
      return [];
    }
    
    const allClasses = response.data.list;
    console.log(`Found ${allClasses.length} total classes to filter`);
    
    // Filter manually in JavaScript using the field mappings from config
    const filteredClasses = allClasses.filter(classItem => {
      // Filter by status
      if (classItem[CLASS_FIELDS.STATUS] !== 'Dự kiến khai giảng') {
        return false;
      }
      
      // Filter by available slots if the field exists
      if (classItem[CLASS_FIELDS.SLOTS_LEFT] !== undefined && 
          classItem[CLASS_FIELDS.SLOTS_LEFT] <= 0) {
        return false;
      }
      
      // Check product match - use both sanPham and goiMua
      const productToMatch = sanPham || goiMua || '';
      const classProduct = classItem[CLASS_FIELDS.PRODUCT] || '';
      
      if (productToMatch && classProduct) {
        // Case insensitive comparison
        const productMatches = 
          classProduct.toLowerCase().includes(productToMatch.toLowerCase()) || 
          productToMatch.toLowerCase().includes(classProduct.toLowerCase());
          
        if (!productMatches) {
          return false;
        }
      }
      
      // Check size match if both are specified
      if (sizeLop && classItem[CLASS_FIELDS.SIZE]) {
        if (sizeLop !== classItem[CLASS_FIELDS.SIZE]) {
          return false;
        }
      }
      
      // Check teacher type match if both are specified
      if (loaiGv && classItem[CLASS_FIELDS.TEACHER_TYPE]) {
        if (loaiGv !== classItem[CLASS_FIELDS.TEACHER_TYPE]) {
          return false;
        }
      }
      
      // All conditions passed
      return true;
    });
    
    console.log(`Found ${filteredClasses.length} classes matching criteria after filtering`);
    return filteredClasses;
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
    throw new Error(MESSAGES.MISSING_ID);
  }
  
  if (!updateData) {
    throw new Error('Thiếu dữ liệu cập nhật');
  }
  
  try {
    const response = await apiClient.patch(`/tables/${STUDENT}/records`, {
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