import apiClient from './client';
import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';

// Extract values from config
const { RESERVATION } = TABLE_IDS;
const { RESERVATION: RESERVATION_FIELDS } = FIELD_MAPPINGS;

// Dùng để debug
console.log('Debug reservation.js - TABLE_IDS:', TABLE_IDS);
console.log('Debug reservation.js - RESERVATION value:', RESERVATION);
console.log('Debug reservation.js - RESERVATION_FIELDS:', RESERVATION_FIELDS);

/**
 * Check if a class is already reserved
 * @param {string} handoverClassCode - Mã lớp bàn giao (maLopBanGiao) cần kiểm tra
 * @returns {Object} - Trả về {found: boolean, data: Object} chứa thông tin reservation nếu tìm thấy
 */
export const checkReservation = async (handoverClassCode) => {
  try {
    console.log('checkReservation - API request details:', {
      handoverClassCode
    });
    
    // Sửa lại để so sánh maGiuCho (order_code) với maLopBanGiao (handoverClassCode)
    // Thêm log để dễ debug
    console.log('checkReservation - Tìm kiếm reservation với mã lớp bàn giao:', handoverClassCode);
    
    // Thêm điều kiện checkHopLe = "Hợp lệ" để đảm bảo chỉ lấy các reservation hợp lệ
    const response = await apiClient.get(`/tables/${RESERVATION}/records`, {
      params: {
        where: `(${RESERVATION_FIELDS.ORDER_CODE},eq,${handoverClassCode})~and(${RESERVATION_FIELDS.IS_VALID},eq,Hợp lệ)`
      }
    });
    
    console.log('checkReservation - Điều kiện truy vấn:', {
      query: `(${RESERVATION_FIELDS.ORDER_CODE},eq,${handoverClassCode})~and(${RESERVATION_FIELDS.IS_VALID},eq,Hợp lệ)`
    });
    
    const found = response.data.list.length > 0;
    const reservationData = found ? response.data.list[0] : null;
    
    console.log('checkReservation - Kết quả tìm kiếm:', {
      found,
      count: response.data.list.length,
      reservationData
    });
    
    // Trả về cả dữ liệu và trạng thái tìm thấy
    return {
      found,
      data: reservationData
    };
  } catch (error) {
    console.error('Error checking reservation:', error);
    return {
      found: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Create a new reservation
 * @param {Object} reservationData - Reservation data
 * @returns {Object} - Created reservation data
 */
export const createReservation = async (reservationData) => {
  try {
    console.log('createReservation - API request details:', {
      dataFields: Object.keys(reservationData)
    });
    
    const response = await apiClient.post(
      `/tables/${RESERVATION}/records`,
      reservationData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw new Error(MESSAGES.ERROR.CREATE_RESERVATION);
  }
};

/**
 * Delete a reservation
 * @param {string} reservationId - Reservation ID
 * @returns {boolean} - Whether the deletion was successful
 */
export const deleteReservation = async (reservationId) => {
  try {
    console.log('deleteReservation - API request details:', {
      reservationId
    });
    
    await apiClient.delete(`/tables/${RESERVATION}/records/${reservationId}`);
    return true;
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return false;
  }
};

/**
 * Update reservation status
 * @param {string} reservationId - Reservation ID
 * @param {string} confirmStatus - Giá trị mới cho trường CheckTrangThaiXacNhanLich (XacNhanLich/KhongXacNhanLich)
 * @returns {Object} - Updated reservation data
 */
export const updateReservation = async (reservationId, confirmStatus) => {
  try {
    console.log('updateReservation - API request details:', {
      reservationId,
      confirmStatus
    });
    
    if (!reservationId) {
      throw new Error('Thiếu ID của reservation');
    }
    
    // Dữ liệu cập nhật
    const updateData = {
      Id: reservationId,
      CheckTrangThaiXacNhanLich: confirmStatus
    };
    
    // Gọi API cập nhật
    const response = await apiClient.patch(
      `/tables/${RESERVATION}/records`, 
      updateData
    );
    
    console.log('updateReservation - Kết quả cập nhật:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating reservation:', error);
    
    if (error.response) {
      console.error('Response error:', error.response.data);
    }
    
    throw new Error(`Không thể cập nhật trạng thái giữ chỗ: ${error.message}`);
  }
}; 