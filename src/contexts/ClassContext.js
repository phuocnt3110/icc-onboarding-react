import React, { createContext, useState, useContext } from 'react';
import apiClient from '../services/apiClient';
import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../config';
import { useStudent } from './StudentContext';

// Tạo context
const ClassContext = createContext();

// Hook để sử dụng context
export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};

// Provider component
export const ClassProvider = ({ children }) => {
  const [classList, setClassList] = useState([]);
  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentCase, setCurrentCase] = useState(null); // Case 1, 2, or 3
  
  const { studentData } = useStudent();
  
  // Check for reservation based on class code
  const checkReservation = async (maLop) => {
    if (!maLop) {
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(
        `/tables/${TABLE_IDS.RESERVATION}/records?where=(${FIELD_MAPPINGS.RESERVATION.ORDER_CODE},allof,${maLop})`
      );
      
      if (response.data && response.data.list && response.data.list.length > 0) {
        const result = response.data.list[0];
        setReservationData(result);
        
        // Determine case based on reservation validity
        if (result[FIELD_MAPPINGS.RESERVATION.IS_VALID] === "Hợp lệ") {
          setCurrentCase(1); // Valid reservation
        } else {
          setCurrentCase(2); // Invalid reservation
        }
        
        setLoading(false);
        return result;
      }
      
      // No reservation found
      setReservationData(null);
      setCurrentCase(3); // No reservation
      setLoading(false);
      return null;
    } catch (error) {
      console.error('Error checking reservation:', error);
      setError(error.message);
      setLoading(false);
      return null;
    }
  };
  
  // Fetch available classes
  const fetchAvailableClasses = async (filters) => {
    if (!filters) {
      setError(MESSAGES.MISSING_COURSE_INFO);
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Build API filter conditions
      const apiConditions = [];
      
      if (filters.sanPham) {
        apiConditions.push(`(${FIELD_MAPPINGS.CLASS.PRODUCT},eq,${filters.sanPham})`);
      }
      
      if (filters.sizeLop) {
        apiConditions.push(`(${FIELD_MAPPINGS.CLASS.SIZE},eq,${filters.sizeLop})`);
      }
      
      if (filters.goiMua) {
        apiConditions.push(`(${FIELD_MAPPINGS.CLASS.LEVEL},eq,${filters.goiMua})`);
      }
      
      const whereClause = apiConditions.join('~and');
      
      // API parameters
      const params = { 
        limit: 100 
      };
      
      if (whereClause) {
        params.where = whereClause;
      }
      
      // Call API
      const response = await apiClient.get(`/tables/${TABLE_IDS.CLASS}/records`, { params });
      
      if (!response.data || !response.data.list) {
        setClassList([]);
        setLoading(false);
        return [];
      }
      
      const classes = response.data.list;
      
      // Apply client-side filters
      const filteredClasses = classes.filter(classItem => {
        // Status filter (Vietnamese)
        if (classItem[FIELD_MAPPINGS.CLASS.STATUS] !== 'Dự kiến khai giảng') {
          return false;
        }
        
        // Teacher type filter (Vietnamese)
        if (filters.loaiGv && classItem[FIELD_MAPPINGS.CLASS.TEACHER_TYPE] !== filters.loaiGv) {
          return false;
        }
        
        // Available slots filter (formula field)
        if (classItem[FIELD_MAPPINGS.CLASS.SLOTS_LEFT] !== undefined && 
            classItem[FIELD_MAPPINGS.CLASS.SLOTS_LEFT] <= 0) {
          return false;
        }
        
        // All conditions passed
        return true;
      });
      
      // Enhance class data with schedules for display
      const enhancedClasses = filteredClasses.map(classItem => {
        return {
          ...classItem,
          schedules: [{
            weekday: classItem[FIELD_MAPPINGS.CLASS.WEEKDAY],
            time: `${classItem[FIELD_MAPPINGS.CLASS.START_TIME]} - ${classItem[FIELD_MAPPINGS.CLASS.END_TIME]}`
          }]
        };
      });
      
      // Sort by start date and other criteria
      const sortedClasses = enhancedClasses.sort((a, b) => {
        // Sort by start date
        const dateA = a[FIELD_MAPPINGS.CLASS.START_DATE] ? new Date(a[FIELD_MAPPINGS.CLASS.START_DATE]) : new Date();
        const dateB = b[FIELD_MAPPINGS.CLASS.START_DATE] ? new Date(b[FIELD_MAPPINGS.CLASS.START_DATE]) : new Date();
        
        return dateA - dateB;
      });
      
      setClassList(sortedClasses);
      setLoading(false);
      return sortedClasses;
    } catch (error) {
      console.error('Error fetching available classes:', error);
      setError(error.message || MESSAGES.CLASS_FETCH_ERROR);
      setLoading(false);
      return [];
    }
  };
  
  // Update class registration count
  const updateClassRegistration = async (classCode) => {
    if (!classCode) {
      setError('Thiếu mã lớp học');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Find all records with the same class code
      const response = await apiClient.get(
        `/tables/${TABLE_IDS.CLASS}/records?where=(${FIELD_MAPPINGS.CLASS.CODE},eq,${classCode})`
      );
      
      if (!response.data || !response.data.list || response.data.list.length === 0) {
        setError(`Không tìm thấy lớp học với mã ${classCode}`);
        setLoading(false);
        return false;
      }
      
      const classRecords = response.data.list;
      
      // Update registration count for all records
      const updatePromises = classRecords.map(record => {
        const currentRegistered = record[FIELD_MAPPINGS.CLASS.REGISTERED] || 0;
        const newRegistered = currentRegistered + 1;
        
        return apiClient.patch(`/tables/${TABLE_IDS.CLASS}/records`, {
          Id: record.Id,
          [FIELD_MAPPINGS.CLASS.REGISTERED]: newRegistered
        });
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error updating class registration:', error);
      setError(error.message);
      setLoading(false);
      return false;
    }
  };
  
  // Clear all class data
  const clearClassData = () => {
    setClassList([]);
    setReservationData(null);
    setCurrentCase(null);
  };
  
  // Value to be provided to consumers
  const value = {
    classList,
    reservationData,
    loading,
    error,
    currentCase,
    checkReservation,
    fetchAvailableClasses,
    updateClassRegistration,
    clearClassData,
    setCurrentCase
  };
  
  return (
    <ClassContext.Provider value={value}>
      {children}
    </ClassContext.Provider>
  );
};

export default ClassContext;