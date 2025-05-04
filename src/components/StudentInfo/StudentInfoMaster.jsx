import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useMediaQuery } from 'react-responsive';
import { StudentInfoProvider } from './context/StudentInfoContext';
import { useStudent } from '../../contexts/StudentContext';
import { useProgressStep } from '../../contexts/ProgressStepContext';
import StudentInfoSkeleton from './StudentInfoSkeleton';
import { Result, Button, Spin } from 'antd';

// Lazy load the desktop and mobile components
const StudentInfoDesktop = lazy(() => import('./StudentInfoDesktop'));
const StudentInfoMobile = lazy(() => import('./StudentInfoMobile'));

/**
 * Master component for StudentInfo
 * Determines device type and renders appropriate UI
 */
const StudentInfoMaster = () => {
  // State to track if component has mounted (for SSR compatibility)
  const [mounted, setMounted] = useState(false);
  
  // Detect mobile device - only render StudentInfoMobile when mobile UI is ready
  const isMobile = useMediaQuery({ maxWidth: 767 });
  
  // Access student context
  const { 
    student, 
    loading: studentLoading, 
    error: studentError,
    reloadStudentData: fetchStudentData
  } = useStudent();
  
  // Access progress step context
  const { 
    currentStep, 
    goToNextStep,
    goToPreviousStep
  } = useProgressStep();
  
  // Local loading state
  const [localLoading, setLocalLoading] = useState(false);
  
  // Combined loading state
  const isLoading = studentLoading || localLoading;
  
  useEffect(() => {
    // Set mounted state when component mounts
    setMounted(true);
  }, []);
  
  // If not mounted yet, return null or a placeholder
  if (!mounted) return null;
  
  // Reload student data
  const reloadStudentData = async () => {
    try {
      setLocalLoading(true);
      await fetchStudentData();
    } catch (error) {
      console.error('Error reloading student data:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        minHeight: '800px',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '1.25rem',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        <StudentInfoSkeleton />
      </div>
    );
  }

  // If error, show error message
  if (studentError) {
    return (
      <Result
        status="error"
        title="Lỗi"
        subTitle={studentError}
        extra={[
          <Button type="primary" key="retry" onClick={reloadStudentData}>
            Thử lại
          </Button>
        ]}
      />
    );
  }

  // Auto-detect device type
  const forceMobile = false; // Đã tắt chế độ bắt buộc hiển thị giao diện mobile
  
  // Clean white container styles
  const containerStyle = {
    backgroundColor: '#fff', 
    minHeight: '800px',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '1.25rem',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    position: 'relative'
  };
  
  return (
    <div style={containerStyle}>
      <StudentInfoProvider>
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '700px',
            flexDirection: 'column'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Đang tải giao diện...</div>
          </div>
        }>
          {/* For testing, we can force mobile view */}
          {(isMobile || forceMobile) ? <StudentInfoMobile /> : <StudentInfoDesktop />}
        </Suspense>
      </StudentInfoProvider>
    </div>
  );
};

export default StudentInfoMaster;
