/**
 * Utility functions for formatting data in StudentInfo component
 */
import moment from 'moment';
import { COUNTRY_CODES } from '../../../config';

/**
 * Format currency value
 * @param {number|string} value - Currency value
 * @returns {string} Formatted currency
 */
export const formatCurrency = (value) => {
  if (!value) return '-';
  return `${parseInt(value).toLocaleString('vi-VN')} VNĐ`;
};

/**
 * Format date to local format
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

/**
 * Format phone number to ensure it has the correct format
 * @param {string} phoneValue - Phone number
 * @returns {string} Formatted phone number with country code
 */
export const formatPhoneNumber = (phoneValue) => {
  if (!phoneValue) return '';
  
  // Convert to string
  const val = String(phoneValue);
  
  // If already starts with +, assume it's correctly formatted
  if (val.startsWith('+')) return val;
  
  // If it has 84- format, convert to +84 format
  if (val.startsWith('84-')) {
    return `+84${val.substring(3)}`;
  }
  
  // If it's just digits, assume Vietnam
  if (/^\d+$/.test(val)) {
    return `+84${val}`;
  }
  
  // Default case: return as is
  return val;
};

/**
 * Convert gender value between Vietnamese and English
 * @param {string} gender - Gender value
 * @returns {string} Converted value
 */
export const mapGender = (gender) => {
  if (!gender) return '';
  
  // Lowercase for easier comparison
  const normalizedGender = gender.toLowerCase().trim();
  
  if (normalizedGender === 'male') {
    return 'Nam';
  } else if (normalizedGender === 'female') {
    return 'Nữ';
  } else if (normalizedGender === 'nam' || normalizedGender === 'nữ') {
    // If already in Vietnamese, keep the case consistent
    return normalizedGender === 'nam' ? 'Nam' : 'Nữ';
  }
  
  // Other cases, return empty string
  return '';
};

/**
 * Format date string to moment object or standardized format
 * @param {string} dateString - Date string in various formats
 * @returns {moment|null} Moment object or null if invalid
 */
export const formatDateString = (dateString) => {
  if (!dateString) return null;
  
  console.log("Formatting date string:", dateString);
  
  // Handle DD/MM/YYYY format (common in Vietnam)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/').map(Number);
    // Month in JS starts from 0
    return moment(new Date(year, month - 1, day));
  }
  
  // Try other formats
  const formats = ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'];
  for (const format of formats) {
    const parsed = moment(dateString, format, true);
    if (parsed.isValid()) {
      return parsed;
    }
  }
  
  // If parsing fails, return null
  console.error("Could not parse date:", dateString);
  return null;
};

/**
 * Get valid years for year selection dropdown
 * @returns {number[]} Array of valid years from 1900 to current year
 */
export const getValidYears = () => {
  const currentYear = new Date().getFullYear();
  // Create array of years from 1900 to current year
  return Array.from(
    { length: currentYear - 1900 + 1 }, 
    (_, i) => currentYear - i
  );
};
