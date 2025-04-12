import { FIELD_MAPPINGS } from '../../config';

/**
 * Format date string to display format
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Validate class selection
 * @param {Object} studentData - Student data
 * @param {Object} classData - Class data
 * @returns {Object} Validation result
 */
export const validateClassSelection = (studentData, classData) => {
  const { STUDENT: STUDENT_FIELDS, CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;
  
  // Check if class is full
  if (classData[CLASS_FIELDS.REGISTERED] >= classData[CLASS_FIELDS.TOTAL_SLOTS]) {
    return {
      valid: false,
      message: 'Lớp học đã đầy'
    };
  }
  
  // Check if student has already registered for this class
  if (studentData[STUDENT_FIELDS.CLASS_CODE] === classData[CLASS_FIELDS.CODE]) {
    return {
      valid: false,
      message: 'Bạn đã đăng ký lớp này rồi'
    };
  }
  
  // Check if student has already registered for another class
  if (studentData[STUDENT_FIELDS.CLASS_CODE]) {
    return {
      valid: false,
      message: 'Bạn đã đăng ký một lớp khác rồi'
    };
  }
  
  return {
    valid: true,
    message: 'Lớp học hợp lệ'
  };
};

/**
 * Process class list
 * @param {Array} classList - List of classes
 * @returns {Array} Processed class list
 */
export const processClassList = (classList) => {
  if (!classList || !classList.length) return [];
  
  return classList.map(classItem => ({
    ...classItem,
    schedules: classItem.schedules || [{
      weekday: classItem[FIELD_MAPPINGS.CLASS.WEEKDAY] || '',
      time: `${classItem[FIELD_MAPPINGS.CLASS.START_TIME] || ''} - ${classItem[FIELD_MAPPINGS.CLASS.END_TIME] || ''}`
    }]
  }));
};

/**
 * Format schedule display
 * @param {Object} schedule - Schedule object
 * @returns {string} Formatted schedule string
 */
export const formatSchedule = (schedule) => {
  if (!schedule) return '';
  return `${schedule.weekday}: ${schedule.time}`;
}; 