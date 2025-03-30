import axios from 'axios';
import { API_CONFIG, TABLE_IDS, FIELD_MAPPINGS } from '../../../config';

// Extract values from config
const { TOKEN, BASE_URL, TIMEOUT } = API_CONFIG;
const { STUDENT, STUDENT_INFO } = TABLE_IDS;
const { STUDENT: STUDENT_FIELDS, STUDENT_INFO: STUDENT_INFO_FIELDS } = FIELD_MAPPINGS;

// Create API client
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'xc-token': TOKEN
  },
  timeout: TIMEOUT
});

/**
 * Cập nhật thông tin lịch học của học viên
 * @param {string} studentId - ID của học viên trong bảng student
 * @param {string} scheduleText - Lịch học dạng văn bản rõ ràng
 * @param {string} status - Trạng thái mới của học viên
 * @returns {Promise<Object>} - Dữ liệu phản hồi từ API
 */
export const updateStudentSchedule = async (studentId, scheduleText, status) => {
  if (!studentId) {
    throw new Error('Thiếu ID học viên');
  }

  try {
    // Log request data to help debugging
    console.log('Updating student schedule with data:', {
      Id: studentId,
      Schedule: scheduleText,
      Status: status,
      SCHEDULE_FIELD: STUDENT_FIELDS.SCHEDULE,
      STATUS_FIELD: STUDENT_FIELDS.STATUS
    });

    // Make sure we're using the correct field names from the config
    const updateData = {
      Id: studentId
    };
    
    // Only add defined fields to avoid sending undefined values
    if (STUDENT_FIELDS.SCHEDULE) {
      updateData[STUDENT_FIELDS.SCHEDULE] = scheduleText;
    }
    
    if (STUDENT_FIELDS.STATUS) {
      updateData[STUDENT_FIELDS.STATUS] = status;
    }

    // Send only defined fields to the API
    const response = await apiClient.patch(`/tables/${STUDENT}/records`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating student schedule:', error);
    console.error('Request data:', {
      Id: studentId,
      [STUDENT_FIELDS.SCHEDULE]: scheduleText,
      [STUDENT_FIELDS.STATUS]: status
    });
    
    // Provide more detailed error information
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
    
    throw new Error(`Lỗi khi cập nhật lịch học: ${error.message}`);
  }
};

/**
 * Lưu bitmap lịch học vào bảng student_info
 * @param {string} maHocVien - Mã học viên (mã theo dõi)
 * @param {Object} scheduleBitmap - Bitmap lịch học
 * @returns {Promise<Object>} - Dữ liệu phản hồi từ API
 */
export const saveScheduleBitmap = async (maHocVien, scheduleBitmap) => {
  if (!maHocVien) {
    console.warn('Missing student ID, cannot save bitmap');
    return { success: false, message: 'Missing student ID' };
  }

  let existingRecords = [];

  try {
    // Convert bitmap to string for storage
    const bitmapString = JSON.stringify(scheduleBitmap);
    
    console.log('Saving schedule bitmap with data:', {
      STUDENT_ID_FIELD: STUDENT_INFO_FIELDS.STUDENT_ID,
      BITMAP_FIELD: STUDENT_INFO_FIELDS.SCHEDULE_BITMAP,
      MaHocVien: maHocVien
    });
    
    // First check if record exists for this student
    const checkResponse = await apiClient.get(`/tables/${STUDENT_INFO}/records`, {
      params: {
        where: `(${STUDENT_INFO_FIELDS.STUDENT_ID},eq,${maHocVien})`
      }
    });
    
    const existingRecords = checkResponse.data?.list || [];
    
    if (existingRecords.length > 0) {
      // Update existing record
      const recordId = existingRecords[0].Id;
      console.log(`Found existing student_info record (ID: ${recordId}), updating...`);
      
      const updateResponse = await apiClient.patch(`/tables/${STUDENT_INFO}/records`, {
        Id: recordId,
        [STUDENT_INFO_FIELDS.SCHEDULE_BITMAP]: bitmapString
      });
      
      console.log('Bitmap update successful');
      return updateResponse.data;
    } else {
      // Create new record
      console.log('No existing student_info record, creating new one...');
      
      const createResponse = await apiClient.post(`/tables/${STUDENT_INFO}/records`, {
        [STUDENT_INFO_FIELDS.STUDENT_ID]: maHocVien,
        [STUDENT_INFO_FIELDS.SCHEDULE_BITMAP]: bitmapString
      });
      
      console.log('Bitmap creation successful');
      return createResponse.data;
    }
  } catch (error) {
    console.error('Error saving schedule bitmap:', error);
    
    // Examine error details
    if (error.response) {
      console.error('Server response:', error.response.status, error.response.data);
      
      // If it's a 400 Bad Request, the bitmap string might be too large
      if (error.response.status === 400) {
        console.warn('Attempting to save compressed bitmap...');
        
        try {
          // Create a simplified bitmap with only day indexes that have selections
          const simplifiedBitmap = {};
          Object.keys(scheduleBitmap).forEach(dayIndex => {
            if (scheduleBitmap[dayIndex].some(val => val === 1)) {
              simplifiedBitmap[dayIndex] = scheduleBitmap[dayIndex];
            }
          });
          
          const simplifiedString = JSON.stringify(simplifiedBitmap);
          console.log('Simplified bitmap size:', simplifiedString.length, 'chars');
          
          // Try to save the simplified bitmap
          if (existingRecords && existingRecords.length > 0) {
            const recordId = existingRecords[0].Id;
            const updateResponse = await apiClient.patch(`/tables/${STUDENT_INFO}/records`, {
              Id: recordId,
              [STUDENT_INFO_FIELDS.SCHEDULE_BITMAP]: simplifiedString
            });
            
            console.log('Simplified bitmap update successful');
            return updateResponse.data;
          } else {
            const createResponse = await apiClient.post(`/tables/${STUDENT_INFO}/records`, {
              [STUDENT_INFO_FIELDS.STUDENT_ID]: maHocVien,
              [STUDENT_INFO_FIELDS.SCHEDULE_BITMAP]: simplifiedString
            });
            
            console.log('Simplified bitmap creation successful');
            return createResponse.data;
          }
        } catch (simplifiedError) {
          console.error('Even simplified bitmap save failed:', simplifiedError);
        }
      }
    }
    
    // Return error status but don't throw to avoid disrupting the main flow
    return { 
      success: false, 
      error: true,
      message: error.message || 'Unknown error saving bitmap'
    };
  }
};

export default {
  updateStudentSchedule,
  saveScheduleBitmap
};