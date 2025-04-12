import apiClient from './client';
import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';

// Extract values from config
const { RESERVATION } = TABLE_IDS;
const { RESERVATION: RESERVATION_FIELDS } = FIELD_MAPPINGS;

/**
 * Check if a class is already reserved
 * @param {string} classCode - Class code to check
 * @returns {boolean} - Whether the class is reserved
 */
export const checkReservation = async (classCode) => {
  try {
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
    await apiClient.delete(`/tables/${RESERVATION}/records/${reservationId}`);
    return true;
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return false;
  }
}; 