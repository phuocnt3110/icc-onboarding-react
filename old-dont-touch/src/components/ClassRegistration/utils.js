/**
 * Utility functions for ClassRegistration component
 */

import { FIELD_MAPPINGS, TIME_SLOTS, WEEKDAYS } from '../../config';

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS, CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;

/**
 * Process and group classes with the same code
 * Merges classes with the same Classcode but different schedules
 * @param {Array} classes - Array of class objects from API
 * @returns {Array} - Processed and grouped classes
 */
export const processClassList = (classes) => {
  if (!classes || !Array.isArray(classes) || classes.length === 0) {
    return [];
  }
  
  // Group classes by Classcode
  const groupedClasses = {};
  
  classes.forEach(classInfo => {
    if (!classInfo[CLASS_FIELDS.CODE]) {
      return; // Skip entries without Classcode
    }
    
    if (!groupedClasses[classInfo[CLASS_FIELDS.CODE]]) {
      // Initialize with first entry's data
      groupedClasses[classInfo[CLASS_FIELDS.CODE]] = {
        ...classInfo,
        schedules: []
      };
    }
    
    // Add schedule information if available
    if (classInfo[CLASS_FIELDS.WEEKDAY] && classInfo[CLASS_FIELDS.TIME]) {
      // Check if this schedule already exists
      const scheduleExists = groupedClasses[classInfo[CLASS_FIELDS.CODE]].schedules.some(
        s => s.weekday === classInfo[CLASS_FIELDS.WEEKDAY] && s.time === classInfo[CLASS_FIELDS.TIME]
      );
      
      if (!scheduleExists) {
        groupedClasses[classInfo[CLASS_FIELDS.CODE]].schedules.push({
          weekday: classInfo[CLASS_FIELDS.WEEKDAY],
          time: classInfo[CLASS_FIELDS.TIME]
        });
      }
    }
  });
  
  // Convert to array
  return Object.values(groupedClasses);
};

/**
 * Format schedule array to string
 * @param {Array} schedules - Array of schedule objects {weekday, time}
 * @returns {string} - Formatted schedule string
 */
export const formatSchedule = (schedules) => {
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return '';
  }
  
  return schedules.map(s => {
    if (!s.weekday || !s.time) {
      return ''; // Skip invalid entries
    }
    return `${s.weekday} - ${s.time}`;
  }).filter(s => s).join(' / ');
};

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

/**
 * Validate schedule selection
 * @param {Array} schedules - Array of selected schedules
 * @returns {Object} - Validation result {valid, message}
 */
export const validateScheduleSelection = (schedules) => {
  if (!schedules || !Array.isArray(schedules)) {
    return { 
      valid: false, 
      message: 'Lịch học không hợp lệ' 
    };
  }
  
  if (schedules.length === 0) {
    return { 
      valid: false, 
      message: 'Vui lòng chọn ít nhất một lịch học' 
    };
  }
  
  // Check for invalid schedules
  const invalidSchedules = schedules.filter(s => !s.weekday || !s.time);
  
  if (invalidSchedules.length > 0) {
    return { 
      valid: false, 
      message: 'Lịch học chứa thông tin không hợp lệ' 
    };
  }
  
  return { valid: true };
};

/**
 * Check if a student can select a class
 * @param {Object} studentData - Student data
 * @param {Object} classInfo - Class information
 * @returns {Object} - Validation result {valid, message}
 */
export const validateClassSelection = (studentData, classInfo) => {
  if (!studentData || !classInfo) {
    return { 
      valid: false, 
      message: 'Thiếu thông tin học viên hoặc lớp học' 
    };
  }
  
  // Check for required student data using field mappings
  const studentProduct = studentData[STUDENT_FIELDS.PRODUCT] || studentData[STUDENT_FIELDS.PACKAGE];
  if (!studentProduct) {
    return { 
      valid: false, 
      message: 'Thiếu thông tin khóa học' 
    };
  }
  
  // More relaxed validation - check if the class product contains the student product or vice versa
  const classProduct = classInfo[CLASS_FIELDS.PRODUCT] || '';
  const productMatch = 
    (classProduct && classProduct.toLowerCase().includes(studentProduct.toLowerCase())) || 
    (studentProduct.toLowerCase().includes(classProduct.toLowerCase()));
  
  if (!productMatch) {
    return { 
      valid: false, 
      message: 'Lớp học không phù hợp với khóa học đã đăng ký' 
    };
  }
  
  // Check size if both are specified
  const studentSize = studentData[STUDENT_FIELDS.CLASS_SIZE];
  const classSize = classInfo[CLASS_FIELDS.SIZE];
  if (studentSize && classSize && studentSize !== classSize) {
    return { 
      valid: false, 
      message: 'Lớp học không phù hợp với loại lớp đã đăng ký' 
    };
  }
  
  // Check teacher type if both are specified
  const studentTeacher = studentData[STUDENT_FIELDS.TEACHER_TYPE];
  const classTeacher = classInfo[CLASS_FIELDS.TEACHER_TYPE];
  if (studentTeacher && classTeacher && studentTeacher !== classTeacher) {
    return { 
      valid: false, 
      message: 'Lớp học không phù hợp với loại giáo viên đã đăng ký' 
    };
  }
  
  // Check if class has available slots - if the field exists
  if (classInfo[CLASS_FIELDS.SLOTS_LEFT] !== undefined && 
      classInfo[CLASS_FIELDS.SLOTS_LEFT] <= 0) {
    return { 
      valid: false, 
      message: 'Lớp học đã đủ số lượng học viên' 
    };
  }
  
  return { valid: true };
};

// Export TIME_SLOTS and WEEKDAYS from central config
export { TIME_SLOTS, WEEKDAYS };