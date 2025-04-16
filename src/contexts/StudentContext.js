import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchStudentData, updateStudentClass } from '../services/api/student';
import { MESSAGES, FIELD_MAPPINGS } from '../config';

// Create context
const StudentContext = createContext();

// Hook to use context
export const useStudent = () => {
  console.log('🔍 DEBUG - useStudent được gọi từ StudentContext.js');
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

// Provider component
export const StudentProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load student data function
  const loadStudentData = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[DEBUG] Fetching student data for ID:', id);
      const data = await fetchStudentData(id);
      
      if (!data) {
        throw new Error('No student data returned');
      }
      
      console.log('[DEBUG] Successfully fetched student data:', data);
      setStudent(data);
      return data; // Return data for immediate use
    } catch (err) {
      console.error('[DEBUG] Error loading student data:', err);
      setError(err.message || 'Failed to load student data');
      return null;
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // Update student data
  const updateStudent = async (updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!student || !student.Id) {
        throw new Error('Missing student data or ID');
      }
      
      // Lấy BILL_ITEM_ID từ URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const billItemId = urlParams.get('id');
      
      if (!billItemId) {
        throw new Error('Missing billItemId in URL parameters');
      }
      
      // Ensure ID and billItemId are included (FIELD_MAPPINGS.STUDENT.BILL_ITEM_ID = "billItemId")
      const dataToUpdate = {
        ...updateData,
        Id: student.Id,
        billItemId: billItemId // Tên trường đúng cần là chữ thường (từ FIELD_MAPPINGS)
      };
      
      console.log('[DEBUG] Updating student data with BILL_ITEM_ID:', billItemId, dataToUpdate);
      const updatedData = await updateStudentClass(dataToUpdate);
      
      if (!updatedData) {
        throw new Error('No data returned from update');
      }
      
      console.log('[DEBUG] Student data updated successfully:', updatedData);
      setStudent(updatedData);
      return updatedData;
    } catch (err) {
      console.error('[DEBUG] Error updating student data:', err);
      setError(err.message || MESSAGES.UPDATE_FAILED.replace('{error}', err.message));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const billItemId = urlParams.get('id');
    
    if (billItemId) {
      loadStudentData(billItemId);
    } else {
      setLoading(false);
      setIsInitialized(true);
      setError('Missing billItemId in URL');
    }
  }, []);

  return (
    <StudentContext.Provider value={{ 
      student, 
      loading, 
      error, 
      isInitialized,
      loadStudentData,
      updateStudent
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export default StudentContext;