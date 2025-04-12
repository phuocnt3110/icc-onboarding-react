import React, { useState, useEffect, useRef, useReducer, memo } from 'react';
import { Card, Form, Input, Button, Typography, Row, Col, Divider, message, Spin, Alert, Result, Radio, Select, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EditOutlined, CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { useStudent } from '../../contexts/StudentContext';
import { FIELD_MAPPINGS, MESSAGES, ROUTES, THEME, SECTION_TITLES, COUNTRY_CODES } from '../../config';
import StudentInfoSkeleton from './StudentInfoSkeleton';
import '../../styles/student-info.css';
import '../../styles/index.css';

const { Title, Text } = Typography;
const { Option } = Select;

// PhoneInput component for phone numbers
const PhoneInput = ({ value = "", onChange, autoFocus, disabled, placeholder, hint }) => {
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
  
  // For debuging purposes only
  const renderCountryNames = () => {
    return (
      <div style={{ display: 'none' }}>
        {COUNTRY_CODES.map(item => (
          <div key={item.code}>{item.code} - {item.country}</div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="phone-input-container">
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
        />
      </div>
      
      {hint && <div className="phone-input-hint">{hint}</div>}
      {renderCountryNames()}
    </div>
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
  
  // Add loaded state
  const [isLoaded, setIsLoaded] = useState(false);
  
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
      // Disable console logging to reduce render issues
      /*
      console.log('[DEBUG] Initializing form with student data:', {
        studentId: contextStudent.Id,
        name: contextStudent[STUDENT_FIELDS.NAME],
        phone: contextStudent[STUDENT_FIELDS.PHONE],
        time: new Date().toISOString()
      });
      */
      
      // For debugging - re-enable a specific log
      console.log('[DEBUG] Phone number from API:', student.soDienThoaiHocVien);
      
      // Khởi tạo trạng thái form values trước
      const values = {
        hoTenHocVien: student.tenHocVien || '',
        gioiTinh: student.gioiTinh || '',
        ngaySinh: student.ngaySinh || '',
        sdtHocVien: formatPhoneNumber(student.soDienThoaiHocVien || ''),
        emailHocVien: student.emailHocVien || '',
        tinhThanh: student.tinhThanh || '',
        hoTenDaiDien: student.tenNguoiDaiDien || '',
        moiQuanHe: student.moiQuanHe || '',
        sdtDaiDien: formatPhoneNumber(student.sdtNguoiDaiDien || ''),
        emailDaiDien: student.mailNguoiDaiDien || ''
      };
      
      // For debugging
      console.log('[DEBUG] Form value for phone:', values.sdtHocVien);
      
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
        // Disable console logging to reduce render issues
        // console.log('[DEBUG] Form values after initialization completed:', currentValues);
        
        // Kiểm tra nếu giá trị form không khớp với student data
        if (currentValues.hoTenHocVien !== contextStudent[STUDENT_FIELDS.NAME] || 
            currentValues.sdtHocVien !== contextStudent[STUDENT_FIELDS.PHONE]) {
          console.warn('[DEBUG] Form values mismatch with student data, reinitializing...');
          
          // Reinitialize form nếu giá trị không khớp
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
    // Only update if values actually changed to prevent unnecessary re-renders
    const hasChanged = Object.keys(changedValues).some(key => 
      formValues[key] !== changedValues[key]
    );
    
    if (hasChanged) {
      dispatch({ type: 'SET_FORM_VALUES', payload: { ...formValues, ...changedValues } });
    }
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
      
    // Special handling for phone fields
    if (field === 'sdtHocVien' || field === 'sdtDaiDien' || field === 'sdtHocVienMoi') {
      console.log(`Setting initial value for ${field}:`, currentValue);
      // Ensure form has the latest value for the phone field
      form.setFieldsValue({ [field]: formatPhoneNumber(currentValue) });
    }
    
    // Disable console logging to reduce render issues
    /*
    console.log('[DEBUG] Started editing field:', {
      field,
      currentValue,
      studentValue: student ? student[mapFieldToStudentData(field)] : null
    });
    */
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

  // Lưu field vào state local, không gửi API
  const saveField = async (field) => {
    try {
      // Validate field
      await form.validateFields([field]);
      
      // Add to saving state
      setSavingFields(prev => [...prev, field]);
      
      // Get updated value
      let value = form.getFieldValue(field);
      
      // Special handling for phone fields
      if (field === 'sdtHocVien' || field === 'sdtDaiDien' || field === 'sdtHocVienMoi') {
        value = formatPhoneNumber(value);
        // Update form field with formatted value
        form.setFieldsValue({ [field]: value });
      }
      
      // Disable console logging to reduce render issues
      /*
      console.log('[DEBUG] Saving field to local state:', {
        field,
        newValue: value,
        oldValue: student ? student[mapFieldToStudentData(field)] : null
      });
      */
      
      // Cập nhật local formValues
      dispatch({ type: 'SET_FORM_VALUES', payload: { ...formValues, [field]: value } });
      
      // Đóng chế độ edit
      setEditingFields(prev => prev.filter(f => f !== field));
      
      message.success(`Đã cập nhật ${getFieldLabel(field)} (chưa lưu)`);
    } catch (error) {
      console.error('[DEBUG] Error validating field:', {
        field, 
        error: error.message
      });
      message.error(`Lỗi cập nhật: ${error.message}`);
    } finally {
      setSavingFields(prev => prev.filter(f => f !== field));
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
  const proceedToStepTwo = async () => {
    try {
      // Validate the entire form
      await form.validateFields();
      
      // Set loading state
      setLocalLoading(true);
      
      // Prepare update data
      const updatedData = {
        Id: student.Id
      };
      
      // Map all changed fields from formValues to API fields
      Object.keys(formValues).forEach(field => {
        const apiField = mapFieldToStudentData(field);
        if (apiField && student && formValues[field] !== student[apiField]) {
          updatedData[apiField] = formValues[field];
        }
      });
      
      // Only send update if there are changes
      if (Object.keys(updatedData).length > 1) { // > 1 because Id is always included
        console.log('[DEBUG] Saving all changes to API:', updatedData);
        
        // Send update to API
        await updateStudent(updatedData);
        message.success('Đã lưu tất cả thông tin');
      } else {
        console.log('[DEBUG] No changes to save');
      }
      
      // Navigate to next step
      navigate(ROUTES.CLASS_SELECTION);
    } catch (error) {
      console.error('[DEBUG] Error saving form data:', error);
      message.error(`Lỗi lưu dữ liệu: ${error.message}`);
      setSubmitError(error.message);
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
          message="Lỗi"
          description={submitError}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
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
              >
                {isFieldEditing('hoTenHocVien') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <Input 
                        autoFocus
                        defaultValue={formValues.hoTenHocVien || ''}
                        onKeyDown={(e) => handleKeyDown(e, 'hoTenHocVien')}
                        disabled={readOnly}
                      />
                      <div className="inline-actions">
                        {isFieldSaving('hoTenHocVien') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('hoTenHocVien')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('hoTenHocVien')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
              >
                {isFieldEditing('gioiTinh') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <Select
                        style={{ width: '100%' }}
                        autoFocus
                        defaultValue={formValues.gioiTinh || ''}
                        options={[
                          { value: 'Nam', label: 'Nam' },
                          { value: 'Nữ', label: 'Nữ' },
                        ]}
                        onKeyDown={(e) => handleKeyDown(e, 'gioiTinh')}
                        disabled={readOnly}
                      />
                      <div className="inline-actions">
                        {isFieldSaving('gioiTinh') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('gioiTinh')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('gioiTinh')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
                rules={[{ required: true, message: 'Vui lòng nhập ngày sinh' }]}
                className="form-item editable-field"
              >
                {isFieldEditing('ngaySinh') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <Input 
                        autoFocus
                        defaultValue={formValues.ngaySinh || ''}
                        onKeyDown={(e) => handleKeyDown(e, 'ngaySinh')}
                        disabled={readOnly}
                        placeholder="DD/MM/YYYY"
                      />
                      <div className="inline-actions">
                        {isFieldSaving('ngaySinh') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('ngaySinh')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('ngaySinh')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
              >
                {isFieldEditing('sdtHocVien') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <PhoneInput
                        autoFocus
                        value={form.getFieldValue('sdtHocVien') || ''}
                        onChange={(value) => {
                          console.log('Phone input onChange:', value);
                          form.setFieldsValue({ sdtHocVien: value });
                        }}
                        disabled={readOnly}
                        hint="Nhấn Enter để lưu hoặc Esc để hủy"
                      />
                      <div className="inline-actions">
                        {isFieldSaving('sdtHocVien') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('sdtHocVien')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('sdtHocVien')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
              >
                {isFieldEditing('emailHocVien') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <Input 
                        autoFocus
                        defaultValue={formValues.emailHocVien || ''}
                        onKeyDown={(e) => handleKeyDown(e, 'emailHocVien')}
                        disabled={readOnly}
                      />
                      <div className="inline-actions">
                        {isFieldSaving('emailHocVien') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('emailHocVien')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('emailHocVien')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
                rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành' }]}
                className="form-item editable-field"
              >
                {isFieldEditing('tinhThanh') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <Input 
                        autoFocus
                        defaultValue={formValues.tinhThanh || ''}
                        onKeyDown={(e) => handleKeyDown(e, 'tinhThanh')}
                        disabled={readOnly}
                      />
                      <div className="inline-actions">
                        {isFieldSaving('tinhThanh') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('tinhThanh')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('tinhThanh')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="display-value" 
                    onClick={() => !readOnly && handleEditField('tinhThanh')}
                  >
                    {formValues.tinhThanh || '-'}
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
                    onChange={(value) => setConfirmStudentInfo(value)}
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
                            // Allow empty values - required rule will handle this
                            if (!value) return Promise.resolve();
                            
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
                    >
                      {isFieldEditing('sdtHocVienMoi') ? (
                        <div className="edit-field-container">
                          <div className="input-with-actions">
                            <PhoneInput
                              autoFocus
                              defaultValue={formValues.sdtHocVienMoi || ''}
                              onChange={(value) => form.setFieldsValue({ sdtHocVienMoi: value })}
                              disabled={readOnly}
                              placeholder="Nhập số điện thoại khác"
                              hint="Nhấn Enter để lưu hoặc Esc để hủy"
                            />
                            <div className="inline-actions">
                              {isFieldSaving('sdtHocVienMoi') ? (
                                <Spin size="small" />
                              ) : (
                                <>
                                  <span className="action-icon check" onClick={() => saveField('sdtHocVienMoi')}>✓</span>
                                  <span className="action-icon close" onClick={() => cancelEditField('sdtHocVienMoi')}>✕</span>
                                </>
                              )}
                            </div>
                          </div>
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
              >
                {isFieldEditing('hoTenDaiDien') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <Input 
                        autoFocus
                        defaultValue={formValues.hoTenDaiDien || ''}
                        onKeyDown={(e) => handleKeyDown(e, 'hoTenDaiDien')}
                        disabled={readOnly}
                      />
                      <div className="inline-actions">
                        {isFieldSaving('hoTenDaiDien') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('hoTenDaiDien')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('hoTenDaiDien')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
              >
                {isFieldEditing('moiQuanHe') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <Select
                        style={{ width: '100%' }}
                        autoFocus
                        defaultValue={formValues.moiQuanHe || ''}
                        options={[
                          { value: 'Cha', label: 'Cha' },
                          { value: 'Mẹ', label: 'Mẹ' },
                          { value: 'Anh/Chị', label: 'Anh/Chị' },
                          { value: 'Người giám hộ', label: 'Người giám hộ' },
                          { value: 'Khác', label: 'Khác' },
                        ]}
                        onKeyDown={(e) => handleKeyDown(e, 'moiQuanHe')}
                        disabled={readOnly}
                      />
                      <div className="inline-actions">
                        {isFieldSaving('moiQuanHe') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('moiQuanHe')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('moiQuanHe')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
              >
                {isFieldEditing('emailDaiDien') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <Input 
                        autoFocus
                        defaultValue={formValues.emailDaiDien || ''}
                        onKeyDown={(e) => handleKeyDown(e, 'emailDaiDien')}
                        disabled={readOnly}
                      />
                      <div className="inline-actions">
                        {isFieldSaving('emailDaiDien') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('emailDaiDien')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('emailDaiDien')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
              >
                {isFieldEditing('sdtDaiDien') ? (
                  <div className="edit-field-container">
                    <div className="input-with-actions">
                      <PhoneInput
                        autoFocus
                        defaultValue={formValues.sdtDaiDien || ''}
                        onChange={(value) => form.setFieldsValue({ sdtDaiDien: value })}
                        disabled={readOnly}
                        hint="Nhấn Enter để lưu hoặc Esc để hủy"
                      />
                      <div className="inline-actions">
                        {isFieldSaving('sdtDaiDien') ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <span className="action-icon check" onClick={() => saveField('sdtDaiDien')}>✓</span>
                            <span className="action-icon close" onClick={() => cancelEditField('sdtDaiDien')}>✕</span>
                          </>
                        )}
                      </div>
                    </div>
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
                    { required: true, message: 'Vui lòng nhập số điện thoại mới' },
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
                >
                  {isFieldEditing('newGuardianPhone') ? (
                    <div className="edit-field-container">
                      <div className="input-with-actions">
                        <PhoneInput
                          autoFocus
                          defaultValue={formValues.newGuardianPhone || ''}
                          onChange={(value) => form.setFieldsValue({ newGuardianPhone: value })}
                          disabled={readOnly}
                          placeholder="Nhập số điện thoại đăng ký Zalo"
                          hint="Nhấn Enter để lưu hoặc Esc để hủy"
                        />
                        <div className="inline-actions">
                          {isFieldSaving('newGuardianPhone') ? (
                            <Spin size="small" />
                          ) : (
                            <>
                              <span className="action-icon check" onClick={() => saveField('newGuardianPhone')}>✓</span>
                              <span className="action-icon close" onClick={() => cancelEditField('newGuardianPhone')}>✕</span>
                            </>
                          )}
                        </div>
                      </div>
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