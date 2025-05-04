import { useState, useEffect } from 'react';
import { Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../../../contexts/StudentContext';
import { useProgressStep } from '../../../contexts/ProgressStepContext';
import { formatPhoneNumber, mapGender } from '../utils/formatters';
import { FIELD_MAPPINGS, ROUTES } from '../../../config';
import { updateStudentClass } from '../../../services/api/student';

/**
 * Custom hook to manage StudentInfo form logic
 * @param {object} form - Form instance
 */
const useStudentInfoForm = (form) => {
  const navigate = useNavigate();
  const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;
  
  // Ensure form is provided
  if (!form) {
    console.error('Form instance is required for useStudentInfoForm');
  }
  
  // Access student context
  const { 
    student, 
    loading: studentLoading, 
    error: studentError, 
    updateStudent,
    loadStudentData
  } = useStudent();

  // Access progress step context
  const { goToStep, completeStep } = useProgressStep();
  
  // State management
  const [formInitialized, setFormInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  
  // Combined loading state
  const isDataLoading = studentLoading || isLoading;
  
  // State for modal confirmations
  const [confirmStudentInfo, setConfirmStudentInfo] = useState(undefined);
  const [confirmGuardianInfo, setConfirmGuardianInfo] = useState(undefined);
  
  // Field edit states
  const [editingFields, setEditingFields] = useState([]);
  const [savingFields, setSavingFields] = useState([]);
  
  // Date field specific states 
  const [dateValues, setDateValues] = useState({ day: null, month: null, year: null });
  const [dateError, setDateError] = useState(null);
  
  // Initialize form with student data
  useEffect(() => {
    if (student && form && !formInitialized) {
      
      initializeForm();
    }
  }, [student, form, formInitialized]);
  
  // Update context values when student data changes
  useEffect(() => {
    if (student) {
      const classinValue = String(student.classinConfirm || '');
      const zaloValue = String(student.zaloConfirm || '');
      
      setConfirmStudentInfo(classinValue || undefined);
      setConfirmGuardianInfo(zaloValue || undefined);
      
      // Store original data for change detection
      if (!Object.keys(originalData).length) {
        setOriginalData({
          hoTenHocVien: student[STUDENT_FIELDS.NAME] || '',
          gioiTinh: student[STUDENT_FIELDS.GENDER] || '',
          ngaySinh: student[STUDENT_FIELDS.DOB] || '',
          sdtHocVien: student[STUDENT_FIELDS.PHONE] || '',
          emailHocVien: student[STUDENT_FIELDS.EMAIL] || '',
          tinhThanh: student[STUDENT_FIELDS.LOCATION] || '',
          hoTenDaiDien: student[STUDENT_FIELDS.GUARDIAN_NAME] || '',
          moiQuanHe: student[STUDENT_FIELDS.GUARDIAN_RELATION] || '',
          emailDaiDien: student[STUDENT_FIELDS.GUARDIAN_EMAIL] || '',
          sdtDaiDien: student[STUDENT_FIELDS.GUARDIAN_PHONE] || '',
          confirmStudentInfo: student.classinConfirm || undefined,
          confirmGuardianInfo: student.zaloConfirm || undefined
        });
      }
    }
  }, [student]);
  
  // Handle error state
  useEffect(() => {
    if (studentError) {
      setError(studentError);
    }
  }, [studentError]);
  
  // Initialize form with student data
  const initializeForm = () => {
    try {
      if (!student) {
        
        return;
      }

      
      
      // Lưu ý: giữ nguyên giá trị giới tính tiếng Việt theo yêu cầu
      // không chuyển đổi từ Nam/Nữ sang Male/Female
      // Chuyển đổi giới tính từ tiếng Anh (male/female) sang tiếng Việt (Nam/Nữ) cho hiển thị
      // nhưng khi lưu vào DB sẽ giữ nguyên giá trị tiếng Việt theo yêu cầu
      const gender = student[STUDENT_FIELDS.GENDER] || '';
      let mappedGender = gender;
      
      if (gender.toLowerCase() === 'male') {
        mappedGender = 'Nam';
      } else if (gender.toLowerCase() === 'female') {
        mappedGender = 'Nữ';
      }
      
      const values = {
        hoTenHocVien: student[STUDENT_FIELDS.NAME] || '',
        gioiTinh: mappedGender, // Chuyển đổi sang tiếng Việt để hiển thị
        ngaySinh: student[STUDENT_FIELDS.DOB] || '',
        sdtHocVien: formatPhoneNumber(student[STUDENT_FIELDS.PHONE] || ''),
        emailHocVien: student[STUDENT_FIELDS.EMAIL] || '',
        tinhThanh: student[STUDENT_FIELDS.LOCATION] || '',
        hoTenDaiDien: student[STUDENT_FIELDS.GUARDIAN_NAME] || '',
        moiQuanHe: student[STUDENT_FIELDS.GUARDIAN_RELATION] || '',
        sdtDaiDien: formatPhoneNumber(student[STUDENT_FIELDS.GUARDIAN_PHONE] || ''),
        emailDaiDien: student[STUDENT_FIELDS.GUARDIAN_EMAIL] || '',
        confirmStudentInfo: student.classinConfirm || null, // Không có giá trị mặc định - dùng null thay vì ''
        // Nếu có giá trị rõ ràng thì set, nếu không thì để null để mặc định rỗng
confirmGuardianInfo: student.zaloConfirm === '1' || student.zaloConfirm === 1 || student.zaloConfirm === true || student.zaloConfirm === 'Có'
  ? '1'
  : (student.zaloConfirm === '0' || student.zaloConfirm === 0 || student.zaloConfirm === false || student.zaloConfirm === 'Không' ? '0' : null)
      };
      
      
      
      // Gọi ngay lập tức thay vì setTimeout để tránh race condition
      form.resetFields();
      form.setFieldsValue(values);
      setFormValues(values);
      setFormInitialized(true);
    } catch (error) {
      
    }
  };
  
  // Handle form values change
  const handleValuesChange = (changedValues, allValues) => {
    // Special handling for confirmStudentInfo and confirmGuardianInfo
    if ('confirmStudentInfo' in changedValues) {
      setConfirmStudentInfo(changedValues.confirmStudentInfo);
    }
    
    if ('confirmGuardianInfo' in changedValues) {
      setConfirmGuardianInfo(changedValues.confirmGuardianInfo);
    }
    
    // Update form values
    setFormValues(prev => ({ ...prev, ...changedValues }));
  };
  
  // Handle edit field
  const handleEditField = (field) => {
    setEditingFields(prev => [...prev, field]);
    
    // Handle date field
    if (field === 'ngaySinh') {
      const dateString = formValues[field];
      if (dateString) {
        const dateParts = dateString.split('/');
        if (dateParts.length === 3) {
          setDateValues({
            day: parseInt(dateParts[0], 10),
            month: parseInt(dateParts[1], 10),
            year: parseInt(dateParts[2], 10)
          });
          setDateError(null);
        }
      }
    }
  };
  
  // Cancel edit field
  const cancelEditField = (field) => {
    
    setEditingFields(prev => prev.filter(f => f !== field));
    
    // Reset date error if canceling date edit
    if (field === 'ngaySinh') {
      
      setDateError(null);
      // Kiểm tra xem giá trị ngày sinh có được khôi phục không
      console.log('[DEBUG] Current ngaySinh value in form:', form.getFieldValue('ngaySinh'));
    }
  };
  
  // Save edited field
  const saveField = async (field) => {
    try {
      await form.validateFields([field]);
      
      let value = form.getFieldValue(field);
      
      // Format phone numbers
      if (field === 'sdtHocVien' || field === 'sdtDaiDien' || field === 'sdtHocVienMoi' || field === 'newGuardianPhone') {
        value = formatPhoneNumber(value);
        form.setFieldsValue({ [field]: value });
      }
      
      // Handle date field
      if (field === 'ngaySinh') {
        if (!value || dateError) {
          value = formValues[field] || '';
        }
        
        if (value && value._isAMomentObject) {
          value = value.format('DD/MM/YYYY');
          form.setFieldsValue({ [field]: value });
        }
      }
      
      // Exit edit mode
      setEditingFields(prev => prev.filter(f => f !== field));
      
      // Update form values
      setFormValues(prev => ({ ...prev, [field]: value }));
      
      // Show success message
      if (value !== formValues[field]) {
        message.success(`Đã cập nhật ${getFieldLabel(field)} (chưa lưu)`, 0.5);
      }
    } catch (error) {
      console.error('Error validating field:', error);
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
  
  // Handle date change for the custom date selector
  const handleDateChange = (type, value) => {
    console.log(`[DEBUG] Date ${type} changed to:`, value);
    setDateValues(prev => ({ ...prev, [type]: value }));
    
    const { day, month, year } = { ...dateValues, [type]: value };
    console.log('[DEBUG] Complete date values after change:', { day, month, year });
    
    // Validate date if all parts are set
    if (day && month && year) {
      try {
        // Check if date is valid
        const newDate = new Date(year, month - 1, day);
        if (newDate.getDate() !== day || newDate.getMonth() !== month - 1 || newDate.getFullYear() !== year) {
          console.log('[DEBUG] Invalid date detected:', { day, month, year });
          setDateError('Ngày không hợp lệ');
          return;
        }
        
        // Format date
        const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        console.log('[DEBUG] Formatted valid date:', formattedDate);
        
        // Update form
        form.setFieldsValue({ ngaySinh: formattedDate });
        setFormValues(prev => ({ ...prev, ngaySinh: formattedDate }));
        setDateError(null);
      } catch (error) {
        console.error('[DEBUG] Error validating date:', error);
        setDateError('Ngày không hợp lệ');
      }
    }
  };
  
  // Handle date selector blur
  const handleDateSelectBlur = (e) => {
    console.log('[DEBUG] Date selector blur event:', e);
    console.log('[DEBUG] Date values at blur:', dateValues);
    console.log('[DEBUG] Date error status:', dateError);
    
    // Only finalize if user clicks outside the date selector
    if (!e.currentTarget.contains(e.relatedTarget)) {
      console.log('[DEBUG] Click detected outside date selector');
      if (!dateError && dateValues.day && dateValues.month && dateValues.year) {
        console.log('[DEBUG] Conditions met, calling cancelEditField for ngaySinh');
        cancelEditField('ngaySinh');
      } else {
        console.log('[DEBUG] Date validation failed:', { dateError, dateValues });
      }
    } else {
      console.log('[DEBUG] Click detected inside date selector, not exiting edit mode');
    }
  };
  
  // Check if form has changed compared to original data
  const hasFormChanged = () => {
    const fieldsToCheck = [
      'hoTenHocVien', 'gioiTinh', 'ngaySinh', 'sdtHocVien', 
      'emailHocVien', 'tinhThanh', 'hoTenDaiDien', 'moiQuanHe',
      'emailDaiDien', 'sdtDaiDien', 'confirmStudentInfo', 'confirmGuardianInfo'
    ];
    
    // Add conditional fields
    if (formValues.confirmStudentInfo === '0') {
      fieldsToCheck.push('sdtHocVienMoi');
    }
    
    if (formValues.confirmGuardianInfo === '0') {
      fieldsToCheck.push('newGuardianPhone');
    }
    
    // Check each field
    return fieldsToCheck.some(field => {
      return formValues[field] !== originalData[field];
    });
  };
  
  // Get changed fields for display
  const getChangedFields = () => {
    const fieldsToCheck = [
      'hoTenHocVien', 'gioiTinh', 'ngaySinh', 'sdtHocVien', 
      'emailHocVien', 'tinhThanh', 'hoTenDaiDien', 'moiQuanHe',
      'emailDaiDien', 'sdtDaiDien'
    ];
    
    // Check confirmation fields
    if (formValues.confirmStudentInfo !== originalData.confirmStudentInfo) {
      fieldsToCheck.push('confirmStudentInfo');
      
      if (formValues.confirmStudentInfo === '0') {
        fieldsToCheck.push('sdtHocVienMoi');
      }
    }
    
    if (formValues.confirmGuardianInfo !== originalData.confirmGuardianInfo) {
      fieldsToCheck.push('confirmGuardianInfo');
      
      if (formValues.confirmGuardianInfo === '0') {
        fieldsToCheck.push('newGuardianPhone');
      }
    }
    
    // Return list of changed fields
    return fieldsToCheck.filter(field => formValues[field] !== originalData[field]);
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
      'emailDaiDien': 'Email người đại diện',
      'confirmStudentInfo': 'Xác nhận SĐT cho ClassIn',
      'sdtHocVienMoi': 'SĐT đăng ký ClassIn',
      'confirmGuardianInfo': 'Xác nhận SĐT cho Zalo',
      'newGuardianPhone': 'SĐT đăng ký Zalo'
    };
    return mapping[field];
  };
  
  // Show confirmation modal before saving
  const showConfirmationModal = async () => {
    console.log('showConfirmationModal được gọi', form);
    try {
      // Kiểm tra và log giá trị form trước khi validate
      const currentValues = form.getFieldsValue(true);
      console.log('Giá trị form hiện tại:', currentValues);
      console.log('Trạng thái form đã thay đổi:', hasFormChanged());
      
      // Xác định các trường bắt buộc
      const requiredFields = [
        'hoTenHocVien', 'gioiTinh', 'ngaySinh', 'sdtHocVien', 'emailHocVien', 
        'tinhThanh', 'hoTenDaiDien', 'moiQuanHe', 'emailDaiDien', 'sdtDaiDien',
        'confirmStudentInfo', 'confirmGuardianInfo'
      ];
      
      // Kiểm tra từng trường bắt buộc
      let missingFields = [];
      requiredFields.forEach(field => {
        if (!currentValues[field]) {
          missingFields.push(field);
          console.log(`Trường ${field} đang thiếu giá trị`);
        }
      });
      
      if (missingFields.length > 0) {
        console.log('Các trường còn thiếu:', missingFields);
        message.error(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
        return;
      }
      
      // Validate all form fields
      console.log('Bắt đầu validate form...');
      await form.validateFields();
      console.log('Form validation thành công!');
      
      // Check if form has changed
      const hasChanges = hasFormChanged();
      console.log('Kết quả kiểm tra thay đổi:', hasChanges);
      
      if (!hasChanges) {
        message.info('Thông tin không thay đổi, chuyển thẳng đến bước tiếp theo');
        proceedToStepTwo(false);
        return;
      }
      
      // Show confirmation modal
      console.log('Hiển thị modal xác nhận...');
      setConfirmModalVisible(true);
    } catch (error) {
      console.error('Form validation thất bại. Chi tiết lỗi:', error);
      
      // Hiển thị lỗi cụ thể cho người dùng
      if (error.errorFields) {
        const errorMessages = error.errorFields.map(field => `${field.name.join('.')} - ${field.errors.join('; ')}`);
        message.error(`Vui lòng sửa các lỗi sau: ${errorMessages.join(', ')}`);
      } else {
        message.error('Không thể xác nhận thông tin. Vui lòng kiểm tra lại form.');
      }
    }
  };
  
  // Proceed to next step
  const proceedToStepTwo = async (shouldSave = true) => {
    try {
      setLocalLoading(true);
      
      if (shouldSave) {
        // Save data to database
        await saveData();
      }
      
      // Determine target URL
      const maLop = student?.[STUDENT_FIELDS.CLASS_CODE];
      const loaiLop = student?.loaiLop;
      const billItemId = student?.[STUDENT_FIELDS.BILL_ITEM_ID];
      let targetUrl = ROUTES.STEP_TWO;
      
      if (maLop) {
        targetUrl += `?screen=reservation&id=${billItemId}`;
      } else if (loaiLop === '1:1') {
        targetUrl += `?screen=customSchedule&id=${billItemId}`;
      } else {
        targetUrl += `?screen=selection&id=${billItemId}`;
      }
      
      // Update progress bar
      completeStep(1);
      goToStep(2);
      
      // Navigate to next step
      navigate(targetUrl);
    } catch (error) {
      console.error('Error proceeding to step two:', error);
      setSubmitError('Có lỗi xảy ra khi lưu thông tin: ' + error.message);
    } finally {
      setLocalLoading(false);
      setConfirmModalVisible(false);
    }
  };
  
  // Save data to database
  const saveData = async () => {
  // Log toàn bộ giá trị form khi submit
  const allFormValues = form.getFieldsValue();
  console.log('[LOG][SUBMIT] Toàn bộ giá trị form:', allFormValues);

  // Only proceed if form has changes
  if (!hasFormChanged()) {
    console.log('No changes to save');
    return;
  }

  try {
    // Get values from form
    const values = form.getFieldsValue();

    // Log giá trị xác nhận trước mapping
console.log('[LOG][SUBMIT][RAW] confirmStudentInfo:', values.confirmStudentInfo, '| confirmGuardianInfo:', values.confirmGuardianInfo);
// Mapping xác nhận
const classinConfirm = values.confirmStudentInfo === '1' ? '1' : '0';
function normalizeZaloConfirm(val) {
  if (val === '1' || val === 1 || val === true || val === 'Có' || val === 'có' || val === 'yes' || val === 'Yes') return '1';
  if (val === '0' || val === 0 || val === false || val === 'Không' || val === 'không' || val === 'no' || val === 'No') return '0';
  return '0'; // fallback an toàn
}
const zaloConfirm = normalizeZaloConfirm(values.confirmGuardianInfo);
console.log('[LOG][MAP][DEBUG] confirmStudentInfo:', values.confirmStudentInfo, '=> classinConfirm:', classinConfirm);
console.log('[LOG][MAP][DEBUG] confirmGuardianInfo:', values.confirmGuardianInfo, '=> zaloConfirm:', zaloConfirm);

    // Mapping số điện thoại
    const soDienThoaiDangKyClassin = classinConfirm === '1'
      ? formatPhoneNumber(values.sdtHocVien)
      : formatPhoneNumber(values.sdtHocVienMoi || '');
    const soDienThoaiDangKyZalo = zaloConfirm === '1'
      ? formatPhoneNumber(values.sdtDaiDien)
      : formatPhoneNumber(values.newGuardianPhone || '');
    console.log('[LOG][MAP] sdtHocVien:', values.sdtHocVien);
    console.log('[LOG][MAP] sdtHocVienMoi:', values.sdtHocVienMoi);
    console.log('[LOG][MAP] soDienThoaiDangKyClassin:', soDienThoaiDangKyClassin);
    console.log('[LOG][MAP] soDienThoaiDangKyZalo:', soDienThoaiDangKyZalo);

    // Tạo object updateData
    const updateData = {
      hoTenHocVien: values.hoTenHocVien,
      gioiTinh: values.gioiTinh,
      ngaySinh: values.ngaySinh,
      sdtHocVien: formatPhoneNumber(values.sdtHocVien),
      emailHocVien: values.emailHocVien,
      tinhThanh: values.tinhThanh,
      hoTenDaiDien: values.hoTenDaiDien,
      moiQuanHe: values.moiQuanHe,
      emailDaiDien: values.emailDaiDien,
      soDienThoaiNguoiDaiDien: formatPhoneNumber(values.sdtDaiDien),
      classinConfirm,
      zaloConfirm,
      soDienThoaiDangKyClassin,
      soDienThoaiDangKyZalo
    };
    console.log('[LOG][UPDATE] Payload gửi lên NocoDB:', updateData);

    // Gửi request update
    const response = await updateStudent(updateData);

    // Update class registration nếu cần
    if (student[STUDENT_FIELDS.CLASS_CODE]) {
      await updateClassRegistration(student.Id, student[STUDENT_FIELDS.CLASS_CODE]);
    }

    // Update local form values
    setFormValues(values);

    return response;
  } catch (error) {
    console.error('Error updating student info:', error);
  }
}


  // Update class registration
  const updateClassRegistration = async (studentId, classCode) => {
    try {
      console.log(`Updating class registration for student ${studentId}, class ${classCode}`);
      return await updateStudentClass(studentId, classCode);
    } catch (error) {
      console.error('Error in updateClassRegistration:', error);
      throw error;
    }
  };
  
  // Reload student data
  const reloadStudentData = async () => {
    try {
      setLocalLoading(true);
      await loadStudentData();
      setError(null);
    } catch (error) {
      console.error('Error reloading student data:', error);
      setError('Không thể tải lại dữ liệu: ' + error.message);
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Check if field is being edited
  const isFieldEditing = (field) => editingFields.includes(field);
  
  // Check if field is being saved
  const isFieldSaving = (field) => savingFields.includes(field);
  
  return {
    // Form
    form,
    formInitialized,
    formValues,
    
    // Loading states
    isLoading,
    isDataLoading,
    localLoading,
    setLocalLoading,
    
    // Error states
    error,
    submitError,
    setSubmitError,
    
    // Data
    student,
    
    // Confirmation states
    confirmStudentInfo,
    confirmGuardianInfo,
    confirmModalVisible,
    
    // Field editing
    editingFields,
    savingFields,
    dateValues,
    dateError,
    
    // Visibility
    contentVisible,
    
    // Methods
    handleValuesChange,
    handleEditField,
    cancelEditField,
    saveField,
    handleKeyDown,
    handleDateChange,
    handleDateSelectBlur,
    showConfirmationModal,
    proceedToStepTwo,
    reloadStudentData,
    isFieldEditing,
    isFieldSaving,
    hasFormChanged,
    getChangedFields,
    getFieldLabel,
    
    // Actions
    setConfirmModalVisible,
    setConfirmStudentInfo,
    setConfirmGuardianInfo,
    setContentVisible,
    setDateValues,
    setDateError,
    setEditingFields,
    setSavingFields
  };
};

export default useStudentInfoForm;
