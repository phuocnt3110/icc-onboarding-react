import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../config';

// Tạo context
const StudentContext = createContext();
console.log('StudentContext.js - TABLE_IDS imported:', TABLE_IDS);

// Hook để sử dụng context
export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

// Provider component
export const StudentProvider = ({ children }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Fetch student data
  const fetchStudentData = async (id) => {
    if (!id) {
      setError(MESSAGES.MISSING_ID);
      return null;
    }
    
    // Nếu đang loading, bỏ qua request mới
    if (loading) {
      console.log("Đang loading, bỏ qua fetchStudentData");
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Kiểm tra TABLE_IDS
      if (!TABLE_IDS.STUDENT) {
        console.error('TABLE_IDS.STUDENT is undefined!', TABLE_IDS);
        setError('Lỗi cấu hình: ID bảng dữ liệu học viên không xác định');
        setLoading(false);
        return null;
      }
  
      // Tìm học viên theo billItemId
      const response = await apiClient.get(
        `/tables/${TABLE_IDS.STUDENT}/records?where=(${FIELD_MAPPINGS.STUDENT.BILL_ITEM_ID},eq,${id})`
      );
      
      console.log('API response:', response.data);
      
      if (!response.data || !response.data.list || response.data.list.length === 0) {
        setError('Không tìm thấy thông tin học viên');
        setLoading(false);
        return null;
      }
      
      // Lấy dữ liệu học viên từ kết quả
      const studentRecord = response.data.list[0];
      
      // QUAN TRỌNG: Cập nhật state studentData
      setStudentData(studentRecord);
      console.log('studentData đã được cập nhật:', studentRecord);
      
      setLoading(false);
      
      // Trả về dữ liệu trực tiếp để người gọi có thể sử dụng ngay
      return studentRecord;
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError(error.message || MESSAGES.STUDENT_DATA_LOAD_ERROR);
      setLoading(false);
      return null;
    }
  };
  
  // Update student data
  const updateStudentData = async (id, updateFields) => {
    if (!id) {
      setError(MESSAGES.MISSING_ID);
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create request object
      const requestData = {
        Id: id,
        ...updateFields
      };
      
      // Update student record
      const response = await apiClient.patch(`/tables/${TABLE_IDS.STUDENT}/records`, requestData);
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        ...updateFields
      }));
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error updating student data:', error);
      setError(error.message || MESSAGES.UPDATE_FAILED.replace('{error}', ''));
      setLoading(false);
      return false;
    }
  };
  
  // Update student class information
  const updateStudentClass = async (studentId, updateData) => {
    if (!studentId) {
      setError(MESSAGES.MISSING_ID);
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create clean request object with only needed fields
      const requestData = {
        Id: studentId
      };
      
      // Only add defined fields with values
      if (FIELD_MAPPINGS.STUDENT.SCHEDULE && updateData[FIELD_MAPPINGS.STUDENT.SCHEDULE]) {
        requestData[FIELD_MAPPINGS.STUDENT.SCHEDULE] = updateData[FIELD_MAPPINGS.STUDENT.SCHEDULE];
      }
      
      if (FIELD_MAPPINGS.STUDENT.STATUS && updateData[FIELD_MAPPINGS.STUDENT.STATUS]) {
        requestData[FIELD_MAPPINGS.STUDENT.STATUS] = updateData[FIELD_MAPPINGS.STUDENT.STATUS];
      }
      
      if (FIELD_MAPPINGS.STUDENT.CLASS_CODE && updateData[FIELD_MAPPINGS.STUDENT.CLASS_CODE]) {
        requestData[FIELD_MAPPINGS.STUDENT.CLASS_CODE] = updateData[FIELD_MAPPINGS.STUDENT.CLASS_CODE];
      }
      
      if (FIELD_MAPPINGS.STUDENT.START_DATE && updateData[FIELD_MAPPINGS.STUDENT.START_DATE]) {
        requestData[FIELD_MAPPINGS.STUDENT.START_DATE] = updateData[FIELD_MAPPINGS.STUDENT.START_DATE];
      }
      
      // Send request
      const response = await apiClient.patch(`/tables/${TABLE_IDS.STUDENT}/records`, requestData);
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        ...updateData
      }));
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error updating student class:', error);
      setError(error.message || MESSAGES.CLASS_REGISTRATION_FAILED.replace('{error}', ''));
      setLoading(false);
      return false;
    }
  };
  
  // Clear student data (logout)
  const clearStudentData = () => {
    setStudentData(null);
    setIsAuthenticated(false);
  };
  
  // Value to be provided to consumers
  const value = {
    studentData,
    loading,
    error,
    isAuthenticated,
    fetchStudentData,
    updateStudentData,
    updateStudentClass,
    clearStudentData
  };
  
  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

export default StudentContext;