/**
 * Validators and validation rules for student information form
 */

/**
 * Validate Vietnamese phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidVietnamesePhone = (phone) => {
  if (!phone) return false;
  
  // Remove country code if present
  let phoneNumber = phone;
  if (phone.startsWith('+84')) {
    phoneNumber = phone.substring(3);
  } else if (phone.startsWith('84')) {
    phoneNumber = phone.substring(2);
  }
  
  // Vietnamese phone numbers should be 9-10 digits
  // Starting with 0 is optional since we might have removed the country code
  const phoneRegex = /^(0|\+84|84)?([3|5|7|8|9])([0-9]{8})$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date in DD/MM/YYYY format
 * @param {string} dateString - Date string
 * @returns {boolean} True if valid
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  // Check format
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    return false;
  }
  
  // Check date values
  const [day, month, year] = dateString.split('/').map(Number);
  
  if (month < 1 || month > 12) return false;
  
  // Get days in month (consider leap year)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  
  // Valid date
  return true;
};

/**
 * Common form validation rules for Ant Design Form
 */
export const validationRules = {
  name: [
    { required: true, message: 'Vui lòng nhập họ tên' },
    { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' }
  ],
  gender: [
    { required: true, message: 'Vui lòng chọn giới tính' }
  ],
  dob: [
    { required: true, message: 'Vui lòng nhập ngày sinh' },
    { 
      validator: (_, value) => {
        if (!value || isValidDate(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('Ngày sinh không hợp lệ'));
      }
    }
  ],
  phone: [
    { required: true, message: 'Vui lòng nhập số điện thoại' },
    { 
      validator: (_, value) => {
        if (!value || isValidVietnamesePhone(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('Số điện thoại không hợp lệ'));
      }
    }
  ],
  email: [
    { 
      validator: (_, value) => {
        if (!value || isValidEmail(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('Email không hợp lệ'));
      }
    }
  ],
  province: [
    { required: true, message: 'Vui lòng chọn tỉnh/thành' }
  ],
  relation: [
    { required: true, message: 'Vui lòng chọn mối quan hệ' }
  ]
};
