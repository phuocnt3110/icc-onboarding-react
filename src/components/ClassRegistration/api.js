import axios from 'axios';
import { API_CONFIG, TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';
import { processClassList } from './utils';

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
 * Optimized to filter non-Vietnamese fields at API level and Vietnamese fields at client side
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
    // Only filter non-Vietnamese fields at API level
    const apiConditions = [];
    
    // Product filter (non-Vietnamese)
    if (sanPham) {
      apiConditions.push(`(${CLASS_FIELDS.PRODUCT},eq,${sanPham})`);
    }
    
    // Size filter (non-Vietnamese)
    if (sizeLop) {
      apiConditions.push(`(${CLASS_FIELDS.SIZE},eq,${sizeLop})`);
    }
    
    // Level/trinhDo filter (non-Vietnamese)
    if (goiMua) {
      apiConditions.push(`(${CLASS_FIELDS.LEVEL},eq,${goiMua})`);
    }
    
    // Build where clause for API filtering
    const whereClause = apiConditions.join('~and');
    
    // API parameters
    const params = { 
      limit: 100 
    };
    
    if (whereClause) {
      params.where = whereClause;
    }
    
    console.log('API filter conditions:', params.where);
    
    // Call API with non-Vietnamese filters
    const response = await apiClient.get(`/tables/${CLASS}/records`, { params });
    
    if (!response.data || !response.data.list) {
      return [];
    }
    
    const classes = response.data.list;
    console.log(`Found ${classes.length} classes from API before client-side filtering`);
    
    // Apply Vietnamese and formula-based filters at client side
    const filteredClasses = classes.filter(classItem => {
      // Status filter (Vietnamese)
      if (classItem[CLASS_FIELDS.STATUS] !== 'Dự kiến khai giảng') {
        return false;
      }
      
      // Teacher type filter (Vietnamese)
      if (loaiGv && classItem[CLASS_FIELDS.TEACHER_TYPE] !== loaiGv) {
        return false;
      }
      
      // Available slots filter (formula field)
      if (classItem[CLASS_FIELDS.SLOTS_LEFT] !== undefined && 
          classItem[CLASS_FIELDS.SLOTS_LEFT] <= 0) {
        return false;
      }
      
      // All conditions passed
      return true;
    });
    
    console.log(`Found ${filteredClasses.length} classes after client-side filtering`);
    
    // Enhance class data with schedules for display
    const enhancedClasses = filteredClasses.map(classItem => {

      console.log("Schedule fields:", {
        weekday: classItem[CLASS_FIELDS.WEEKDAY],
        startTime: classItem[CLASS_FIELDS.START_TIME],
        endTime: classItem[CLASS_FIELDS.END_TIME]
      });
      
      // Create schedules structure for each class
      return {
        ...classItem,
        schedules: [{
          weekday: classItem[CLASS_FIELDS.WEEKDAY], // ngayHoc
          time: `${classItem[CLASS_FIELDS.START_TIME]} - ${classItem[CLASS_FIELDS.END_TIME]}` // gioBatDau - gioKetThuc
        }]
      };
    });
    
    // Process and group classes with the same code
    const processedClasses = processClassList(enhancedClasses);
    console.log(`Processed ${processedClasses.length} classes for display`);
    
    return processedClasses;
    
  } catch (error) {
    console.error('Error fetching available classes:', error);
    
    // Fallback: Complete client-side filtering if API filtering fails
    console.warn('API filtering failed, falling back to complete client-side filtering');
    try {
      const response = await apiClient.get(`/tables/${CLASS}/records?limit=100`);
      
      if (!response.data || !response.data.list) {
        return [];
      }
      
      const allClasses = response.data.list;
      console.log(`Fallback: Found ${allClasses.length} total classes to filter`);
      
      // Filter all conditions at client side
      const filteredClasses = allClasses.filter(classItem => {
        // Status filter (Vietnamese)
        if (classItem[CLASS_FIELDS.STATUS] !== 'Dự kiến khai giảng') {
          return false;
        }
        
        // Available slots filter (formula field)
        if (classItem[CLASS_FIELDS.SLOTS_LEFT] !== undefined && 
            classItem[CLASS_FIELDS.SLOTS_LEFT] <= 0) {
          return false;
        }
        
        // Product filter
        if (sanPham && classItem[CLASS_FIELDS.PRODUCT] !== sanPham) {
          return false;
        }
        
        // Size filter
        if (sizeLop && classItem[CLASS_FIELDS.SIZE] !== sizeLop) {
          return false;
        }
        
        // Teacher type filter (Vietnamese)
        if (loaiGv && classItem[CLASS_FIELDS.TEACHER_TYPE] !== loaiGv) {
          return false;
        }
        
        // Level filter
        if (goiMua && classItem[CLASS_FIELDS.LEVEL] !== goiMua) {
          return false;
        }
        
        // All conditions passed
        return true;
      });
      
      // Enhance classes with schedules
      const enhancedClasses = filteredClasses.map(classItem => {
        return {
          ...classItem,
          schedules: [{
            weekday: classItem[CLASS_FIELDS.WEEKDAY],
            time: `${classItem[CLASS_FIELDS.START_TIME]} - ${classItem[CLASS_FIELDS.END_TIME]}`
          }]
        };
      });
      
      // Process classes for display
      const processedClasses = processClassList(enhancedClasses);
      console.log(`Fallback: Processed ${processedClasses.length} classes for display`);
      
      return processedClasses;
    } catch (fallbackError) {
      console.error('Even fallback filtering failed:', fallbackError);
      throw fallbackError.originalError ? fallbackError : new Error(`Lỗi khi tải danh sách lớp học: ${fallbackError.message}`);
    }
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