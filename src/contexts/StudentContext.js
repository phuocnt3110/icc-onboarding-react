import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchStudentData, updateStudentClass } from '../services/api/student';
import { MESSAGES, FIELD_MAPPINGS } from '../config';

// Create context
const StudentContext = createContext();

// Hook to use context
export const useStudent = () => {
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

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get billItemId from URL
        const urlParams = new URLSearchParams(window.location.search);
        const billItemId = urlParams.get('id');
        
        if (!billItemId) {
          console.error('Missing billItemId in URL');
          throw new Error(MESSAGES.MISSING_BILL_ITEM_ID);
        }
        
        console.log('Loading student data with billItemId:', billItemId);
        const data = await fetchStudentData(billItemId);
        
        if (!data) {
          console.error('No student data returned');
          throw new Error(MESSAGES.STUDENT_NOT_FOUND);
        }
        
        console.log('Student data loaded successfully:', data);
        setStudent(data);
      } catch (err) {
        console.error('Error loading student data:', err);
        setError(err.message || MESSAGES.STUDENT_DATA_LOAD_ERROR);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  const updateStudent = async (newData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!student || !student[FIELD_MAPPINGS.STUDENT.BILL_ITEM_ID]) {
        throw new Error('Missing student data or BILL_ITEM_ID');
      }
      
      // Add billItemId to update data
      const updateData = {
        ...newData,
        [FIELD_MAPPINGS.STUDENT.BILL_ITEM_ID]: student[FIELD_MAPPINGS.STUDENT.BILL_ITEM_ID]
      };
      
      console.log('Updating student data:', updateData);
      const updatedData = await updateStudentClass(updateData);
      
      if (!updatedData) {
        throw new Error('No data returned from update');
      }
      
      console.log('Student data updated successfully:', updatedData);
      setStudent(updatedData);
      return updatedData;
    } catch (err) {
      console.error('Error updating student data:', err);
      setError(err.message || MESSAGES.UPDATE_FAILED.replace('{error}', err.message));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentContext.Provider value={{ 
      student, 
      loading, 
      error, 
      updateStudent 
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export default StudentContext;