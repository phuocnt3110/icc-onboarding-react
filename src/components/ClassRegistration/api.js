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
 * Modified to not group classes with the same code
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
    
    // Enhance class data with schedules for display but don't group them
    const enhancedClasses = filteredClasses.map(classItem => {
      console.log("Processing class:", classItem[CLASS_FIELDS.CODE], "with weekday:", classItem[CLASS_FIELDS.WEEKDAY]);
      
      // Create schedule structure for each class
      return {
        ...classItem,
        schedules: [{
          weekday: classItem[CLASS_FIELDS.WEEKDAY], // ngayHoc
          time: `${classItem[CLASS_FIELDS.START_TIME]} - ${classItem[CLASS_FIELDS.END_TIME]}` // gioBatDau - gioKetThuc
        }]
      };
    });
    
    console.log(`Processing completed, returning ${enhancedClasses.length} classes`);
    
    // Hàm xác định thứ tự của ngày trong tuần
    const getWeekdayOrder = (weekday) => {
      const weekdayMap = {
        'Thứ 2': 1,
        'Thứ 3': 2,
        'Thứ 4': 3,
        'Thứ 5': 4,
        'Thứ 6': 5,
        'Thứ 7': 6,
        'Chủ nhật': 7
      };
      
      return weekdayMap[weekday] || 99;
    };

    // Sắp xếp enhancedClasses trước khi trả về
    enhancedClasses.sort((a, b) => {
      // Đầu tiên, sắp xếp theo ngày khai giảng
      const dateA = a[CLASS_FIELDS.START_DATE] ? new Date(a[CLASS_FIELDS.START_DATE]) : new Date();
      const dateB = b[CLASS_FIELDS.START_DATE] ? new Date(b[CLASS_FIELDS.START_DATE]) : new Date();
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      // Nếu cùng ngày khai giảng, sắp xếp theo mã lớp
      if (a[CLASS_FIELDS.CODE] !== b[CLASS_FIELDS.CODE]) {
        return a[CLASS_FIELDS.CODE].localeCompare(b[CLASS_FIELDS.CODE]);
      }
      
      // Nếu cùng mã lớp, sắp xếp theo thứ trong tuần
      const weekdayOrderA = getWeekdayOrder(a[CLASS_FIELDS.WEEKDAY]);
      const weekdayOrderB = getWeekdayOrder(b[CLASS_FIELDS.WEEKDAY]);
      if (weekdayOrderA !== weekdayOrderB) {
        return weekdayOrderA - weekdayOrderB;
      }
      
      // Nếu cùng thứ, sắp xếp theo giờ bắt đầu
      return a[CLASS_FIELDS.START_TIME].localeCompare(b[CLASS_FIELDS.START_TIME]);
    });

    return enhancedClasses;
    
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
      
      // Enhance classes with schedules but don't group them
      const enhancedClasses = filteredClasses.map(classItem => {
        return {
          ...classItem,
          schedules: [{
            weekday: classItem[CLASS_FIELDS.WEEKDAY],
            time: `${classItem[CLASS_FIELDS.START_TIME]} - ${classItem[CLASS_FIELDS.END_TIME]}`
          }]
        };
      });
      
      console.log(`Fallback: Processing completed, returning ${enhancedClasses.length} classes`);
      
      return enhancedClasses;
    } catch (fallbackError) {
      console.error('Even fallback filtering failed:', fallbackError);
      throw fallbackError.originalError ? fallbackError : new Error(`Lỗi khi tải danh sách lớp học: ${fallbackError.message}`);
    }
  }
};

/**
 * Update student class information with improved error handling
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
    // Loại bỏ việc kiểm tra và cắt bớt độ dài chuỗi lịch học
    
    // Create clean request object with only needed fields
    const requestData = {
      Id: studentId
    };
    
    // Only add defined fields with values
    if (STUDENT_FIELDS.SCHEDULE && updateData[STUDENT_FIELDS.SCHEDULE]) {
      requestData[STUDENT_FIELDS.SCHEDULE] = updateData[STUDENT_FIELDS.SCHEDULE];
    }
    
    if (STUDENT_FIELDS.STATUS && updateData[STUDENT_FIELDS.STATUS]) {
      requestData[STUDENT_FIELDS.STATUS] = updateData[STUDENT_FIELDS.STATUS];
    }
    
    if (STUDENT_FIELDS.CLASS_CODE && updateData[STUDENT_FIELDS.CLASS_CODE]) {
      requestData[STUDENT_FIELDS.CLASS_CODE] = updateData[STUDENT_FIELDS.CLASS_CODE];
    }
    
    if (STUDENT_FIELDS.START_DATE && updateData[STUDENT_FIELDS.START_DATE]) {
      requestData[STUDENT_FIELDS.START_DATE] = updateData[STUDENT_FIELDS.START_DATE];
    }
    
    // Log what we're sending
    console.log('Sending update to API:', requestData);
    
    // Giữ nguyên logic thử lại, nhưng không thay đổi dữ liệu khi thử lại
    let attempts = 0;
    const maxAttempts = 2;
    let lastError = null;
    
    while (attempts <= maxAttempts) {
      try {
        // Add delay for retries
        if (attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
          console.log(`Retry attempt ${attempts}/${maxAttempts}`);
        }
        
        // Send the request
        const response = await apiClient.patch(`/tables/${STUDENT}/records`, requestData);
        
        console.log('Update successful:', response.data);
        return response.data;
      } catch (attemptError) {
        lastError = attemptError;
        console.error(`Update attempt ${attempts + 1} failed:`, attemptError);
        
        attempts++;
        
        // If this was the last attempt, or it's clearly a permissions issue, stop retrying
        if (attempts > maxAttempts || 
           (attemptError.response && 
            (attemptError.response.status === 401 || 
             attemptError.response.status === 403))) {
          break;
        }
      }
    }
    
    // All attempts failed
    console.error('All update attempts failed');
    
    // Format error message based on response type
    if (lastError.response) {
      const status = lastError.response.status;
      
      if (status === 400) {
        console.error('Bad Request details:', lastError.response.data);
        throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin lịch học.');
      } else if (status === 401 || status === 403) {
        throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.');
      } else if (status === 404) {
        throw new Error(`Không tìm thấy học viên với ID ${studentId}`);
      } else if (status >= 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
    }
    
    // Default error message if we couldn't categorize it better
    throw new Error(`Lỗi khi cập nhật thông tin lớp học: ${lastError.message}`);
  } catch (error) {
    console.error('Error updating student class:', error);
    throw error;
  }
};

/**
 * Update class registration count for all records with the same class code
 * @param {string} classCode - Class code
 * @returns {Promise<Object>} - Status of update operation
 * @throws {Error} - If update fails or API error
 */
export const updateClassRegistration = async (classCode) => {
  if (!classCode) {
    throw new Error('Thiếu mã lớp học');
  }
  
  try {
    // Tìm tất cả bản ghi có cùng mã lớp
    const response = await apiClient.get(`/tables/${CLASS}/records?where=(${CLASS_FIELDS.CODE},eq,${classCode})`);
    
    if (!response.data || !response.data.list || response.data.list.length === 0) {
      throw new Error(`Không tìm thấy lớp học với mã ${classCode}`);
    }
    
    const classRecords = response.data.list;
    console.log(`Tìm thấy ${classRecords.length} bản ghi với mã lớp ${classCode}`);
    
    // Cập nhật soDaDangKy cho tất cả bản ghi
    const updatePromises = classRecords.map(record => {
      const currentRegistered = record[CLASS_FIELDS.REGISTERED] || 0;
      const newRegistered = currentRegistered + 1;
      
      return apiClient.patch(`/tables/${CLASS}/records`, {
        Id: record.Id,
        [CLASS_FIELDS.REGISTERED]: newRegistered
      });
    });
    
    // Chờ tất cả các request cập nhật hoàn thành
    await Promise.all(updatePromises);
    
    return { success: true, message: `Đã cập nhật ${classRecords.length} bản ghi cho lớp ${classCode}` };
  } catch (error) {
    console.error('Error updating class registration:', error);
    throw error.originalError ? error : new Error(`Lỗi khi cập nhật số lượng đăng ký lớp học: ${error.message}`);
  }
};

export default apiClient;