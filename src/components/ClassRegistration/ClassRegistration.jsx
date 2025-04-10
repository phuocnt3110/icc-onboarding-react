import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Result, Button, message, Modal } from 'antd';
import { useStudent } from '../../contexts/StudentContext';
import { useClass } from '../../contexts/ClassContext';
import { validateScheduleSelection, validateClassSelection } from './utils';
import ReservationConfirmation from './ReservationConfirmation';
import ClassSelection from './ClassSelection';
import CustomSchedule from './CustomSchedule/index';
import SuccessScreen from './SuccessScreen';
import { MESSAGES, FIELD_MAPPINGS, ROUTES } from '../../config';

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

/**
 * Main component for class registration process
 * Handles different cases and screens based on student data
 */
const ClassRegistration = () => {
  // Use contexts
  const { 
    studentData, 
    loading: studentLoading, 
    error: studentError,
    updateStudentClass 
  } = useStudent();
  
  const {
    classList,
    reservationData,
    loading: classLoading,
    error: classError,
    currentCase,
    setCurrentCase,
    checkReservation,
    fetchAvailableClasses,
    updateClassRegistration
  } = useClass();
  
  const navigate = useNavigate();
  
  // States
  const [currentScreen, setCurrentScreen] = useState('loading'); // loading, error, reservation, classList, customSchedule, success
  const [errorMessage, setErrorMessage] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    // Get ID and direct_success from URL
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');
    const directSuccess = queryParams.get('direct_success');
    
    console.log('URL params:', {id, directSuccess});
    
    if (id) {
      // Nếu có tham số direct_success=true, chuyển thẳng đến Success Screen
      if (directSuccess === 'true') {
        console.log('direct_success=true, chuyển thẳng đến Success Screen');
        setCurrentScreen('success');
      } else {
        // Flow bình thường
        console.log('Không có direct_success hoặc không bằng true, thực hiện flow bình thường');
        loadStudentData(id);
      }
    } else {
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
      console.log('🔍 loadStudentData - Start with ID:', id);
      
      // Kiểm tra nếu đã có dữ liệu học viên
      if (!studentData || studentData[STUDENT_FIELDS.BILL_ITEM_ID] !== id) {
        // Cần tải lại dữ liệu học viên
        setCurrentScreen('loading');
      }
      
      console.log('📋 loadStudentData - Student data received:', studentData);
      console.log('🔑 loadStudentData - Checking for class code (maLop):', studentData?.[STUDENT_FIELDS.CLASS_CODE]);
      
      // Check if student has class code (maLop)
      if (studentData?.[STUDENT_FIELDS.CLASS_CODE]) {
        // Look for reservation in form_giu_cho where ma_order matches maLop
        console.log('🔎 loadStudentData - Searching for reservation with ma_order:', studentData[STUDENT_FIELDS.CLASS_CODE]);
        const foundReservation = await checkReservation(studentData[STUDENT_FIELDS.CLASS_CODE]);
        
        if (foundReservation) {
          // Reservation data will be available in context after checkReservation
          if (currentCase === 1) {
            // Case 1: Valid reservation
            setCurrentScreen('reservation');
          } else if (currentCase === 2) {
            // Case 2: Invalid reservation, proceed to Case 3 with warning
            handleCase3(studentData, true);
          }
        } else {
          // Case 2: Reservation not found, proceed to Case 3 with warning
          setCurrentCase(2);
          handleCase3(studentData, true);
        }
      } else {
        // Case 3: No reservation
        setCurrentCase(3);
        handleCase3(studentData);
      }
    } catch (error) {
      console.error('❌ loadStudentData - Error:', error);
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
    
    if (data[STUDENT_FIELDS.CLASS_SIZE] === '1:1') {
      // Case 3b: 1:1 class - show custom schedule screen
      setCurrentScreen('customSchedule');
    } else {
      // Case 3a: Non 1:1 class - fetch available classes
      try {
        // Log what we're using for debugging
        console.log('Student data for class search:', {
          sanPham: data[STUDENT_FIELDS.PRODUCT],
          sizeLop: data[STUDENT_FIELDS.CLASS_SIZE], 
          loaiGv: data[STUDENT_FIELDS.TEACHER_TYPE],
          goiMua: data[STUDENT_FIELDS.LEVEL],
        });
        
        // Check if we have minimal data to search
        if (!data[STUDENT_FIELDS.PRODUCT] && !data[STUDENT_FIELDS.LEVEL]) {
          throw new Error(MESSAGES.MISSING_COURSE_INFO);
        }
        
        // Fetch classes using context
        await fetchAvailableClasses({
          sanPham: data[STUDENT_FIELDS.PRODUCT],
          sizeLop: data[STUDENT_FIELDS.CLASS_SIZE],
          loaiGv: data[STUDENT_FIELDS.TEACHER_TYPE],
          goiMua: data[STUDENT_FIELDS.LEVEL]
        });
        
        setCurrentScreen('classList');
        
        // Show message based on the number of classes found
        if (classList.length === 0) {
          message.info(MESSAGES.NO_CLASSES_FOUND);
        } else {
          message.success(MESSAGES.CLASSES_FOUND.replace('{count}', classList.length));
        }
      } catch (error) {
        console.error('Error fetching available classes:', error);
        message.error(error.message || MESSAGES.CLASS_FETCH_ERROR);
        // Still show the class list screen, but it will display empty state
        setCurrentScreen('classList');
      }
    }
    
    if (showWarning) {
      message.warning(MESSAGES.RESERVATION_NOT_FOUND.replace(
        '{code}', 
        data[STUDENT_FIELDS.CLASS_CODE] || MESSAGES.CLASS_CODE
      ));
    }
  };
  
  /**
   * Handle class selection
   * @param {Object} selectedClass - Selected class object
   */
  const handleClassSelection = async (selectedClass) => {
    console.log("Đã nhận nút chọn");
    
    if (!selectedClass) {
      message.error(MESSAGES.SELECT_CLASS);
      return;
    }
    
    // Validate class selection
    const validationResult = validateClassSelection(studentData, selectedClass);
    if (!validationResult.valid) {
      message.error(validationResult.message);
      return;
    }
    
    setProcessingAction(true);
    
    try {
      // 1. Xử lý thông tin lịch học từ lớp được chọn
      let scheduleString = "";
      
      // Kiểm tra nếu selectedClass có thông tin về tất cả lịch học
      if (selectedClass.allSchedules && selectedClass.allSchedules.length > 0) {
        // Format lịch học: "ngayHoc1 - gioBatDau1 : gioKetThuc1 / ngayHoc2 - gioBatDau2 : gioKetThuc2 /..."
        scheduleString = selectedClass.allSchedules.map(schedule => {
          // Từ chuỗi thời gian "08:00 - 10:00", tách thành giờ bắt đầu và giờ kết thúc
          const timeParts = schedule.time.split(' - ');
          return `${schedule.weekday} - ${timeParts[0]} : ${timeParts[1]}`;
        }).join(' / ');
      } else if (selectedClass.schedules && selectedClass.schedules.length > 0) {
        // Trường hợp dự phòng, nếu có schedules nhưng không có allSchedules
        scheduleString = selectedClass.schedules.map(schedule => {
          const timeParts = schedule.time.split(' - ');
          return `${schedule.weekday} - ${timeParts[0]} : ${timeParts[1]}`;
        }).join(' / ');
      } else {
        // Trường hợp dự phòng, nếu không có schedules
        scheduleString = `${selectedClass[FIELD_MAPPINGS.CLASS.WEEKDAY]} - ${selectedClass[FIELD_MAPPINGS.CLASS.START_TIME]} : ${selectedClass[FIELD_MAPPINGS.CLASS.END_TIME]}`;
      }
      
      console.log("Lịch học đã format:", scheduleString);
      
      // 2. Cập nhật thông tin học viên
      const updateData = {
        [STUDENT_FIELDS.CLASS_CODE]: selectedClass[FIELD_MAPPINGS.CLASS.CODE],
        [STUDENT_FIELDS.SCHEDULE]: scheduleString,
        [STUDENT_FIELDS.START_DATE]: selectedClass[FIELD_MAPPINGS.CLASS.START_DATE],
        [STUDENT_FIELDS.STATUS]: "HV Chọn lịch hệ thống"
      };
      
      const updated = await updateStudentClass(studentData.Id, updateData);
      
      if (updated) {
        // 3. Cập nhật số lượng đăng ký trong bảng Class
        try {
          // Lấy mã lớp học từ selectedClass
          const classCode = selectedClass[FIELD_MAPPINGS.CLASS.CODE];
          
          if (classCode) {
            // Gọi API để cập nhật số lượng đăng ký cho tất cả bản ghi của lớp
            await updateClassRegistration(classCode);
            console.log("Đã cập nhật số lượng đăng ký cho lớp:", classCode);
          } else {
            console.warn("Không tìm thấy mã lớp, không thể cập nhật số lượng đăng ký");
          }
        } catch (classUpdateError) {
          console.error("Lỗi khi cập nhật số lượng đăng ký:", classUpdateError);
          // Vẫn tiếp tục xử lý vì đã cập nhật thành công thông tin học viên
        }
        
        // 5. Chuyển đến màn hình thành công
        setCurrentScreen('success');
        message.success(MESSAGES.CLASS_REGISTRATION_SUCCESS);
      } else {
        throw new Error(MESSAGES.CLASS_REGISTRATION_FAILED.replace('{error}', ''));
      }
    } catch (error) {
      console.error('Error updating class selection:', error);
      message.error(error.message || MESSAGES.CLASS_REGISTRATION_FAILED.replace('{error}', ''));
    } finally {
      setProcessingAction(false);
    }
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
      // Lấy các thông tin quan trọng từ reservationData
      const classCode = reservationData[FIELD_MAPPINGS.RESERVATION.CLASS_CODE];
      const schedule = reservationData.lichHoc;
      const startDate = reservationData.ngayKhaiGiangDuKien;
      
      // Update student data with complete information
      const updateData = {
        [STUDENT_FIELDS.CLASS_CODE]: classCode,
        [STUDENT_FIELDS.SCHEDULE]: schedule,
        [STUDENT_FIELDS.START_DATE]: startDate,
        [STUDENT_FIELDS.STATUS]: "HV Xác nhận lịch được giữ"
      };
      
      const updated = await updateStudentClass(studentData.Id, updateData);
      
      if (updated) {
        // Show success screen
        setCurrentScreen('success');
        message.success(MESSAGES.RESERVATION_CONFIRMATION_SUCCESS);
      } else {
        throw new Error(MESSAGES.RESERVATION_CONFIRMATION_FAILED.replace('{error}', ''));
      }
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
    
    // Format the schedule string
    const formattedSchedule = selectedSchedules.map(s => {
      if (!s.weekday || !s.time) {
        return ''; 
      }
      return `${s.weekday} - ${s.time}`;
    }).filter(s => s).join(' / ');
    
    if (!formattedSchedule) {
      setProcessingAction(false);
      message.error(MESSAGES.INVALID_SCHEDULE);
      return;
    }
    
    try {
      // Update student data
      const updateData = {
        [STUDENT_FIELDS.SCHEDULE]: formattedSchedule,
        [STUDENT_FIELDS.STATUS]: "HV Chọn lịch ngoài"
      };
      
      // Update student record
      const updated = await updateStudentClass(studentData.Id, updateData);
      
      if (updated) {
        // Show success screen
        setCurrentScreen('success');
        message.success(MESSAGES.CUSTOM_SCHEDULE_SUCCESS);
      } else {
        throw new Error(MESSAGES.CUSTOM_SCHEDULE_FAILED.replace('{error}', ''));
      }
    } catch (error) {
      console.error('Error updating custom schedule:', error);
      message.error(error.message || MESSAGES.CUSTOM_SCHEDULE_FAILED.replace('{error}', ''));
    } finally {
      setProcessingAction(false);
    }
  };
  
  /**
   * Refresh class list data from API
   */
  const refreshClassList = async () => {
    if (!studentData) {
      message.error(MESSAGES.MISSING_STUDENT_INFO);
      return;
    }
    
    try {
      await fetchAvailableClasses({
        sanPham: studentData[STUDENT_FIELDS.PRODUCT],
        sizeLop: studentData[STUDENT_FIELDS.CLASS_SIZE],
        loaiGv: studentData[STUDENT_FIELDS.TEACHER_TYPE],
        goiMua: studentData[STUDENT_FIELDS.LEVEL]
      });
      
      message.success('Đã tải lại danh sách lớp học');
      return Promise.resolve();
    } catch (error) {
      console.error('Error refreshing class list:', error);
      message.error('Không thể tải lại danh sách lớp học');
      return Promise.reject(error);
    }
  };

  /**
   * Navigate between screens
   */
  const handleSwitchToCustomSchedule = () => {
    setCurrentScreen('customSchedule');
  };

  const handleChooseAgain = () => {
    if (studentData[STUDENT_FIELDS.CLASS_SIZE] === '1:1') {
      setCurrentScreen('customSchedule');
    } else {
      setCurrentScreen('classList');
    }
  };

  const handleCancelReservation = () => {
    handleCase3(studentData);
  };

  const handleCompleteRegistration = () => {
    navigate('/');
  };

  const handleRetry = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');
    
    if (id) {
      loadStudentData(id);
    } else {
      navigate('/step-one');
    }
  };

  /**
   * Render different screens based on current state
   */
  const renderContent = () => {
    console.log('🖥️ renderContent - Current screen:', currentScreen);
    console.log('🔢 renderContent - Current case:', currentCase);

    // Show loading spinner when waiting for data
    if ((studentLoading || classLoading) && currentScreen === 'loading') {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      );
    }

    // Show error screen if there is an error
    if (currentScreen === 'error' || studentError || (classError && !classList.length)) {
      return (
        <Result
          status="error"
          title="Có lỗi xảy ra"
          subTitle={errorMessage || studentError || classError || MESSAGES.STUDENT_DATA_LOAD_ERROR}
          extra={[
            <Button key="retry" onClick={handleRetry}>
              Thử lại
            </Button>,
            <Button key="back" type="primary" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          ]}
        />
      );
    }

    switch (currentScreen) {
      case 'reservation':
        console.log('🎫 renderContent - Showing ReservationConfirmation screen');
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
            loading={processingAction || classLoading}
            onRefresh={refreshClassList}
          />
        );
      
      case 'customSchedule':
        return (
          <CustomSchedule
            studentData={studentData}
            onSubmit={handleCustomScheduleSubmit}
            onCancel={() => studentData[STUDENT_FIELDS.CLASS_SIZE] === '1:1' 
              ? navigate(-1) 
              : setCurrentScreen('classList')}
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
              <Button type="primary" onClick={() => navigate(-1)}>
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