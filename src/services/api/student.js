import apiClient from './client';
import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';

// Extract values from config
const { STUDENT } = TABLE_IDS;
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

// Dùng để debug
console.log('Debug student.js - TABLE_IDS:', TABLE_IDS);
console.log('Debug student.js - STUDENT value:', STUDENT);
console.log('Debug student.js - STUDENT_FIELDS:', STUDENT_FIELDS);

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

    console.log('fetchStudentData - API request details:', {
      billItemId,
      headers: apiClient.defaults.headers,
      baseURL: apiClient.defaults.baseURL
    });
    
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
  if (!updateData[FIELD_MAPPINGS.STUDENT.BILL_ITEM_ID]) {
    console.error('Missing BILL_ITEM_ID in update data');
    throw new Error(MESSAGES.MISSING_BILL_ITEM_ID);
  }

  try {
    console.log('\n=== Starting updateStudentClass ===');
    console.log('Original update data:', updateData);

    // Đầu tiên, tìm record ID dựa trên BILL_ITEM_ID
    console.log('\n1. Finding student record...');
    
    console.log('updateStudentClass - Finding student details:', {
      billItemId: updateData[FIELD_MAPPINGS.STUDENT.BILL_ITEM_ID]
    });
    
    const findResponse = await apiClient.get(`/tables/${STUDENT}/records`, {
      params: {
        where: `(billItemId,eq,${updateData[FIELD_MAPPINGS.STUDENT.BILL_ITEM_ID]})`,
        fields: ['Id']
      }
    });

    console.log('Find response:', findResponse.data);

    if (!findResponse.data?.list?.length) {
      console.error('No student record found!');
      throw new Error('Student record not found');
    }

    const recordId = findResponse.data.list[0].Id;
    console.log('Found record ID:', recordId);

    // Chuẩn bị dữ liệu cập nhật theo đúng format của NocoDB v2
    const mappedUpdateData = {};

    // Map các trường dữ liệu sang tên trường trong database
    Object.entries(updateData).forEach(([key, value]) => {
      // Bỏ qua trường Id vì chúng ta sẽ sử dụng nó trong URL
      if (key !== 'Id') {
        // Sử dụng tên trường gốc vì API endpoint đã được cấu hình để sử dụng tên trường trong code
        mappedUpdateData[key] = value;
      }
    });

    console.log('\n2. Updating student record...');
    console.log('Update URL:', `/tables/${STUDENT}/records`);
    console.log('Mapped update data:', mappedUpdateData);

    const response = await apiClient.patch(
      `/tables/${STUDENT}/records`,
      {
        Id: recordId,
        ...mappedUpdateData
      }
    );
    
    if (!response.data) {
      console.error('No data returned from update');
      throw new Error('No data returned from update');
    }
    
    console.log('\n3. Update successful!');
    console.log('Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('\n=== Error in updateStudentClass ===');
    console.error('Error object:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Request config:', {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data,
        headers: error.config?.headers
      });
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
        
    console.log('checkStudentExists - API request details:', {
      billItemId
    });
    
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
    
    // Kiểm tra xem đã có bản ghi chưa - sử dụng API v2
    console.log('updateOrCreateStudentInfo - Finding record details:', {
      maTheoDoiHV
    });
    
    const findResponse = await apiClient.get(`/tables/${TABLE_IDS.STUDENT_INFO}/records`, {
      params: {
        where: `(maTheoDoiHV,eq,${maTheoDoiHV})`,
        fields: ['Id']
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
      
      console.log('Student_info update details:', {
        recordId,
        dataFields: Object.keys(dataToUpdate)
      });
      
      const updateResponse = await apiClient.patch(
        `/tables/${TABLE_IDS.STUDENT_INFO}/records/${recordId}`,
        dataToUpdate
      );
      
      console.log('Student_info update response:', updateResponse.data);
      return updateResponse.data;
    } else {
      // Tạo bản ghi mới
      console.log('Creating new Student_info record');
      
      console.log('Student_info create details:', {
        dataFields: Object.keys(dataToUpdate)
      });
      
      const createResponse = await apiClient.post(
        `/tables/${TABLE_IDS.STUDENT_INFO}/records`,
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
    console.log('=== Starting updateStudentWithInfo ===');
    console.log('Input studentData:', studentData);
    console.log('Input studentInfoData:', studentInfoData);
    console.log('Input maTheoDoiHV:', maTheoDoiHV);
    console.log('Using STUDENT table:', TABLE_IDS.STUDENT);
    console.log('Using STUDENT_INFO table:', TABLE_IDS.STUDENT_INFO);
    
    // 1. Cập nhật bảng Student
    console.log('\n=== Updating Student table ===');
    const studentResult = await updateStudentClass(studentData);
    console.log('Student update result:', studentResult);
    
    // 2. Cập nhật hoặc tạo bảng Student_info (nếu có maTheoDoiHV)
    let infoResult = null;
    if (maTheoDoiHV) {
      console.log('\n=== Updating Student_info table ===');
      try {
        // Kiểm tra dữ liệu trước khi gửi
        console.log('studentInfoData before update:', studentInfoData);
        infoResult = await updateOrCreateStudentInfo(maTheoDoiHV, studentInfoData);
        console.log('Student_info update result:', infoResult);
      } catch (infoError) {
        console.error('\n=== Error updating Student_info ===');
        console.error('Error details:', infoError);
        console.error('Error response:', infoError.response?.data);
        // Không throw lỗi để tiếp tục luồng xử lý
      }
    } else {
      console.log('\n=== Skipping Student_info update (no maTheoDoiHV) ===');
    }
    
    console.log('\n=== Update process completed ===');
    console.log('Final results:', { studentResult, infoResult });
    
    return {
      studentResult,
      infoResult
    };
  } catch (error) {
    console.error('\n=== Critical error in updateStudentWithInfo ===');
    console.error('Error object:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error request:', {
      method: error.config?.method,
      url: error.config?.url,
      data: error.config?.data
    });
    throw error;
  }
};