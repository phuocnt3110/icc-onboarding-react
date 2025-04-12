import React, { createContext, useState, useContext } from 'react';
import { useStudent } from './StudentContext';
import { 
  fetchAvailableClasses, 
  updateClassRegistration,
  checkClassAvailability
} from '../services/api/class';
import { MESSAGES, FIELD_MAPPINGS } from '../config';

// Extract values from config
const { CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;

// Create context
const ClassContext = createContext();

// Hook to use context
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { studentData } = useStudent();

  // Load available classes
  const loadClasses = async (filters) => {
    try {
      setLoading(true);
      setError(null);
      const classes = await fetchAvailableClasses(filters);
      setClassList(classes);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update class registration
  const updateRegistration = async (classCode) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if class is available
      const isAvailable = await checkClassAvailability(classCode);
      if (!isAvailable) {
        throw new Error(MESSAGES.ERROR.CLASS_NOT_AVAILABLE);
      }

      // Update class registration
      await updateClassRegistration(classCode);
      
      // Update local state
      setClassList(prevList => 
        prevList.map(cls => 
          cls[CLASS_FIELDS.CODE] === classCode
            ? { ...cls, [CLASS_FIELDS.REGISTERED]: true }
            : cls
        )
      );
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear class data
  const clearClassData = () => {
    setClassList([]);
    setError(null);
  };

  return (
    <ClassContext.Provider 
      value={{ 
        classList, 
        loading, 
        error, 
        loadClasses, 
        updateRegistration,
        clearClassData
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};

export default ClassContext;