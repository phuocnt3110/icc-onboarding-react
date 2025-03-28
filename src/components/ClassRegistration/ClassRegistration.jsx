import React, { useState, useEffect } from 'react';
import { Spin, Result, Button, message } from 'antd';
import { fetchStudentData, checkReservation, fetchAvailableClasses, updateStudentClass } from './api';
import { formatSchedule, validateScheduleSelection, validateClassSelection } from './utils';
import ReservationConfirmation from './ReservationConfirmation';
import ClassSelection from './ClassSelection';
import CustomSchedule from './CustomSchedule';
import SuccessScreen from './SuccessScreen';
import { MESSAGES, FIELD_MAPPINGS } from '../../config';

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

/**
 * Main component for class registration process
 * Handles different cases and screens based on student data
 */
const ClassRegistration = () => {
  // States
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState({});
  const [reservationData, setReservationData] = useState(null);
  const [classList, setClassList] = useState([]);
  const [currentCase, setCurrentCase] = useState(null); // Case 1, 2, or 3
  const [currentScreen, setCurrentScreen] = useState('loading'); // loading, error, reservation, classList, customSchedule, success
  const [errorMessage, setErrorMessage] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    // Get ID from URL
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');
    
    if (id) {
      loadStudentData(id);
    } else {
      setLoading(false);
      setErrorMessage(MESSAGES.NO_ID_IN_URL);
      setCurrentScreen('error');
    }
  }, []);

  /**
   * Main function to load student data and determine the case
   * @param {string} id - Bill Item ID from URL
   */
  const loadStudentData = async (id) => {
    try {
      setLoading(true);
      
      // Fetch student data with billItemId
      const data = await fetchStudentData(id);
      setStudentData(data);
      
      console.log('Student data:', data);
      
      // Check if student has class reservation code
      if (data[STUDENT_FIELDS.CLASS_RESERVATION]) {
        // Look for reservation in form_giu_cho
        const reservation = await checkReservation(data[STUDENT_FIELDS.CLASS_RESERVATION]);
        
        if (reservation) {
          if (reservation[FIELD_MAPPINGS.RESERVATION.IS_VALID] === true) {
            // Case 1: Valid reservation
            setReservationData(reservation);
            setCurrentCase(1);
            setCurrentScreen('reservation');
          } else {
            // Case 2: Invalid reservation
            setReservationData(reservation);
            setCurrentCase(2);
            // Proceed to Case 3 with warning
            handleCase3(data, true);
          }
        } else {
          // Case 2: Reservation not found
          setCurrentCase(2);
          // Proceed to Case 3 with warning
          handleCase3(data, true);
        }
      } else {
        // Case 3: No reservation
        handleCase3(data);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      setLoading(false);
      setErrorMessage(error.message || MESSAGES.STUDENT_DATA_LOAD_ERROR);
      setCurrentScreen('error');
    }
  };

  /**
   * Handle Case 3: No reservation or invalid reservation
   * @param {Object} data - Student data
   * @param {boolean} showWarning - Whether to show warning about invalid reservation
   */
  const handleCase3 = async (data, showWarning = false) => {
    setCurrentCase(3);
    
    if (data[STUDENT_FIELDS.CLASS_SIZE] === '1:01') {
      // Case 3b: 1:1 class - show custom schedule screen
      setCurrentScreen('customSchedule');
      setLoading(false);
    } else {
      // Case 3a: Non 1:1 class - fetch available classes
      try {
        // Log what we're using for debugging
        console.log('Student data for class search:', {
          sanPham: data[STUDENT_FIELDS.PRODUCT],
          sizeLop: data[STUDENT_FIELDS.CLASS_SIZE], 
          loaiGv: data[STUDENT_FIELDS.TEACHER_TYPE],
          goiMua: data[STUDENT_FIELDS.PACKAGE],
        });
        
        // Check if we have minimal data to search
        if (!data[STUDENT_FIELDS.PRODUCT] && !data[STUDENT_FIELDS.PACKAGE]) {
          throw new Error(MESSAGES.MISSING_COURSE_INFO);
        }
        
        const classesData = await fetchAvailableClasses({
          sanPham: data[STUDENT_FIELDS.PRODUCT],
          sizeLop: data[STUDENT_FIELDS.CLASS_SIZE],
          loaiGv: data[STUDENT_FIELDS.TEACHER_TYPE],
          goiMua: data[STUDENT_FIELDS.PACKAGE]
        });
        
        // Set classes list directly without grouping
        setClassList(classesData);
        setCurrentScreen('classList');
        
        // Show message if no classes found
        if (classesData.length === 0) {
          message.info(MESSAGES.NO_CLASSES_FOUND);
        } else {
          message.success(MESSAGES.CLASSES_FOUND.replace('{count}', classesData.length));
        }
      } catch (error) {
        console.error('Error fetching available classes:', error);
        message.error(error.message || MESSAGES.CLASS_FETCH_ERROR);
        // Still show the class list screen, but it will display empty state
        setCurrentScreen('classList');
      } finally {
        setLoading(false);
      }
    }
    
    if (showWarning) {
      message.warning(MESSAGES.RESERVATION_NOT_FOUND.replace(
        '{code}', 
        data[STUDENT_FIELDS.CLASS_RESERVATION] || MESSAGES.CLASS_CODE
      ));
    }
  };

  /**
   * Handle class selection
   * @param {Object} selectedClass - Selected class object
   */
  const handleClassSelection = async (selectedClass) => {
    console.log("Đã nhận nút chọn");
    // Đã xóa toàn bộ xử lý tác vụ cũ
  };

  /**
   * Confirm reservation
   */
  const handleConfirmReservation = async () => {
    if (!studentData || !studentData.Id || !reservationData) {
      message.error(MESSAGES.MISSING_RESERVATION_INFO);
      return;
    }
    
    setProcessingAction(true);
    
    try {
      // Update student data to confirm reservation
      await updateStudentClass(studentData.Id, {
        [STUDENT_FIELDS.STATUS]: "Đã xác nhận lịch được giữ"
      });
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        [STUDENT_FIELDS.STATUS]: "Đã xác nhận lịch được giữ"
      }));
      
      // Show success screen
      setCurrentScreen('success');
      message.success(MESSAGES.RESERVATION_CONFIRMATION_SUCCESS);
    } catch (error) {
      console.error('Error confirming reservation:', error);
      message.error(error.message || MESSAGES.RESERVATION_CONFIRMATION_FAILED.replace('{error}', ''));
    } finally {
      setProcessingAction(false);
    }
  };

  /**
   * Handle custom schedule submission
   * @param {Array} selectedSchedules - Array of selected schedule objects
   */
  const handleCustomScheduleSubmit = async (selectedSchedules) => {
    if (!studentData || !studentData.Id) {
      message.error(MESSAGES.MISSING_STUDENT_INFO);
      return;
    }
    
    // Validate schedule selection
    const validationResult = validateScheduleSelection(selectedSchedules);
    if (!validationResult.valid) {
      message.error(validationResult.message);
      return;
    }
    
    setProcessingAction(true);
    
    try {
      // Format the schedule string
      const formattedSchedule = formatSchedule(selectedSchedules);
      
      if (!formattedSchedule) {
        throw new Error(MESSAGES.INVALID_SCHEDULE);
      }
      
      // Update student data
      await updateStudentClass(studentData.Id, {
        [STUDENT_FIELDS.SCHEDULE]: formattedSchedule,
        [STUDENT_FIELDS.STATUS]: "Đăng ký lịch ngoài"
      });
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        [STUDENT_FIELDS.SCHEDULE]: formattedSchedule,
        [STUDENT_FIELDS.STATUS]: "Đăng ký lịch ngoài"
      }));
      
      // Show success screen
      setCurrentScreen('success');
      message.success(MESSAGES.CUSTOM_SCHEDULE_SUCCESS);
    } catch (error) {
      console.error('Error updating custom schedule:', error);
      message.error(error.message || MESSAGES.CUSTOM_SCHEDULE_FAILED.replace('{error}', ''));
    } finally {
      setProcessingAction(false);
    }
  };

  /**
   * Navigate between screens
   */
  const handleSwitchToCustomSchedule = () => {
    setCurrentScreen('customSchedule');
  };

  const handleChooseAgain = () => {
    if (studentData[STUDENT_FIELDS.CLASS_SIZE] === '1:01') {
      setCurrentScreen('customSchedule');
    } else {
      setCurrentScreen('classList');
    }
  };

  const handleCancelReservation = () => {
    handleCase3(studentData);
  };

  const handleCompleteRegistration = () => {
    window.location.href = '/';
  };

  const handleRetry = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');
    
    if (id) {
      loadStudentData(id);
    } else {
      window.location.href = '/step-one';
    }
  };

  /**
   * Render different screens based on current state
   */
  const renderContent = () => {
    switch (currentScreen) {
      case 'loading':
        return (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <Spin size="large" tip="Đang tải thông tin..." />
          </div>
        );
      
      case 'error':
        return (
          <Result
            status="error"
            title="Có lỗi xảy ra"
            subTitle={errorMessage}
            extra={[
              <Button key="retry" onClick={handleRetry}>
                Thử lại
              </Button>,
              <Button key="back" type="primary" onClick={() => window.history.back()}>
                Quay lại
              </Button>
            ]}
          />
        );
      
      case 'reservation':
        return (
          <ReservationConfirmation
            studentData={studentData}
            reservationData={reservationData}
            onConfirm={handleConfirmReservation}
            onCancel={handleCancelReservation}
            loading={processingAction}
          />
        );
      
      case 'classList':
        return (
          <ClassSelection
            studentData={studentData}
            classList={classList}
            showWarning={currentCase === 2}
            onClassSelect={handleClassSelection}
            onSwitchToCustomSchedule={handleSwitchToCustomSchedule}
            loading={processingAction}
          />
        );
      
      case 'customSchedule':
        return (
          <CustomSchedule
            studentData={studentData}
            onSubmit={handleCustomScheduleSubmit}
            onCancel={() => studentData[STUDENT_FIELDS.CLASS_SIZE] === '1:01' ? window.history.back() : setCurrentScreen('classList')}
            loading={processingAction}
            fromCase2={currentCase === 2}
          />
        );
      
      case 'success':
        return (
          <SuccessScreen
            studentData={studentData}
            onChooseAgain={handleChooseAgain}
            onComplete={handleCompleteRegistration}
            loading={processingAction}
          />
        );
      
      default:
        return (
          <Result
            status="info"
            title="Đang phát triển"
            subTitle="Tính năng đặt lịch học đang được phát triển"
            extra={
              <Button type="primary" onClick={() => window.history.back()}>
                Quay lại
              </Button>
            }
          />
        );
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {renderContent()}
    </div>
  );
};

export default ClassRegistration;