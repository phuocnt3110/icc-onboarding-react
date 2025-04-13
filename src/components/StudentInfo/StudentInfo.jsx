import React, { useState, useEffect, useRef, useReducer, memo } from 'react';
import { Card, Form, Input, Button, Typography, Row, Col, Divider, message, Spin, Alert, Result, Radio, Select, Checkbox, DatePicker } from 'antd';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { EditOutlined, CheckOutlined, CloseOutlined, ReloadOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useStudent } from '../../contexts/StudentContext';
import { FIELD_MAPPINGS, MESSAGES, ROUTES, THEME, SECTION_TITLES, COUNTRY_CODES, VIETNAM_PROVINCES, GUARDIAN_RELATIONS, TABLE_IDS } from '../../config';
import { ProvinceSelector } from '../common';
import StudentInfoSkeleton from './StudentInfoSkeleton';
import '../../styles/student-info.css';
import '../../styles/index.css';
import apiClient from '../../services/api/client';

const { Title, Text } = Typography;
const { Option } = Select;

// PhoneInput component for phone numbers
// Sửa lại component PhoneInput
const PhoneInput = ({ value = "", onChange, autoFocus, disabled, placeholder, hint, onBlur }) => {
  // Parse the initial value to extract country code and phone number
  const parseValue = (inputValue) => {
    if (!inputValue) return { countryCode: '+84', phoneNumber: '' };
    
    // Find the country code in the input value
    const codeObj = COUNTRY_CODES.find(c => inputValue.startsWith(c.code));
    if (codeObj) {
      return {
        countryCode: codeObj.code,
        phoneNumber: inputValue.substring(codeObj.code.length).trim()
      };
    }
    
    // Default to Vietnam if no code matches
    return { countryCode: '+84', phoneNumber: inputValue };
  };
  
  const { countryCode, phoneNumber } = parseValue(value);
  
  // State for the country code and phone number parts
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCode);
  const [inputPhoneNumber, setInputPhoneNumber] = useState(phoneNumber);
  
  // Update parent component's value when either part changes
  useEffect(() => {
    if (onChange) {
      onChange(`${selectedCountryCode}${inputPhoneNumber}`);
    }
  }, [selectedCountryCode, inputPhoneNumber, onChange]);
  
  // Handle country code change
  const handleCountryCodeChange = (code) => {
    setSelectedCountryCode(code);
  };
  
  // Handle phone number input change
  const handlePhoneNumberChange = (e) => {
    setInputPhoneNumber(e.target.value);
  };
  
  // Handle container blur
  const handleContainerBlur = (e) => {
    // Chỉ gọi onBlur nếu click ra ngoài container và onBlur được định nghĩa
    if (!e.currentTarget.contains(e.relatedTarget) && onBlur) {
      onBlur();
    }
  };
  
  return (
    <div className="phone-input-container" onBlur={handleContainerBlur}>
      <div className="input-with-actions">
        <Select
          className="country-code-select"
          value={selectedCountryCode}
          onChange={handleCountryCodeChange}
          disabled={disabled}
          popupClassName="country-dropdown"
          popupMatchSelectWidth={false}
          showSearch
          optionFilterProp="label"
          filterOption={(input, option) => {
            const searchText = `${option.value} ${option.data.country}`.toLowerCase();
            return searchText.includes(input.toLowerCase());
          }}
        >
          {COUNTRY_CODES.map((item) => (
            <Option key={item.code} value={item.code} label={`${item.code} ${item.country}`} data={{ country: item.country }}>
              <div className="country-code-option">
                <span className="country-code">{item.code}</span>
                <span className="country-name">{item.country}</span>
              </div>
            </Option>
          ))}
        </Select>
        
        <Input
          className="phone-number-input"
          value={inputPhoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder || "Số điện thoại"}
          autoFocus={autoFocus}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onBlur) {
              onBlur();
            }
          }}
        />
      </div>
      
      {hint && <div className="phone-input-hint">{hint}</div>}
    </div>
  );
};

const getValidYears = () => {
  const currentYear = new Date().getFullYear();
  // Tạo mảng năm từ 1900 đến năm hiện tại
  return Array.from(
    { length: currentYear - 1900 + 1 }, 
    (_, i) => currentYear - i
  );
};

// Utility functions
const formatCurrency = (value) => {
  if (!value) return '-';
  return `${parseInt(value).toLocaleString('vi-VN')} VNĐ`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

// Format phone number to ensure it has the correct format
const formatPhoneNumber = (phoneValue) => {
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
 * Chuyển đổi giá trị giới tính từ tiếng Anh sang tiếng Việt
 * @param {string} gender Giá trị giới tính
 * @returns {string} Giá trị đã được chuyển đổi
 */
const mapGender = (gender) => {
  if (!gender) return '';
  
  // Chuyển thành chữ thường để dễ so sánh
  const normalizedGender = gender.toLowerCase().trim();
  
  if (normalizedGender === 'male') {
    return 'Nam';
  } else if (normalizedGender === 'female') {
    return 'Nữ';
  } else if (normalizedGender === 'nam' || normalizedGender === 'nữ') {
    // Nếu đã là tiếng Việt, giữ nguyên nhưng chuẩn hóa chữ hoa/thường
    return normalizedGender === 'nam' ? 'Nam' : 'Nữ';
  }
  
  // Trường hợp khác, trả về chuỗi rỗng
  return '';
};

// Hàm chuyển đổi định dạng ngày tháng
// Hàm cải tiến để xử lý và kiểm tra chặt chẽ hơn
const formatDateString = (dateString) => {
  if (!dateString) return null;
  
  console.log("Formatting date string:", dateString);
  
  // Xử lý cho định dạng DD/MM/YYYY (định dạng phổ biến tại Việt Nam)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/').map(Number);
    // Tháng trong JS bắt đầu từ 0
    return moment(new Date(year, month - 1, day));
  }
  
  // Thử các định dạng khác
  const formats = ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'];
  for (const format of formats) {
    const parsed = moment(dateString, format, true);
    if (parsed.isValid()) {
      return parsed;
    }
  }
  
  // Nếu không parse được, trả về null
  console.error("Could not parse date:", dateString);
  return null;
};

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

// Modern Section Title component
const SectionTitle = ({ letter, title }) => (
  <div className="section-title-container">
    <div className="section-letter">{letter}.</div>
    <div className="section-text">{title}</div>
  </div>
);

// Custom form label component that only shows asterisk at the end
const RequiredLabel = ({ text }) => (
  <span>{text} <span style={{ color: 'red' }}>*</span></span>
);

const StudentInfo = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [form] = Form.useForm();
  const { STUDENT: STUDENT_FIELDS, STUDENT_INFO: STUDENT_INFO_FIELDS } = FIELD_MAPPINGS;
  
  // Add loaded state
  const [isLoaded, setIsLoaded] = useState(false);
  const [dateValues, setDateValues] = useState({ day: null, month: null, year: null });
  const [dateError, setDateError] = useState(null);
  
  // Optimize state management
  const [state, dispatch] = useReducer(reducer, initialState);
  const { formInitialized, isLoading, formValues, error } = state;

  // Access student context
  const { 
    student, 
    loading: studentLoading, 
    error: studentError, 
    updateStudent,
    loadStudentData
  } = useStudent();

  // Combine loading states
  const isDataLoading = studentLoading || isLoading;

  // Set loaded state after initialization
  useEffect(() => {
    if (formInitialized && student && !isDataLoading) {
      setTimeout(() => setIsLoaded(true), 100);
    }
  }, [formInitialized, student, isDataLoading]);

  // Optimize form initialization
  useEffect(() => {
    if (student && !formInitialized) {
      // Khởi tạo trạng thái form values
      const values = {
        hoTenHocVien: student.tenHocVien || '',
        // Chuyển đổi giá trị giới tính
        gioiTinh: mapGender(student.gioiTinh),
        ngaySinh: student.ngaySinh || '',
        sdtHocVien: formatPhoneNumber(student.soDienThoaiHocVien || ''),
        emailHocVien: student.emailHocVien || '',
        tinhThanh: student.tinhThanh || '',
        hoTenDaiDien: student.tenNguoiDaiDien || '',
        moiQuanHe: student.moiQuanHe || '',
        sdtDaiDien: formatPhoneNumber(student.sdtNguoiDaiDien || ''),
        emailDaiDien: student.mailNguoiDaiDien || ''
      };
      
      // Đặt timeout nhỏ để đảm bảo form đã mount
      setTimeout(() => {
        try {
          // Reset form trước khi set giá trị mới
          form.resetFields();
          
          // Initialize form with student data
          form.setFieldsValue(values);
          
          dispatch({ type: 'SET_FORM_VALUES', payload: values });
          dispatch({ type: 'INIT_FORM' });
        } catch (error) {
          console.error('[DEBUG] Error setting form values:', error);
        }
      }, 50);
    }
  }, [student, form, formInitialized]);  

  // Handle loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: studentLoading });
  }, [studentLoading]);

  // Handle error state
  useEffect(() => {
    if (studentError) {
      dispatch({ type: 'SET_ERROR', payload: studentError });
    }
  }, [studentError]);

  // State
  const [readOnly, setReadOnly] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingFields, setEditingFields] = useState([]);
  const [savingFields, setSavingFields] = useState([]);
  const [confirmStudentInfo, setConfirmStudentInfo] = useState(true);
  const [confirmGuardianInfo, setConfirmGuardianInfo] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  
  // Access student context
  const { 
    student: contextStudent, 
    loading: contextLoading, 
    error: contextError, 
    updateStudent: contextUpdateStudent,
    loadStudentData: contextLoadStudentData
  } = useStudent();

  // Kết hợp loadings
  const loading = contextLoading || localLoading;

  // Debug logs
  const renderDebug = () => {
    if (process.env.NODE_ENV === 'development' && false) { // Disable debug logging
      console.log('[DEBUG] Rendering StudentInfo with:', {
        studentDataExists: !!student,
        studentData: student ? {
          id: student.Id,
          name: student.tenHocVien,
          phone: student.soDienThoaiHocVien
        } : null,
        formInitialized,
        loadingState: isDataLoading,
        studentLoading,
        formValues,
        renderTime: new Date().toISOString()
      });
    }
  };

  // Call debug at the start of render
  renderDebug();

  // Cải tiến: Khởi tạo form values khi student data thay đổi
  useEffect(() => {
    if (contextStudent && !formInitialized) {
      // Disable console logging to reduce render issues
      /*
      console.log('[DEBUG] Initializing form with student data:', {
        studentId: contextStudent.Id,
        name: contextStudent[STUDENT_FIELDS.NAME],
        phone: contextStudent[STUDENT_FIELDS.PHONE],
        time: new Date().toISOString()
      });
      */
      
      // Khởi tạo trạng thái form values trước
      const values = {
        hoTenHocVien: contextStudent[STUDENT_FIELDS.NAME] || '',
        gioiTinh: contextStudent[STUDENT_FIELDS.GENDER] || '',
        ngaySinh: contextStudent[STUDENT_FIELDS.DOB] || '',
        sdtHocVien: formatPhoneNumber(contextStudent[STUDENT_FIELDS.PHONE] || ''),
        emailHocVien: contextStudent[STUDENT_FIELDS.EMAIL] || '',
        tinhThanh: contextStudent[STUDENT_FIELDS.LOCATION] || '',
        hoTenDaiDien: contextStudent[STUDENT_FIELDS.GUARDIAN_NAME] || '',
        moiQuanHe: contextStudent[STUDENT_FIELDS.GUARDIAN_RELATION] || '',
        sdtDaiDien: formatPhoneNumber(contextStudent[STUDENT_FIELDS.GUARDIAN_PHONE] || ''),
        emailDaiDien: contextStudent[STUDENT_FIELDS.GUARDIAN_EMAIL] || ''
      };
      
      // Kiểm tra trước khi set
      // console.log('[DEBUG] Form values before initialization:', form.getFieldsValue());
      
      // Đặt timeout nhỏ để đảm bảo form đã mount
      setTimeout(() => {
        try {
          // Reset form trước khi set giá trị mới
          form.resetFields();
          
          // Initialize form with student data
          form.setFieldsValue(values);
          
          // Kiểm tra sau khi set
          // console.log('[DEBUG] Form values after initialization:', form.getFieldsValue());
          
          dispatch({ type: 'SET_FORM_VALUES', payload: values });
          dispatch({ type: 'INIT_FORM' });
        } catch (error) {
          console.error('[DEBUG] Error setting form values:', error);
        }
      }, 50);
    }
  }, [contextStudent, form, formInitialized]);

  // Verify form values sau khi form initialized 
  useEffect(() => {
    if (formInitialized && contextStudent) {
      // Kiểm tra sau 50ms để đảm bảo form đã cập nhật UI
      const timer = setTimeout(() => {
        const currentValues = form.getFieldsValue();
        
        // Kiểm tra nếu giá trị form không khớp với student data
        if (currentValues.hoTenHocVien !== contextStudent[STUDENT_FIELDS.NAME] || 
            currentValues.sdtHocVien !== contextStudent[STUDENT_FIELDS.PHONE]) {
          console.warn('[DEBUG] Form values mismatch with student data, reinitializing...');
          
          // Reinitialize form nếu giá trị không khớp
          const values = {
            hoTenHocVien: contextStudent[STUDENT_FIELDS.NAME] || '',
            // Chuyển đổi giá trị giới tính
            gioiTinh: mapGender(contextStudent[STUDENT_FIELDS.GENDER]),
            ngaySinh: contextStudent[STUDENT_FIELDS.DOB] || '',
            sdtHocVien: formatPhoneNumber(contextStudent[STUDENT_FIELDS.PHONE] || ''),
            emailHocVien: contextStudent[STUDENT_FIELDS.EMAIL] || '',
            tinhThanh: contextStudent[STUDENT_FIELDS.LOCATION] || '',
            hoTenDaiDien: contextStudent[STUDENT_FIELDS.GUARDIAN_NAME] || '',
            moiQuanHe: contextStudent[STUDENT_FIELDS.GUARDIAN_RELATION] || '',
            sdtDaiDien: formatPhoneNumber(contextStudent[STUDENT_FIELDS.GUARDIAN_PHONE] || ''),
            emailDaiDien: contextStudent[STUDENT_FIELDS.GUARDIAN_EMAIL] || ''
          };
          
          dispatch({ type: 'SET_FORM_VALUES', payload: values });
          form.setFieldsValue(values);
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [formInitialized, contextStudent, form]);

  // Hàm trợ giúp hiển thị giá trị từ state thay vì form
  const displayFieldValue = (field) => {
    return formValues[field] || (contextStudent ? contextStudent[mapFieldToStudentData(field)] : '');
  };

  // Cập nhật formValues khi form thay đổi
  const handleValuesChange = (changedValues, allValues) => {
    // Cập nhật formValues
    const updatedValues = { ...formValues, ...changedValues };
    
    // Xử lý logic ẩn/hiện trường số điện thoại mới dựa trên xác nhận
    if ('confirmStudentInfo' in changedValues) {
      const confirmValue = changedValues.confirmStudentInfo;
      
      // Nếu chọn "Có", xóa giá trị số điện thoại mới (nếu có)
      if (confirmValue === 'yes') {
        form.setFieldsValue({ sdtHocVienMoi: undefined });
        updatedValues.sdtHocVienMoi = undefined;
      }
    }
    
    // Xử lý tương tự cho confirmGuardianInfo
    if ('confirmGuardianInfo' in changedValues) {
      const confirmValue = changedValues.confirmGuardianInfo;
      
      if (confirmValue === 'yes') {
        form.setFieldsValue({ newGuardianPhone: undefined });
        updatedValues.newGuardianPhone = undefined;
      }
    }
    
    // Cập nhật state
    dispatch({ type: 'SET_FORM_VALUES', payload: updatedValues });
  };

  // Cải tiến: Thêm function để reload data
  const reloadStudentData = async () => {
    setLocalLoading(true);
    dispatch({ type: 'SET_FORM_INITIALIZED', payload: false });
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const billItemId = urlParams.get('id');
      
      if (billItemId) {
        // Disable console logging to reduce render issues
        // console.log('[DEBUG] Reloading student data for ID:', billItemId);
        await contextLoadStudentData(billItemId);
        message.success('Đã tải lại thông tin học viên');
      } else {
        throw new Error('Không tìm thấy ID học viên');
      }
    } catch (err) {
      console.error('[DEBUG] Error reloading data:', err);
      message.error('Không thể tải lại dữ liệu: ' + err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  // Inline editing handlers - chỉ cập nhật formValues, không gửi API
  const handleEditField = (field) => {
    setEditingFields(prev => [...prev, field]);
    setSubmitError(null);
    
    // Get current value from formValues or student data
    const currentValue = formValues[field] || 
      (student ? student[mapFieldToStudentData(field)] : '');
    
    console.log(`Editing field ${field} with current value:`, currentValue);
    
    // Special handling for phone fields
    if (field === 'sdtHocVien' || field === 'sdtDaiDien' || field === 'sdtHocVienMoi') {
      form.setFieldsValue({ [field]: formatPhoneNumber(currentValue) });
    }
    
    // Special handling for tinhThanh field
    if (field === 'tinhThanh') {
      form.setFieldsValue({ [field]: currentValue });
    }
    
    // Xử lý đặc biệt cho ngày sinh
    if (field === 'ngaySinh') {
      // Parse ngày tháng từ chuỗi định dạng DD/MM/YYYY
      if (currentValue && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(currentValue)) {
        const [day, month, year] = currentValue.split('/').map(Number);
        setDateValues({ day, month, year });
      } else {
        // Reset date values nếu không đúng định dạng
        setDateValues({ day: null, month: null, year: null });
      }
    }
  };

  const cancelEditField = (field) => {
    setEditingFields(prev => prev.filter(f => f !== field));
    
    // Reset field value to original
    if (student) {
      const originalValue = student[mapFieldToStudentData(field)] || '';
      
      // Cập nhật cả form và local state
      form.setFieldsValue({
        [field]: originalValue
      });
      
      dispatch({ type: 'SET_FORM_VALUES', payload: { ...formValues, [field]: originalValue } });
      
      // Disable console logging to reduce render issues
      /*
      console.log('[DEBUG] Cancelled editing field:', {
        field,
        resetToValue: originalValue
      });
      */
    }
  };

  // Hàm xử lý khi thay đổi giá trị ngày tháng năm
  const handleDateChange = (type, value) => {
    setDateError(null);
    
    // Cập nhật giá trị ngày tháng năm
    const newDateValues = { ...dateValues, [type]: value };
    setDateValues(newDateValues);
    
    // Kiểm tra nếu đã chọn đủ ngày tháng năm
    if (newDateValues.day && newDateValues.month && newDateValues.year) {
      try {
        // Kiểm tra tính hợp lệ của ngày
        const date = new Date(newDateValues.year, newDateValues.month - 1, newDateValues.day);
        if (
          date.getFullYear() === newDateValues.year &&
          date.getMonth() === newDateValues.month - 1 &&
          date.getDate() === newDateValues.day
        ) {
          // Định dạng ngày tháng thành chuỗi DD/MM/YYYY
          const formattedDate = `${newDateValues.day.toString().padStart(2, '0')}/${newDateValues.month.toString().padStart(2, '0')}/${newDateValues.year}`;
          
          // Cập nhật vào form
          form.setFieldsValue({ ngaySinh: formattedDate });
        } else {
          // Ngày không hợp lệ
          setDateError('Ngày không hợp lệ');
        }
      } catch (error) {
        setDateError('Ngày không hợp lệ');
      }
    }
  };

  // Thêm handler onBlur chung cho container date select
  const handleDateSelectBlur = (e) => {
    // Chỉ lưu khi click ra ngoài container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      saveField('ngaySinh');
    }
  };

  // Lưu field vào state local, không gửi API
  const saveField = async (field) => {
    try {
      // Validate field
      await form.validateFields([field]);
      
      // Get updated value
      let value = form.getFieldValue(field);
      
      // Special handling for phone fields
      if (field === 'sdtHocVien' || field === 'sdtDaiDien' || field === 'sdtHocVienMoi' || field === 'newGuardianPhone') {
        value = formatPhoneNumber(value);
        // Update form field with formatted value
        form.setFieldsValue({ [field]: value });
      }

      // Xử lý đặc biệt cho ngày sinh
      if (field === 'ngaySinh') {
        // Kiểm tra nếu đã có giá trị ngày hợp lệ
        if (!value || dateError) {
          // Nếu không có giá trị hợp lệ, có thể sử dụng giá trị cũ hoặc để trống
          value = formValues[field] || '';
        }
      }
      
      // Special handling for date fields
      if (field === 'ngaySinh' && value) {
        // Đảm bảo ngày được định dạng nhất quán
        if (value._isAMomentObject) {
          // Nếu là moment object từ DatePicker
          value = value.format('DD/MM/YYYY');
        }
        form.setFieldsValue({ [field]: value });
      }
      
      // Đảm bảo thoát khỏi chế độ edit
      setEditingFields(prev => prev.filter(f => f !== field));
      
      // Cập nhật formValues
      dispatch({ type: 'SET_FORM_VALUES', payload: { ...formValues, [field]: value } });
      
      // Có thể tùy chọn thông báo hoặc không
      if (value !== formValues[field]) {
        message.success(`Đã cập nhật ${getFieldLabel(field)} (chưa lưu)`, 0.5);
      }
    } catch (error) {
      console.error('Error validating field:', error);
      
      // Vẫn thoát khỏi chế độ edit ngay cả khi có lỗi
      setEditingFields(prev => prev.filter(f => f !== field));
      
      message.error(`Lỗi cập nhật: ${error.message}`);
    }
  };

  // Handle key events for inline editing
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      saveField(field);
    } else if (e.key === 'Escape') {
      cancelEditField(field);
    }
  };

  // Check if field is being edited
  const isFieldEditing = (field) => {
    return editingFields.includes(field);
  };

  // Check if field is being saved
  const isFieldSaving = (field) => {
    return savingFields.includes(field);
  };

  // Map form field to student data field
  const mapFieldToStudentData = (field) => {
    const mapping = {
      'hoTenHocVien': STUDENT_FIELDS.NAME,
      'gioiTinh': STUDENT_FIELDS.GENDER,
      'ngaySinh': STUDENT_FIELDS.DOB,
      'sdtHocVien': STUDENT_FIELDS.PHONE,
      'emailHocVien': STUDENT_FIELDS.EMAIL,
      'tinhThanh': STUDENT_FIELDS.LOCATION,
      'hoTenDaiDien': STUDENT_FIELDS.GUARDIAN_NAME,
      'moiQuanHe': STUDENT_FIELDS.GUARDIAN_RELATION,
      'sdtDaiDien': STUDENT_FIELDS.GUARDIAN_PHONE,
      'emailDaiDien': STUDENT_FIELDS.GUARDIAN_EMAIL
    };
    return mapping[field];
  };

  // Get human-readable field label
  const getFieldLabel = (field) => {
    const mapping = {
      'hoTenHocVien': 'Họ tên học viên',
      'gioiTinh': 'Giới tính',
      'ngaySinh': 'Ngày sinh',
      'sdtHocVien': 'Số điện thoại học viên',
      'emailHocVien': 'Email học viên',
      'tinhThanh': 'Tỉnh/Thành',
      'hoTenDaiDien': 'Họ tên người đại diện',
      'moiQuanHe': 'Mối quan hệ',
      'sdtDaiDien': 'Số điện thoại người đại diện',
      'emailDaiDien': 'Email người đại diện'
    };
    return mapping[field];
  };

  // Proceed to next step with batch save
  // Cập nhật hàm proceedToStepTwo
  const proceedToStepTwo = async () => {
    try {
      // Bắt đầu loading state
      setLocalLoading(true);
      
      // Validate toàn bộ form
      await form.validateFields();
      
      // Lấy ID học viên và billItemId
      const studentId = student?.Id;
      const billItemId = student?.[STUDENT_FIELDS.BILL_ITEM_ID];
      
      if (!studentId) {
        throw new Error('Không tìm thấy ID học viên');
      }
      
      if (!billItemId) {
        throw new Error('Không tìm thấy mã đơn hàng');
      }
      
      // Chuẩn bị dữ liệu cập nhật cho bảng Student
      const studentUpdateData = {
        Id: studentId,
        [STUDENT_FIELDS.BILL_ITEM_ID]: billItemId, // Thêm trường BILL_ITEM_ID
        [STUDENT_FIELDS.NAME]: formValues.hoTenHocVien,
        [STUDENT_FIELDS.GENDER]: formValues.gioiTinh,
        [STUDENT_FIELDS.DOB]: formValues.ngaySinh,
        [STUDENT_FIELDS.PHONE]: formValues.sdtHocVien,
        [STUDENT_FIELDS.EMAIL]: formValues.emailHocVien,
        [STUDENT_FIELDS.LOCATION]: formValues.tinhThanh,
        [STUDENT_FIELDS.GUARDIAN_NAME]: formValues.hoTenDaiDien,
        [STUDENT_FIELDS.GUARDIAN_RELATION]: formValues.moiQuanHe,
        [STUDENT_FIELDS.GUARDIAN_PHONE]: formValues.sdtDaiDien,
        [STUDENT_FIELDS.GUARDIAN_EMAIL]: formValues.emailDaiDien
      };
      
      // Nếu người dùng chọn số điện thoại khác
      if (confirmStudentInfo === 'no' && formValues.sdtHocVienMoi) {
        studentUpdateData[STUDENT_FIELDS.ZALO_PHONE] = formValues.sdtHocVienMoi;
      }
      
      // Nếu người đại diện sử dụng số điện thoại Zalo khác
      if (confirmGuardianInfo === 'no' && formValues.newGuardianPhone) {
        studentUpdateData.soDienThoaiDangKyZalo = formValues.newGuardianPhone;
      }
      
      console.log('Cập nhật dữ liệu Student:', studentUpdateData);
      
      // Gọi API cập nhật thông tin học viên
      const updatedStudent = await updateStudent(studentUpdateData);
      
      if (!updatedStudent) {
        throw new Error('Không thể cập nhật thông tin học viên');
      }
      
      // Nếu cần, cập nhật bảng Student Info
      const maTheoDoiHV = student[STUDENT_FIELDS.MA_THEO_DOI];
      if (maTheoDoiHV) {
        try {
          // Kiểm tra xem đã có record trong bảng Student Info chưa
          const checkResponse = await apiClient.get(`/db/data/v1/${TABLE_IDS.STUDENT_INFO}`, {
            params: {
              where: `(${FIELD_MAPPINGS.STUDENT_INFO.STUDENT_ID},eq,${maTheoDoiHV})`
            }
          });
          
          const existingRecords = checkResponse.data?.list || [];
          
          if (existingRecords.length > 0) {
            // Cập nhật record hiện có
            const recordId = existingRecords[0].Id;
            console.log(`Cập nhật thông tin Student Info với ID: ${recordId}`);
            
            await apiClient.patch(`/db/data/v1/${TABLE_IDS.STUDENT_INFO}/${recordId}`, {
              // Các trường cần cập nhật trong Student Info
              // Ví dụ: Thông tin bổ sung nếu có
            });
          } else {
            // Tạo record mới
            console.log(`Tạo mới thông tin Student Info cho học viên: ${maTheoDoiHV}`);
            
            await apiClient.post(`/db/data/v1/${TABLE_IDS.STUDENT_INFO}`, {
              [FIELD_MAPPINGS.STUDENT_INFO.STUDENT_ID]: maTheoDoiHV,
              // Các trường khác cần thiết
            });
          }
        } catch (infoError) {
          console.error('Lỗi khi cập nhật Student Info:', infoError);
          // Không throw lỗi để tiếp tục quy trình ngay cả khi Student Info gặp vấn đề
        }
      }
      
      // Cập nhật thành công, thông báo
      message.success('Đã cập nhật thông tin thành công');
      
      // Chuyển sang Bước 2
      navigate(ROUTES.CLASS_SELECTION);
    } catch (error) {
      console.error('Error saving form data:', error);
      
      // Hiển thị lỗi từ API response hoặc validation
      let errorMessage = error.message;
      
      // Kiểm tra lỗi từ form validation
      if (error.errorFields && error.errorFields.length > 0) {
        // Lấy danh sách lỗi
        const fieldErrors = error.errorFields.map(field => {
          const fieldName = getFieldLabel(field.name[0]) || field.name[0];
          return `${fieldName}: ${field.errors.join(', ')}`;
        });
        
        errorMessage = `Vui lòng kiểm tra lại các trường sau:\n${fieldErrors.join('\n')}`;
        
        // Highlight các trường lỗi bằng cách tự động mở chế độ edit
        error.errorFields.forEach(field => {
          const fieldName = field.name[0];
          if (!isFieldEditing(fieldName)) {
            handleEditField(fieldName);
          }
        });
      }
      
      // Hiển thị lỗi
      message.error(`Lỗi lưu dữ liệu: ${errorMessage}`);
      setSubmitError(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  // Kiểm tra xem form đã sẵn sàng chưa
  const isFormDataConsistent = () => {
    if (!contextStudent || !formInitialized) return false;
    
    // Kiểm tra từ local state thay vì form
    return formValues.hoTenHocVien === contextStudent[STUDENT_FIELDS.NAME] && 
           formValues.sdtHocVien === contextStudent[STUDENT_FIELDS.PHONE];
  };

  // Optimize render conditions
  if (isDataLoading) {
    return <StudentInfoSkeleton />;
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Lỗi"
        subTitle={error}
        extra={[
          <Button type="primary" key="retry" onClick={reloadStudentData}>
            Thử lại
          </Button>
        ]}
      />
    );
  }

  if (!student) {
    return (
      <Result
        status="warning"
        title="Không tìm thấy thông tin học viên"
        subTitle="Vui lòng kiểm tra lại đường dẫn hoặc liên hệ hỗ trợ"
        extra={[
          <Button type="primary" key="retry" onClick={reloadStudentData}>
            Thử lại
          </Button>
        ]}
      />
    );
  }

  return (
    <div className={`student-info-container ${isLoaded ? 'loaded' : ''}`}>
      {readOnly && (
        <Alert
          message="Chế độ chỉ đọc"
          description="API token hiện tại chỉ có quyền đọc dữ liệu, không thể cập nhật thông tin. Bạn vẫn có thể tiếp tục đến bước tiếp theo."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      {submitError && (
        <Alert
          message="Lỗi xác nhận thông tin"
          description={submitError}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
          action={
            <Button size="small" danger onClick={() => setSubmitError(null)}>
              Đóng
            </Button>
          }
        />
      )}

      {error && error !== submitError && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        size="middle"
        requiredMark={false}
        className="student-info-form"
        onValuesChange={handleValuesChange}
      >
        {/* Course Information */}
        <Card className="info-card">
          <SectionTitle letter="A" title={SECTION_TITLES.COURSE_INFO} />
          <div className="course-info-grid">
            <div className="course-info-item">
              <div className="course-info-label">Khóa học đã đăng ký:</div>
              <div className="course-info-value">{student.sanPham || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Trình độ bắt đầu:</div>
              <div className="course-info-value">{student.trinhDo || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Loại lớp:</div>
              <div className="course-info-value">{student.loaiLop || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Giáo viên:</div>
              <div className="course-info-value">{student.loaiGV || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Số buổi:</div>
              <div className="course-info-value">{student.soBuoi || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Học phí:</div>
              <div className="course-info-value">
                {student.tongTien ? 
                  `${parseInt(student.tongTien).toLocaleString('vi-VN')} VNĐ` : '-'}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Student Information */}
        <Card className="info-card">
          <SectionTitle letter="B" title={SECTION_TITLES.STUDENT_INFO} />
          
          <Row gutter={[16, 16]} className="form-row">
            <Col xs={24} sm={12}>
              <Form.Item
                name="hoTenHocVien"
                label={<RequiredLabel text="Họ và tên học viên" />}
                rules={[{ required: true, message: 'Vui lòng nhập họ tên học viên' }]}
                className="form-item editable-field"
                data-field="hoTenHocVien"
              >
                {isFieldEditing('hoTenHocVien') ? (
                  <div className="edit-field-container">
                    <Input 
                      autoFocus
                      defaultValue={formValues.hoTenHocVien || ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveField('hoTenHocVien');
                        } else if (e.key === 'Escape') {
                          cancelEditField('hoTenHocVien');
                        }
                      }}
                      onBlur={() => saveField('hoTenHocVien')}
                      disabled={readOnly}
                    />
                  </div>
                ) : (
                  <div 
                    className="display-value" 
                    onClick={() => !readOnly && handleEditField('hoTenHocVien')}
                  >
                    {formValues.hoTenHocVien || '-'}
                    {!readOnly && <span className="edit-icon">✏️</span>}
                  </div>
                )}
              </Form.Item>
            </Col>
 
            <Col xs={24} sm={12}>
              <Form.Item
                name="gioiTinh"
                label={<RequiredLabel text="Giới tính" />}
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                className="form-item editable-field"
                data-field="gioiTinh"
              >
                {isFieldEditing('gioiTinh') ? (
                  <div className="edit-field-container">
                    <Select
                      style={{ width: '100%' }}
                      autoFocus
                      defaultValue={formValues.gioiTinh || ''}
                      options={[
                        { value: 'Nam', label: 'Nam' },
                        { value: 'Nữ', label: 'Nữ' },
                      ]}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          cancelEditField('gioiTinh');
                        }
                      }}
                      onChange={(value) => {
                        form.setFieldsValue({ gioiTinh: value });
                        // Tự động lưu khi có sự thay đổi
                        saveField('gioiTinh');
                      }}
                      onBlur={() => saveField('gioiTinh')}
                      disabled={readOnly}
                      open={true} // Tự động mở dropdown
                    />
                  </div>
                ) : (
                  <div 
                    className="display-value" 
                    onClick={() => !readOnly && handleEditField('gioiTinh')}
                  >
                    {formValues.gioiTinh || '-'}
                    {!readOnly && <span className="edit-icon">✏️</span>}
                  </div>
                )}
              </Form.Item>
            </Col>
 
            <Col xs={24} sm={12}>
            <Form.Item
              name="ngaySinh"
              label={<RequiredLabel text="Ngày sinh" />}
              rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
              className="form-item editable-field"
              data-field="ngaySinh"
            >
              {isFieldEditing('ngaySinh') ? (
                <div 
                  className="edit-field-container date-select-container"
                  onBlur={handleDateSelectBlur} // Thêm onBlur ở đây
                >
                  <div className="date-select-group">
                    {/* Select cho ngày */}
                    <Select
                      autoFocus
                      style={{ width: '32%' }}
                      placeholder="Ngày"
                      onChange={(value) => handleDateChange('day', value)}
                      value={dateValues.day}
                      popupMatchSelectWidth={false}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <Select.Option key={`day-${day}`} value={day}>
                          {day}
                        </Select.Option>
                      ))}
                    </Select>
                    
                    {/* Select cho tháng */}
                    <Select
                      style={{ width: '36%' }}
                      placeholder="Tháng"
                      onChange={(value) => handleDateChange('month', value)}
                      value={dateValues.month}
                      popupMatchSelectWidth={false}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <Select.Option key={`month-${month}`} value={month}>
                          {month}
                        </Select.Option>
                      ))}
                    </Select>
                    
                    {/* Select cho năm */}
                    <Select
                      style={{ width: '32%' }}
                      placeholder="Năm"
                      onChange={(value) => handleDateChange('year', value)}
                      value={dateValues.year}
                      popupMatchSelectWidth={false}
                    >
                      {getValidYears().map(year => (
                        <Select.Option key={`year-${year}`} value={year}>
                          {year}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                  
                  {dateError && <div className="date-error">{dateError}</div>}
                </div>
              ) : (
                <div 
                  className="display-value" 
                  onClick={() => !readOnly && handleEditField('ngaySinh')}
                >
                  {formValues.ngaySinh || '-'}
                  {!readOnly && <span className="edit-icon">✏️</span>}
                </div>
              )}
            </Form.Item>
            </Col>
 
            <Col xs={24} sm={12}>
              <Form.Item
                name="sdtHocVien"
                label={<RequiredLabel text="Số điện thoại học viên" />}
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại học viên' },
                  { 
                    validator: (_, value) => {
                      // For debugging
                      console.log('Validating phone value:', value, typeof value);
                      
                      // Parse value
                      const { countryCode, phoneNumber } = (() => {
                        if (!value) return { countryCode: '+84', phoneNumber: '' };
                        
                        if (value.startsWith('+')) {
                          const codeObj = COUNTRY_CODES.find(c => value.startsWith(c.code));
                          if (codeObj) {
                            return {
                              countryCode: codeObj.code,
                              phoneNumber: value.substring(codeObj.code.length).trim()
                            };
                          }
                        }
                        
                        if (value.startsWith('84-')) {
                          return {
                            countryCode: '+84',
                            phoneNumber: value.substring(3)
                          };
                        }
                        
                        return {
                          countryCode: '+84',
                          phoneNumber: value
                        };
                      })();
                      
                      // Log parsed values for debugging
                      console.log('Parsed for validation:', { countryCode, phoneNumber });
                      
                      // Validate phone number based on country code
                      if (countryCode === '+84') {
                        // Vietnam phone numbers: 10-11 digits
                        if (!phoneNumber) {
                          return Promise.resolve(); // Empty is allowed - required rule handles this
                        }
                        if (!/^[0-9]{9,11}$/.test(phoneNumber)) {
                          return Promise.reject('Số điện thoại Việt Nam cần 9-11 chữ số');
                        }
                      } else {
                        // Other countries: generic validation
                        if (!phoneNumber) {
                          return Promise.resolve(); // Empty is allowed - required rule handles this
                        }
                        if (!/^[0-9]{5,15}$/.test(phoneNumber)) {
                          return Promise.reject('Số điện thoại không hợp lệ');
                        }
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
                className="form-item editable-field"
                data-field="sdtHocVien"
              >
                {isFieldEditing('sdtHocVien') ? (
                  <div className="edit-field-container">
                    <PhoneInput
                      autoFocus
                      value={form.getFieldValue('sdtHocVien') || ''}
                      onChange={(value) => {
                        form.setFieldsValue({ sdtHocVien: value });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveField('sdtHocVien');
                        } else if (e.key === 'Escape') {
                          cancelEditField('sdtHocVien');
                        }
                      }}
                      // QUAN TRỌNG: Đảm bảo onBlur gọi saveField
                      onBlur={() => {
                        console.log("PhoneInput onBlur triggered");
                        saveField('sdtHocVien');
                      }}
                      disabled={readOnly}
                      placeholder="Số điện thoại"
                    />
                  </div>
                ) : (
                  <div 
                    className="display-value" 
                    onClick={() => !readOnly && handleEditField('sdtHocVien')}
                  >
                    {formValues.sdtHocVien || '-'}
                    {!readOnly && <span className="edit-icon">✏️</span>}
                  </div>
                )}
              </Form.Item>
            </Col>
 
            <Col xs={24} sm={12}>
              <Form.Item
                name="emailHocVien"
                label={<RequiredLabel text="Email học viên" />}
                rules={[
                  { required: true, message: 'Vui lòng nhập email học viên' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
                className="form-item editable-field"
                data-field="emailHocVien"
              >
                {isFieldEditing('emailHocVien') ? (
                  <div className="edit-field-container">
                    <Input 
                      autoFocus
                      defaultValue={formValues.emailHocVien || ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveField('emailHocVien');
                        } else if (e.key === 'Escape') {
                          cancelEditField('emailHocVien');
                        }
                      }}
                      onBlur={() => saveField('emailHocVien')}
                      disabled={readOnly}
                    />
                  </div>
                ) : (
                  <div 
                    className="display-value" 
                    onClick={() => !readOnly && handleEditField('emailHocVien')}
                  >
                    {formValues.emailHocVien || '-'}
                    {!readOnly && <span className="edit-icon">✏️</span>}
                  </div>
                )}
              </Form.Item>
            </Col>
 
            <Col xs={24} sm={12}>
              <Form.Item
                name="tinhThanh"
                label={<RequiredLabel text="Tỉnh/Thành" />}
                rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành' }]}
                className="form-item editable-field"
                data-field="tinhThanh"
              >
                {isFieldEditing('tinhThanh') ? (
                  <div className="edit-field-container">
                    <ProvinceSelector
                      autoFocus
                      placeholder="Chọn tỉnh/thành phố"
                      value={form.getFieldValue('tinhThanh')}
                      onChange={(value) => {
                        console.log("Province selected in StudentInfo:", value);
                        
                        // Cập nhật giá trị trong form
                        form.setFieldsValue({ tinhThanh: value });
                        
                        // Tự động lưu khi chọn
                        saveField('tinhThanh');
                      }}
                      onBlur={() => {
                        // Nếu không chọn gì, sẽ giữ nguyên giá trị cũ
                        saveField('tinhThanh');
                      }}
                      disabled={readOnly}
                      showRegionGroups={true}
                    />
                  </div>
                ) : (
                  <div 
                    className="display-value province-display" 
                    onClick={() => !readOnly && handleEditField('tinhThanh')}
                  >
                    {formValues.tinhThanh ? (
                      <span className="province-value">
                        <EnvironmentOutlined style={{ marginRight: '5px', color: '#00509f' }} />
                        {formValues.tinhThanh}
                      </span>
                    ) : '-'}
                    {!readOnly && <span className="edit-icon">✏️</span>}
                  </div>
                )}
              </Form.Item>
            </Col>
 
            <Col xs={24}>
              <div className="confirmation-section">
                <div className="confirmation-text required">
                  Xác nhận sử dụng Số điện thoại học viên để mở tài khoản học trực tuyến
                </div>
                <Form.Item
                  name="confirmStudentInfo"
                  className="confirmation-select-item"
                  rules={[{ required: true, message: 'Vui lòng chọn xác nhận' }]}
                >
                  <Select
                    onChange={(value) => {
                      setConfirmStudentInfo(value);
                      form.setFieldsValue({ confirmStudentInfo: value });
                      // Có thể tự động lưu nếu cần
                    }}
                    disabled={readOnly}
                    placeholder="Chọn xác nhận"
                  >
                    <Select.Option value="yes">Có</Select.Option>
                    <Select.Option value="no">Không</Select.Option>
                  </Select>
                </Form.Item>
 
                {confirmStudentInfo === 'no' && (
                  <div className="new-phone-container">
                    <Form.Item
                      name="sdtHocVienMoi"
                      rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại đăng ký mới' },
                        { 
                          validator: (_, value) => {
                            // Kiểm tra nếu có giá trị
                            if (!value) {
                              return Promise.reject('Số điện thoại mới là bắt buộc');
                            }
                            
                            // Parse value
                            const { countryCode, phoneNumber } = (() => {
                              if (!value) return { countryCode: '+84', phoneNumber: '' };
                              
                              if (value.startsWith('+')) {
                                const codeObj = COUNTRY_CODES.find(c => value.startsWith(c.code));
                                if (codeObj) {
                                  return {
                                    countryCode: codeObj.code,
                                    phoneNumber: value.substring(codeObj.code.length).trim()
                                  };
                                }
                              }
                              
                              return {
                                countryCode: '+84',
                                phoneNumber: value
                              };
                            })();
                            
                            // Validate số điện thoại
                            if (countryCode === '+84') {
                              if (!/^[0-9]{9,11}$/.test(phoneNumber)) {
                                return Promise.reject('Số điện thoại Việt Nam cần 9-11 chữ số');
                              }
                            } else {
                              if (!/^[0-9]{5,15}$/.test(phoneNumber)) {
                                return Promise.reject('Số điện thoại không hợp lệ');
                              }
                            }
                            
                            return Promise.resolve();
                          }
                        }
                      ]}
                      className="form-item editable-field"
                      dependencies={['confirmStudentInfo']} // Thêm dependencies
                    >
                      {isFieldEditing('sdtHocVienMoi') ? (
                        <div className="edit-field-container">
                          <PhoneInput
                            autoFocus
                            value={form.getFieldValue('sdtHocVienMoi') || ''}
                            onChange={(value) => form.setFieldsValue({ sdtHocVienMoi: value })}
                            onBlur={() => saveField('sdtHocVienMoi')}
                            disabled={readOnly}
                            placeholder="Nhập số điện thoại khác"
                          />
                        </div>
                      ) : (
                        <div 
                          className="display-value" 
                          onClick={() => !readOnly && handleEditField('sdtHocVienMoi')}
                        >
                          {formValues.sdtHocVienMoi || 'Nhập số điện thoại khác'}
                          {!readOnly && <span className="edit-icon">✏️</span>}
                        </div>
                      )}
                    </Form.Item>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Guardian Information */}
        <Card className="info-card">
          <SectionTitle letter="C" title={SECTION_TITLES.GUARDIAN_INFO} />
          
          <Row gutter={[16, 16]} className="form-row">
            <Col xs={24} sm={12}>
              <Form.Item
                name="hoTenDaiDien"
                label={<RequiredLabel text="Họ và tên người đại diện" />}
                rules={[{ required: true, message: 'Vui lòng nhập họ tên người đại diện' }]}
                className="form-item editable-field"
                data-field="hoTenDaiDien"
              >
                {isFieldEditing('hoTenDaiDien') ? (
                  <div className="edit-field-container">
                    <Input 
                      autoFocus
                      defaultValue={formValues.hoTenDaiDien || ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveField('hoTenDaiDien');
                        } else if (e.key === 'Escape') {
                          cancelEditField('hoTenDaiDien');
                        }
                      }}
                      onBlur={() => saveField('hoTenDaiDien')}
                      disabled={readOnly}
                    />
                  </div>
                ) : (
                  <div 
                    className="display-value" 
                    onClick={() => !readOnly && handleEditField('hoTenDaiDien')}
                  >
                    {formValues.hoTenDaiDien || '-'}
                    {!readOnly && <span className="edit-icon">✏️</span>}
                  </div>
                )}
              </Form.Item>
            </Col>
 
            <Col xs={24} sm={12}>
            <Form.Item
              name="moiQuanHe"
              label={<RequiredLabel text="Mối quan hệ với học viên" />}
              rules={[{ required: true, message: 'Vui lòng chọn mối quan hệ' }]}
              className="form-item editable-field"
              data-field="moiQuanHe"
            >
              {isFieldEditing('moiQuanHe') ? (
                <div className="edit-field-container">
                  <Select
                    style={{ width: '100%' }}
                    autoFocus
                    defaultValue={formValues.moiQuanHe || ''}
                    options={GUARDIAN_RELATIONS.map(relation => ({
                      value: relation.name,
                      label: relation.name
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        cancelEditField('moiQuanHe');
                      }
                    }}
                    onChange={(value) => {
                      form.setFieldsValue({ moiQuanHe: value });
                      // Tự động lưu khi có sự thay đổi
                      saveField('moiQuanHe');
                    }}
                    onBlur={() => saveField('moiQuanHe')}
                    disabled={readOnly}
                    open={true} // Tự động mở dropdown
                  />
                </div>
              ) : (
                <div 
                  className="display-value" 
                  onClick={() => !readOnly && handleEditField('moiQuanHe')}
                >
                  {formValues.moiQuanHe || '-'}
                  {!readOnly && <span className="edit-icon">✏️</span>}
                </div>
              )}
            </Form.Item>
          </Col>
 
          <Col xs={24} sm={12}>
            <Form.Item
              name="emailDaiDien"
              label={<RequiredLabel text="Email người đại diện" />}
              rules={[
                { required: true, message: 'Vui lòng nhập email người đại diện' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
              className="form-item editable-field"
              data-field="emailDaiDien"
            >
              {isFieldEditing('emailDaiDien') ? (
                <div className="edit-field-container">
                  <Input 
                    autoFocus
                    defaultValue={formValues.emailDaiDien || ''}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveField('emailDaiDien');
                      } else if (e.key === 'Escape') {
                        cancelEditField('emailDaiDien');
                      }
                    }}
                    onBlur={() => saveField('emailDaiDien')}
                    disabled={readOnly}
                  />
                </div>
              ) : (
                <div 
                  className="display-value" 
                  onClick={() => !readOnly && handleEditField('emailDaiDien')}
                >
                  {formValues.emailDaiDien || '-'}
                  {!readOnly && <span className="edit-icon">✏️</span>}
                </div>
              )}
            </Form.Item>
          </Col>
 
          <Col xs={24} sm={12}>
            <Form.Item
              name="sdtDaiDien"
              label={<RequiredLabel text="Số điện thoại người đại diện" />}
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại người đại diện' },
                { 
                  validator: (_, value) => {
                    // Allow empty values - required rule will handle this
                    if (!value) return Promise.resolve();
                    
                    // Parse value
                    const { countryCode, phoneNumber } = (() => {
                      if (!value) return { countryCode: '+84', phoneNumber: '' };
                      
                      if (value.startsWith('+')) {
                        const codeObj = COUNTRY_CODES.find(c => value.startsWith(c.code));
                        if (codeObj) {
                          return {
                            countryCode: codeObj.code,
                            phoneNumber: value.substring(codeObj.code.length).trim()
                          };
                        }
                      }
                      
                      if (value.startsWith('84-')) {
                        return {
                          countryCode: '+84',
                          phoneNumber: value.substring(3)
                        };
                      }
                      
                      return {
                        countryCode: '+84',
                        phoneNumber: value
                      };
                    })();
                    
                    // Validate phone number based on country code
                    if (countryCode === '+84') {
                      // Vietnam phone numbers: 10-11 digits
                      if (!phoneNumber) return Promise.resolve();
                      if (!/^[0-9]{9,11}$/.test(phoneNumber)) {
                        return Promise.reject('Số điện thoại Việt Nam cần 9-11 chữ số');
                      }
                    } else {
                      // Other countries: generic validation
                      if (!phoneNumber) return Promise.resolve();
                      if (!/^[0-9]{5,15}$/.test(phoneNumber)) {
                        return Promise.reject('Số điện thoại không hợp lệ');
                      }
                    }
                    
                    return Promise.resolve();
                  }
                }
              ]}
              className="form-item editable-field"
              data-field="sdtDaiDien"
            >
              {isFieldEditing('sdtDaiDien') ? (
                <div className="edit-field-container">
                  <PhoneInput
                    autoFocus
                    value={form.getFieldValue('sdtDaiDien') || ''}
                    onChange={(value) => {
                      form.setFieldsValue({ sdtDaiDien: value });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveField('sdtDaiDien');
                      } else if (e.key === 'Escape') {
                        cancelEditField('sdtDaiDien');
                      }
                    }}
                    onBlur={() => saveField('sdtDaiDien')}
                    disabled={readOnly}
                  />
                </div>
              ) : (
                <div 
                  className="display-value" 
                  onClick={() => !readOnly && handleEditField('sdtDaiDien')}
                >
                  {formValues.sdtDaiDien || '-'}
                  {!readOnly && <span className="edit-icon">✏️</span>}
                </div>
              )}
            </Form.Item>
          </Col>
        </Row>
 
        <div className="confirmation-section">
          <div className="confirmation-text required">
            Xác nhận Số người đại diện có sử dụng Zalo
          </div>
          <Form.Item
            name="confirmGuardianInfo"
            className="confirmation-select-item"
            rules={[{ required: true, message: 'Vui lòng chọn xác nhận' }]}
          >
            <Select
              onChange={(value) => setConfirmGuardianInfo(value)}
              disabled={readOnly}
              placeholder="Chọn xác nhận"
            >
              <Select.Option value="yes">Có</Select.Option>
              <Select.Option value="no">Không, tôi sử dụng Zalo với số điện thoại khác</Select.Option>
            </Select>
          </Form.Item>

          {confirmGuardianInfo === 'no' && (
            <div className="new-phone-container">
              <Form.Item
                name="newGuardianPhone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại đăng ký Zalo' },
                  { 
                    validator: (_, value) => {
                      const { countryCode, phoneNumber } = (() => {
                        if (!value) return { countryCode: '+84', phoneNumber: '' };
                        
                        if (value.startsWith('+')) {
                          const codeObj = COUNTRY_CODES.find(c => value.startsWith(c.code));
                          if (codeObj) {
                            return {
                              countryCode: codeObj.code,
                              phoneNumber: value.substring(codeObj.code.length).trim()
                            };
                          }
                        }
                        
                        if (value.startsWith('84-')) {
                          return {
                            countryCode: '+84',
                            phoneNumber: value.substring(3)
                          };
                        }
                        
                        return {
                          countryCode: '+84',
                          phoneNumber: value
                        };
                      })();
                      
                      if (countryCode === '+84') {
                        if (!phoneNumber) return Promise.resolve();
                        if (!/^[0-9]{9,11}$/.test(phoneNumber)) {
                          return Promise.reject('Số điện thoại Việt Nam cần 9-11 chữ số');
                        }
                      } else {
                        if (!phoneNumber) return Promise.resolve();
                        if (!/^[0-9]{5,15}$/.test(phoneNumber)) {
                          return Promise.reject('Số điện thoại không hợp lệ');
                        }
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
                className="form-item editable-field"
                dependencies={['confirmGuardianInfo']}
                data-field="newGuardianPhone"
              >
                {isFieldEditing('newGuardianPhone') ? (
                  <div className="edit-field-container">
                    <PhoneInput
                      autoFocus
                      value={form.getFieldValue('newGuardianPhone') || ''}
                      onChange={(value) => {
                        form.setFieldsValue({ newGuardianPhone: value });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveField('newGuardianPhone');
                        } else if (e.key === 'Escape') {
                          cancelEditField('newGuardianPhone');
                        }
                      }}
                      onBlur={() => saveField('newGuardianPhone')}
                      disabled={readOnly}
                      placeholder="Nhập số điện thoại đăng ký Zalo"
                    />
                  </div>
                ) : (
                  <div 
                    className="display-value" 
                    onClick={() => !readOnly && handleEditField('newGuardianPhone')}
                  >
                    {formValues.newGuardianPhone || 'Nhập số điện thoại đăng ký Zalo'}
                    {!readOnly && <span className="edit-icon">✏️</span>}
                  </div>
                )}
              </Form.Item>
            </div>
          )}
        </div>

        <div className="guardian-note">
          <Alert
            message={
              <div className="guardian-note-content">
                <span className="guardian-note-icon">ℹ️</span>
                <span className="guardian-note-text">
                  Công ty sẽ trao đổi các thông tin, thông báo và kết quả học tập với Người đại diện của học viên
                </span>
              </div>
            }
            type="info"
            className="guardian-note-alert"
          />
        </div>
      </Card>

      <div className="form-actions">
        <Button 
          type="primary" 
          onClick={proceedToStepTwo}
        >
          Xác nhận thông tin đăng ký
        </Button>
      </div>
    </Form>
  </div>
 );
};

// Add reducer
const initialState = {
 formInitialized: false,
 isLoading: false,
 formValues: {},
 error: null
};

function reducer(state, action) {
 switch (action.type) {
   case 'INIT_FORM':
     return { ...state, formInitialized: true };
   case 'SET_LOADING':
     return { ...state, isLoading: action.payload };
   case 'SET_FORM_VALUES':
     return { ...state, formValues: action.payload };
   case 'SET_ERROR':
     return { ...state, error: action.payload };
   default:
     return state;
 }
}

export default StudentInfo;