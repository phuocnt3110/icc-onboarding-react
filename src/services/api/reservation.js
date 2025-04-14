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
 * @param {string} classCode - Class code to check
 * @returns {boolean} - Whether the class is reserved
 */
export const checkReservation = async (classCode) => {
  try {
    console.log('checkReservation - API request details:', {
      classCode
    });
    
    const response = await apiClient.get(`/tables/${RESERVATION}/records`, {
      params: {
        where: `(${RESERVATION_FIELDS.CLASS_CODE},eq,${classCode})`
      }
    });
    
    return response.data.list.length > 0;
  } catch (error) {
    console.error('Error checking reservation:', error);
    return false;
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