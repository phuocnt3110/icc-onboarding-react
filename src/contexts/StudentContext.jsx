import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchStudentData, updateStudentData, clearStudentCache } from '../api/student';

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: student, isLoading, error } = useQuery(
    'student',
    () => fetchStudentData(studentId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: 1000,
    }
  );

  const updateStudentMutation = useMutation(
    (data) => updateStudentData(studentId, data),
    {
      onSuccess: (data) => {
        queryClient.setQueryData('student', data);
        message.success('Cập nhật thông tin thành công');
      },
      onError: (error) => {
        message.error('Cập nhật thông tin thất bại');
      },
    }
  );

  const reloadStudentData = async () => {
    clearStudentCache(studentId);
    await queryClient.invalidateQueries('student');
  };

  const value = {
    student,
    loading: isLoading,
    error,
    updateStudent: updateStudentMutation.mutate,
    loadStudentData: reloadStudentData,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}; 