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
    throw new Error('Thiếu mã học viên');
  }

  try {
    // Chuẩn bị dữ liệu bitmap dưới dạng chuỗi JSON
    const bitmapString = JSON.stringify(scheduleBitmap);
    
    console.log('Saving schedule bitmap with data:', {
      STUDENT_ID_FIELD: STUDENT_INFO_FIELDS.STUDENT_ID,
      BITMAP_FIELD: STUDENT_INFO_FIELDS.SCHEDULE_BITMAP,
      MaHocVien: maHocVien
    });
    
    // Tạm thời chỉ log thông tin để debug, không thực hiện lưu bitmap
    console.log('Would save bitmap:', bitmapString);
    
    // Return mock data để không ảnh hưởng đến flow
    return { success: true, message: 'Bitmap logging only for now' };
    
    /* Uncomment khi đã có table_id đúng và đã kiểm tra các field name
    // Kiểm tra xem đã có bản ghi cho học viên này chưa
    const checkResponse = await apiClient.get(`/tables/${STUDENT_INFO}/records`, {
      params: {
        where: `(${STUDENT_INFO_FIELDS.STUDENT_ID},eq,${maHocVien})`
      }
    });

    const existingRecords = checkResponse.data?.list || [];
    
    if (existingRecords.length > 0) {
      // Cập nhật bản ghi hiện có
      const recordId = existingRecords[0].Id;
      const response = await apiClient.patch(`/tables/${STUDENT_INFO}/records`, {
        Id: recordId,
        [STUDENT_INFO_FIELDS.SCHEDULE_BITMAP]: bitmapString
      });
      return response.data;
    } else {
      // Tạo bản ghi mới
      const response = await apiClient.post(`/tables/${STUDENT_INFO}/records`, {
        [STUDENT_INFO_FIELDS.STUDENT_ID]: maHocVien,
        [STUDENT_INFO_FIELDS.SCHEDULE_BITMAP]: bitmapString
      });
      return response.data;
    }
    */
  } catch (error) {
    console.error('Error saving schedule bitmap:', error);
    // Không throw error để flow tiếp tục
    console.warn('Failed to save bitmap, but continuing:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  updateStudentSchedule,
  saveScheduleBitmap
};