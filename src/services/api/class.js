import apiClient from './client';
import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';

// Extract values from config
const { CLASS } = TABLE_IDS;
const { CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;

/**
 * Fetch available classes based on filters
 * @param {Object} filters - Filter criteria
 * @returns {Array} - List of available classes
 */
export const fetchAvailableClasses = async (filters) => {
  try {
    const response = await apiClient.get(`/db/data/v1/${CLASS}`, {
      params: {
        where: `(${CLASS_FIELDS.STATUS},eq,active)`,
        ...filters
      }
    });
    
    return response.data.list || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw new Error(MESSAGES.ERROR.FETCH_CLASSES);
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
      `/db/data/v1/${CLASS}/${classCode}`,
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
    const response = await apiClient.get(`/db/data/v1/${CLASS}/${classCode}`);
    const classData = response.data;
    
    return classData[CLASS_FIELDS.STATUS] === 'active' && 
           !classData[CLASS_FIELDS.REGISTERED];
  } catch (error) {
    console.error('Error checking class availability:', error);
    return false;
  }
}; 