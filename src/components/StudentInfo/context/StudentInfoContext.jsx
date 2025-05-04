import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { message } from 'antd';
import { useStudent } from '../../../contexts/StudentContext';
import { useProgressStep } from '../../../contexts/ProgressStepContext';
import { formatPhoneNumber, mapGender } from '../utils/formatters';
import { FIELD_MAPPINGS, ROUTES } from '../../../config';

// Create context
const StudentInfoContext = createContext();

// Initial state for reducer
const initialState = {
  formInitialized: false,
  isLoading: false,
  formValues: {},
  error: null
};

// Reducer for form state management
const reducer = (state, action) => {
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
};

// Provider component
export const StudentInfoProvider = ({ children }) => {
  // Access external contexts
  const { 
    student, 
    loading: studentLoading, 
    error: studentError, 
    updateStudent,
    loadStudentData
  } = useStudent();
  
  const { goToStep, completeStep } = useProgressStep();
  
  // Local state management
  const [state, dispatch] = useReducer(reducer, initialState);
  const { formInitialized, isLoading, formValues, error } = state;
  
  // Additional state
  const [readOnly, setReadOnly] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingFields, setEditingFields] = useState([]);
  const [savingFields, setSavingFields] = useState([]);
  const [confirmStudentInfo, setConfirmStudentInfo] = useState(undefined);
  const [confirmGuardianInfo, setConfirmGuardianInfo] = useState(undefined);
  const [dateValues, setDateValues] = useState({ day: null, month: null, year: null });
  const [dateError, setDateError] = useState(null);
  const [originalData, setOriginalData] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  
  // Debug: Log ra khi trạng thái modal thay đổi
  useEffect(() => {
    console.log('[DEBUG-CONTEXT] confirmModalVisible thay đổi:', confirmModalVisible);
  }, [confirmModalVisible]);
  const [contentVisible, setContentVisible] = useState(false);
  
  // Combined loading state
  const isDataLoading = studentLoading || isLoading;
  
  // Map field to student data field
  const mapFieldToStudentData = (field) => {
    const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;
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
  
  // Utility functions for field editing
  const isFieldEditing = (field) => editingFields.includes(field);
  const isFieldSaving = (field) => savingFields.includes(field);
  
  // Initialize original data when student data is loaded
  useEffect(() => {
    if (student && !Object.keys(originalData).length) {
      const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;
      
      // Store original values from student data
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
        // Default for confirmation fields
        confirmStudentInfo: student.classinConfirm || undefined,
        confirmGuardianInfo: student.zaloConfirm || undefined
      });
    }
  }, [student]);
  
  // Handle loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: studentLoading });
  }, [studentLoading]);
  
  // Update state when student data changes
  useEffect(() => {
    if (student) {
      const classinValue = String(student.classinConfirm || '');
      const zaloValue = String(student.zaloConfirm || '');
      
      setConfirmStudentInfo(classinValue || undefined);
      setConfirmGuardianInfo(zaloValue || undefined);
    }
  }, [student]);
  
  // Handle error state
  useEffect(() => {
    if (studentError) {
      dispatch({ type: 'SET_ERROR', payload: studentError });
    }
  }, [studentError]);
  
  // Edit field handler
  const handleEditField = (field) => {
    // Add field to editing list
    setEditingFields(prev => [...prev, field]);
    
    // Special handling for date
    if (field === 'ngaySinh') {
      // Parse date if available
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
  
  // Cancel edit field handler
  const cancelEditField = (field) => {
    setEditingFields(prev => prev.filter(f => f !== field));
    
    // Reset date values if canceling date edit
    if (field === 'ngaySinh') {
      setDateError(null);
    }
  };
  
  // Save edited field
  const saveField = async (field, form) => {
    if (!form) return;
    
    try {
      await form.validateFields([field]);
      
      let value = form.getFieldValue(field);
      
      // Special handling for phone fields
      if (field === 'sdtHocVien' || field === 'sdtDaiDien' || field === 'sdtHocVienMoi' || field === 'newGuardianPhone') {
        value = formatPhoneNumber(value);
        // Update form field with formatted value
        form.setFieldsValue({ [field]: value });
      }
      
      // Special handling for date
      if (field === 'ngaySinh' && value) {
        // Ensure date is consistently formatted
        if (value._isAMomentObject) {
          // If it's a moment object from DatePicker
          value = value.format('DD/MM/YYYY');
        }
        form.setFieldsValue({ [field]: value });
      }
      
      // Exit edit mode
      setEditingFields(prev => prev.filter(f => f !== field));
      
      // Update formValues
      dispatch({ 
        type: 'SET_FORM_VALUES', 
        payload: { ...formValues, [field]: value } 
      });
      
      // Optional notification
      if (value !== formValues[field]) {
        message.success(`Đã cập nhật ${getFieldLabel(field)} (chưa lưu)`, 0.5);
      }
    } catch (error) {
      console.error('Error validating field:', error);
      
      // Still exit edit mode even on error
      setEditingFields(prev => prev.filter(f => f !== field));
      
      message.error(`Lỗi cập nhật: ${error.message}`);
    }
  };
  
  // Handle key events for inline editing
  const handleKeyDown = (e, field, form) => {
    if (e.key === 'Enter') {
      saveField(field, form);
    } else if (e.key === 'Escape') {
      cancelEditField(field);
    }
  };
  
  // Get changed fields compared to original data
  const getChangedFields = () => {
    const changedFields = [];
    
    // Compare current form values with original data
    Object.keys(formValues).forEach(field => {
      // Skip special fields that are not regular form fields
      if (['confirmStudentInfo', 'confirmGuardianInfo', 'sdtHocVienMoi', 'newGuardianPhone'].includes(field)) {
        return;
      }
      
      // Add to changed fields if values are different
      if (formValues[field] !== originalData[field]) {
        changedFields.push({
          field,
          oldValue: originalData[field],
          newValue: formValues[field]
        });
      }
    });
    
    // Add ClassIn phone if student phone was changed
    if (formValues.confirmStudentInfo === '0' && formValues.sdtHocVienMoi) {
      changedFields.push({
        field: 'sdtHocVienClassIn',
        oldValue: originalData.sdtHocVien,
        newValue: formValues.sdtHocVienMoi
      });
    }
    
    // Add Zalo phone if guardian phone was changed
    if (formValues.confirmGuardianInfo === '0' && formValues.newGuardianPhone) {
      changedFields.push({
        field: 'sdtDaiDienZalo',
        oldValue: originalData.sdtDaiDien,
        newValue: formValues.newGuardianPhone
      });
    }
    
    return changedFields;
  };
  
  // Context value
  const contextValue = {
    // State
    student,
    formInitialized,
    isLoading,
    formValues,
    error,
    readOnly,
    submitError,
    editingFields,
    savingFields,
    confirmStudentInfo,
    confirmGuardianInfo,
    dateValues,
    dateError,
    isDataLoading,
    localLoading,
    confirmModalVisible,
    contentVisible,
    originalData,
    
    // Actions
    dispatch,
    setReadOnly,
    setSubmitError,
    setEditingFields,
    setSavingFields,
    setConfirmStudentInfo,
    setConfirmGuardianInfo,
    setDateValues,
    setDateError,
    setLocalLoading,
    setConfirmModalVisible,
    setContentVisible,
    
    // Utility functions
    mapFieldToStudentData,
    getFieldLabel,
    isFieldEditing,
    isFieldSaving,
    getChangedFields,
    
    // Field editing handlers
    handleEditField,
    cancelEditField,
    saveField,
    handleKeyDown,
    
    // External context actions
    updateStudent,
    loadStudentData,
    goToStep,
    completeStep
  };
  
  return (
    <StudentInfoContext.Provider value={contextValue}>
      {children}
    </StudentInfoContext.Provider>
  );
};

// Custom hook to use the context
export const useStudentInfo = () => {
  const context = useContext(StudentInfoContext);
  if (!context) {
    throw new Error('useStudentInfo must be used within a StudentInfoProvider');
  }
  return context;
};

export default StudentInfoContext;
