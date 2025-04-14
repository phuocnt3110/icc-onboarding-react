import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';
import apiClient from './client';

// Extract values from config
const { CLASS } = TABLE_IDS;
const { CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;

// Dùng để debug
console.log('Debug class.js - TABLE_IDS:', TABLE_IDS);
console.log('Debug class.js - CLASS value:', CLASS);
console.log('Debug class.js - CLASS_FIELDS:', CLASS_FIELDS);

/**
 * Fetch available classes based on filters
 * @param {Object} filters - Filter criteria
 * @returns {Array} - List of available classes
 */
export const fetchAvailableClasses = async (filters) => {
  try {
    console.log('DEBUG - fetchAvailableClasses - Start fetching with filters:', filters);
    
    // Đảm bảo đường dẫn API đúng với NocoDB v2
    // Base URL đã có /api/v2 nên đường dẫn cần là /tables/{table}/records
    const url = `/tables/${CLASS}/records`;
    const params = {
      where: `(${CLASS_FIELDS.STATUS},eq,active)`,
      ...filters
    };
    
    console.log('DEBUG - fetchAvailableClasses - API request details:', {
      url,
      params,
      tableId: CLASS,
      whereClause: `(${CLASS_FIELDS.STATUS},eq,active)`,
      statusField: CLASS_FIELDS.STATUS,
      headers: apiClient.defaults.headers,
      baseURL: apiClient.defaults.baseURL
    });
    
    // Gọi API
    console.log('DEBUG - fetchAvailableClasses - Sending API request...');
    const response = await apiClient.get(url, { params });
    
    // Log kết quả thành công
    console.log('DEBUG - fetchAvailableClasses - API response status:', response.status);
    console.log('DEBUG - fetchAvailableClasses - API response data type:', typeof response.data);
    console.log('DEBUG - fetchAvailableClasses - API response data structure:', {
      hasListProperty: 'list' in response.data,
      listLength: response.data.list?.length || 0,
      responseKeys: Object.keys(response.data)
    });
    
    if (!response.data.list || response.data.list.length === 0) {
      console.log('DEBUG - fetchAvailableClasses - No classes found in response!');
    } else {
      console.log('DEBUG - fetchAvailableClasses - Found classes:', {
        count: response.data.list.length,
        firstClassCode: response.data.list[0]?.[CLASS_FIELDS.CODE] || 'N/A',
        sampleClass: response.data.list[0]
      });
    }
    
    const result = response.data.list || [];
    console.log('DEBUG - fetchAvailableClasses - Returning result array length:', result.length);
    
    return result;
  } catch (error) {
    // Xử lý lỗi chi tiết hơn
    console.error('Error fetching classes:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
    
    throw new Error(MESSAGES.CLASS_FETCH_ERROR);
  }
};

/**
 * Update class registration
 * @param {string} classCode - Class code to update
 * @returns {Object} - Updated class data
 */
export const updateClassRegistration = async (classCode) => {
  try {
    const response = await apiClient.patch(
      `/tables/${CLASS}/records/${classCode}`,
      {
        [CLASS_FIELDS.REGISTERED]: true
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating class registration:', error);
    throw new Error(MESSAGES.ERROR.UPDATE_REGISTRATION);
  }
};

/**
 * Check if a class is available for registration
 * @param {string} classCode - Class code to check
 * @returns {boolean} - Whether the class is available
 */
export const checkClassAvailability = async (classCode) => {
  try {
    console.log('DEBUG - checkClassAvailability - Checking availability for class:', classCode);
    
    // Sử dụng v2 thay vì v1 theo yêu cầu
    const url = `/tables/${CLASS}/records/${classCode}`;
    console.log('DEBUG - checkClassAvailability - API request URL:', url);
    
    const response = await apiClient.get(url);
    const classData = response.data;
    
    console.log('DEBUG - checkClassAvailability - Class data received:', {
      classCode,
      status: classData[CLASS_FIELDS.STATUS],
      registered: classData[CLASS_FIELDS.REGISTERED],
      data: classData
    });
    
    const isAvailable = classData[CLASS_FIELDS.STATUS] === 'active' && 
                      !classData[CLASS_FIELDS.REGISTERED];
                      
    console.log('DEBUG - checkClassAvailability - Class is available:', isAvailable);
    
    return isAvailable;
  } catch (error) {
    console.error('DEBUG - checkClassAvailability - Error checking class availability:', {
      classCode,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
}; 