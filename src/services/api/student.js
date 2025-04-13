import apiClient from './client';
import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';

// Extract values from config
const { STUDENT } = TABLE_IDS;
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

/**
 * Fetch student data by BILL_ITEM_ID
 * @param {string} billItemId - BILL_ITEM_ID value
 * @returns {Object} - Student data
 */
export const fetchStudentData = async (billItemId) => {
  if (!billItemId) {
    console.error('Missing BILL_ITEM_ID in fetchStudentData');
    throw new Error(MESSAGES.MISSING_BILL_ITEM_ID);
  }

  try {
    console.log('Fetching student data with BILL_ITEM_ID:', billItemId);
    console.log('Using table:', STUDENT);
    console.log('Using field:', STUDENT_FIELDS.BILL_ITEM_ID);

    const response = await apiClient.get(`/tables/${STUDENT}/records`, {
      params: {
        where: `(${STUDENT_FIELDS.BILL_ITEM_ID},eq,${billItemId})`
      }
    });
    
    console.log('API Response:', response.data);

    if (!response.data?.list?.length) {
      console.error('No student found with BILL_ITEM_ID:', billItemId);
      throw new Error(MESSAGES.STUDENT_NOT_FOUND);
    }

    // Get the first record and process null values
    const studentData = response.data.list[0];
    
    // Process null values
    const processedData = {
      ...studentData,
      [STUDENT_FIELDS.BILL_ITEM_ID]: studentData[STUDENT_FIELDS.BILL_ITEM_ID] || billItemId,
      diaChi: studentData.diaChi || '',
      maBOS: studentData.maBOS || '',
      maHocVienGiaHan: studentData.maHocVienGiaHan || '',
      maLop: studentData.maLop || '',
      maLopBanGiao: studentData.maLopBanGiao || '',
      nguoiChamSoc: studentData.nguoiChamSoc || '',
      soBuoiConLai: studentData.soBuoiConLai || 0,
      soBuoiDaHoc: studentData.soBuoiDaHoc || 0,
      soDienThoaiDangKyZalo: studentData.soDienThoaiDangKyZalo || '',
      trangThaiChamSoc: studentData.trangThaiChamSoc || '',
      trangThaiGoi: studentData.trangThaiGoi || '',
      trangThaiHGoiPhi: studentData.trangThaiHGoiPhi || ''
    };

    console.log('Processed student data:', processedData);
    return processedData;
  } catch (error) {
    console.error('Error fetching student data:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(error.message || MESSAGES.STUDENT_DATA_LOAD_ERROR);
  }
};

/**
 * Update student class information
 * @param {Object} updateData - Data to update
 * @returns {Object} - Updated student data
 */
export const updateStudentClass = async (updateData) => {
  if (!updateData[STUDENT_FIELDS.BILL_ITEM_ID]) {
    console.error('Missing BILL_ITEM_ID in update data');
    throw new Error(MESSAGES.MISSING_BILL_ITEM_ID);
  }

  try {
    console.log('Updating student with BILL_ITEM_ID:', updateData[STUDENT_FIELDS.BILL_ITEM_ID]);
    console.log('Update data:', updateData);

    const response = await apiClient.patch(
      `/tables/${STUDENT}/records`,
      {
        where: `(${STUDENT_FIELDS.BILL_ITEM_ID},eq,${updateData[STUDENT_FIELDS.BILL_ITEM_ID]})`,
        data: updateData
      }
    );
    
    if (!response.data) {
      console.error('No data returned from update');
      throw new Error('No data returned from update');
    }
    
    console.log('Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating student class:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(error.message || MESSAGES.UPDATE_FAILED.replace('{error}', error.message));
  }
};

/**
 * Check if student exists by BILL_ITEM_ID
 * @param {string} billItemId - BILL_ITEM_ID value
 * @returns {boolean} - Whether student exists
 */
export const checkStudentExists = async (billItemId) => {
  if (!billItemId) {
    return false;
  }

  try {
    console.log('Checking student existence with BILL_ITEM_ID:', billItemId);
    const response = await apiClient.get(`/tables/${STUDENT}/records`, {
      params: {
        where: `(${STUDENT_FIELDS.BILL_ITEM_ID},eq,${billItemId})`
      }
    });
    
    console.log('Check response:', response.data);
    return response.data.list.length > 0;
  } catch (error) {
    console.error('Error checking student existence:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}; 

/**
 * Tìm kiếm hoặc tạo mới bản ghi Student_info
 * @param {string} maTheoDoiHV - Mã theo dõi học viên
 * @param {Object} studentInfoData - Dữ liệu cập nhật
 * @returns {Object} - Thông tin bản ghi đã cập nhật hoặc tạo mới
 */
export const updateOrCreateStudentInfo = async (maTheoDoiHV, studentInfoData) => {
  if (!maTheoDoiHV) {
    console.error('Missing student ID in updateOrCreateStudentInfo');
    throw new Error('Missing student ID');
  }

  try {
    console.log('Finding or creating Student_info with student ID:', maTheoDoiHV);
    
    // Kiểm tra xem đã có bản ghi chưa
    const findResponse = await apiClient.get(`/db/data/v1/${TABLE_IDS.STUDENT_INFO}`, {
      params: {
        where: `(${FIELD_MAPPINGS.STUDENT_INFO.STUDENT_ID},eq,${maTheoDoiHV})`
      }
    });
    
    const existingRecords = findResponse.data?.list || [];
    
    // Đảm bảo dữ liệu có chứa mã học viên
    const dataToUpdate = {
      ...studentInfoData,
      [FIELD_MAPPINGS.STUDENT_INFO.STUDENT_ID]: maTheoDoiHV
    };
    
    // Xử lý tạo mới hoặc cập nhật
    if (existingRecords.length > 0) {
      // Cập nhật bản ghi hiện có
      const recordId = existingRecords[0].Id;
      console.log(`Updating existing Student_info record with ID: ${recordId}`);
      
      const updateResponse = await apiClient.patch(
        `/db/data/v1/${TABLE_IDS.STUDENT_INFO}/${recordId}`,
        dataToUpdate
      );
      
      console.log('Student_info update response:', updateResponse.data);
      return updateResponse.data;
    } else {
      // Tạo bản ghi mới
      console.log('Creating new Student_info record');
      
      const createResponse = await apiClient.post(
        `/db/data/v1/${TABLE_IDS.STUDENT_INFO}`,
        dataToUpdate
      );
      
      console.log('Student_info create response:', createResponse.data);
      return createResponse.data;
    }
  } catch (error) {
    console.error('Error in updateOrCreateStudentInfo:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

/**
 * Cập nhật cả thông tin Student và Student_info
 * @param {Object} studentData - Dữ liệu Student cần cập nhật
 * @param {Object} studentInfoData - Dữ liệu Student_info cần cập nhật
 * @param {string} maTheoDoiHV - Mã theo dõi học viên
 * @returns {Object} - Kết quả cập nhật
 */
export const updateStudentWithInfo = async (studentData, studentInfoData, maTheoDoiHV) => {
  try {
    console.log('Updating both Student and Student_info');
    
    // 1. Cập nhật bảng Student
    const studentResult = await updateStudentClass(studentData);
    
    // 2. Cập nhật hoặc tạo bảng Student_info (nếu có maTheoDoiHV)
    let infoResult = null;
    if (maTheoDoiHV) {
      try {
        infoResult = await updateOrCreateStudentInfo(maTheoDoiHV, studentInfoData);
      } catch (infoError) {
        console.error('Error updating Student_info but continuing:', infoError);
        // Không throw lỗi để tiếp tục luồng xử lý
      }
    }
    
    return {
      studentResult,
      infoResult
    };
  } catch (error) {
    console.error('Error in updateStudentWithInfo:', error);
    throw error;
  }
};