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