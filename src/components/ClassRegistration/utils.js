/**
 * Utility functions for ClassRegistration component
 */

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
      if (!classInfo.Classcode) {
        return; // Skip entries without Classcode
      }
      
      if (!groupedClasses[classInfo.Classcode]) {
        // Initialize with first entry's data
        groupedClasses[classInfo.Classcode] = {
          ...classInfo,
          schedules: []
        };
      }
      
      // Add schedule information if available
      if (classInfo.Weekday && classInfo.Time) {
        // Check if this schedule already exists
        const scheduleExists = groupedClasses[classInfo.Classcode].schedules.some(
          s => s.weekday === classInfo.Weekday && s.time === classInfo.Time
        );
        
        if (!scheduleExists) {
          groupedClasses[classInfo.Classcode].schedules.push({
            weekday: classInfo.Weekday,
            time: classInfo.Time
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
    
    // Check for required student data
    if (!studentData.tenSanPham) {
      return { 
        valid: false, 
        message: 'Thiếu thông tin khóa học' 
      };
    }
    
    // Check if class matches student requirements
    if (studentData.tenSanPham !== classInfo.Product) {
      return { 
        valid: false, 
        message: 'Lớp học không phù hợp với khóa học đã đăng ký' 
      };
    }
    
    if (studentData.size !== classInfo.Size) {
      return { 
        valid: false, 
        message: 'Lớp học không phù hợp với loại lớp đã đăng ký' 
      };
    }
    
    if (studentData.loaiGiaoVien !== classInfo.Teacher_type) {
      return { 
        valid: false, 
        message: 'Lớp học không phù hợp với loại giáo viên đã đăng ký' 
      };
    }
    
    if (studentData.trinhDo !== classInfo.Level) {
      return { 
        valid: false, 
        message: 'Lớp học không phù hợp với trình độ đã đăng ký' 
      };
    }
    
    // Check if class has available slots
    if (classInfo.soSlotConLai <= 0) {
      return { 
        valid: false, 
        message: 'Lớp học đã đủ số lượng học viên' 
      };
    }
    
    return { valid: true };
  };
  
  /**
   * Available time slots
   */
  export const TIME_SLOTS = [
    '08:00-09:30',
    '09:45-11:15',
    '14:00-15:30',
    '15:45-17:15',
    '17:30-19:00',
    '19:15-20:45'
  ];
  
  /**
   * Weekdays
   */
  export const WEEKDAYS = [
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
    'Chủ nhật'
  ];