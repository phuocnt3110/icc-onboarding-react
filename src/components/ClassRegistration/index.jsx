import React, { useState, useEffect } from 'react';
import { Spin, Result, Button, message } from 'antd';
import { fetchStudentData, checkReservation, fetchAvailableClasses, updateStudentClass } from './api';
import { processClassList, formatSchedule, validateScheduleSelection, validateClassSelection } from './utils';
import ReservationConfirmation from './ReservationConfirmation';
import ClassSelection from './ClassSelection';
import CustomSchedule from './CustomSchedule';
import SuccessScreen from './SuccessScreen';

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
    // Get student ID from URL
    const queryParams = new URLSearchParams(window.location.search);
    const studentId = queryParams.get('id');
    
    if (studentId) {
      loadStudentData(studentId);
    } else {
      setLoading(false);
      setErrorMessage('Không tìm thấy mã học viên trong URL. Vui lòng kiểm tra lại đường dẫn.');
      setCurrentScreen('error');
    }
  }, []);

  /**
   * Main function to load student data and determine the case
   * @param {string} studentId - Student ID from URL
   */
  const loadStudentData = async (studentId) => {
    try {
      setLoading(true);
      
      // Fetch student data
      const data = await fetchStudentData(studentId);
      setStudentData(data);
      
      console.log('Student data:', data);
      
      // Check if student has maLopBanGiao
      if (data.maLopBanGiao) {
        // Look for reservation in form_giu_cho
        const reservation = await checkReservation(data.maLopBanGiao);
        
        if (reservation) {
          if (reservation.maCheckHopLe === true) {
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
      setErrorMessage(error.message || 'Lỗi khi tải dữ liệu học viên');
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
    
    if (data.size === '1:01') {
      // Case 3b: 1:1 class - show custom schedule screen
      setCurrentScreen('customSchedule');
      setLoading(false);
    } else {
      // Case 3a: Non 1:1 class - fetch available classes
      try {
        // Validate required fields before fetching classes
        if (!data.tenSanPham || !data.size || !data.loaiGiaoVien || !data.trinhDo) {
          throw new Error('Thiếu thông tin học viên cần thiết: khóa học, loại lớp, giáo viên, hoặc trình độ');
        }
        
        const classesData = await fetchAvailableClasses({
          tenSanPham: data.tenSanPham,
          size: data.size,
          loaiGiaoVien: data.loaiGiaoVien,
          trinhDo: data.trinhDo
        });
        
        // Process and group classes with the same code
        const processedClasses = processClassList(classesData);
        setClassList(processedClasses);
        setCurrentScreen('classList');
        
        // Show message if no classes found
        if (processedClasses.length === 0) {
          message.info('Không tìm thấy lớp học phù hợp. Bạn có thể chọn lịch học theo ý muốn.');
        }
      } catch (error) {
        console.error('Error fetching available classes:', error);
        message.error(error.message || 'Lỗi khi tải danh sách lớp học');
        // Still show the class list screen, but it will display empty state
        setCurrentScreen('classList');
      } finally {
        setLoading(false);
      }
    }
    
    if (showWarning) {
      message.warning(`Bạn đã giữ chỗ trước đó, nhưng chúng tôi không tìm thấy ${data.maLopBanGiao || 'mã lớp'} của bạn. Vui lòng liên hệ với tư vấn viên của bạn, hoặc tiếp tục chọn lịch học theo danh sách dưới đây.`);
    }
  };

  /**
   * Handle class selection
   * @param {Object} selectedClass - Selected class object
   */
  const handleClassSelection = async (selectedClass) => {
    if (!selectedClass) {
      message.error('Vui lòng chọn một lớp học');
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
      // Format the schedule string
      const formattedSchedule = formatSchedule(selectedClass.schedules);
      
      if (!formattedSchedule) {
        throw new Error('Lịch học không hợp lệ');
      }
      
      // Update student data
      await updateStudentClass(studentData.Id, {
        maLop: selectedClass.Classcode,
        lichHoc: formattedSchedule,
        ngayKhaiGiangDuKien: selectedClass.Start_date,
        trangThai: "Đã xác nhận lịch"
      });
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        maLop: selectedClass.Classcode,
        lichHoc: formattedSchedule,
        ngayKhaiGiangDuKien: selectedClass.Start_date,
        trangThai: "Đã xác nhận lịch"
      }));
      
      // Show success screen
      setCurrentScreen('success');
      message.success('Đăng ký lớp học thành công!');
    } catch (error) {
      console.error('Error updating class selection:', error);
      message.error(error.message || 'Lỗi khi đăng ký lớp học');
    } finally {
      setProcessingAction(false);
    }
  };

  /**
   * Confirm reservation
   */
  const handleConfirmReservation = async () => {
    if (!studentData || !studentData.Id || !reservationData) {
      message.error('Thiếu thông tin để xác nhận giữ chỗ');
      return;
    }
    
    setProcessingAction(true);
    
    try {
      // Update student data to confirm reservation
      await updateStudentClass(studentData.Id, {
        trangThai: "Đã xác nhận lịch được giữ"
      });
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        trangThai: "Đã xác nhận lịch được giữ"
      }));
      
      // Show success screen
      setCurrentScreen('success');
      message.success('Xác nhận lịch học thành công!');
    } catch (error) {
      console.error('Error confirming reservation:', error);
      message.error(error.message || 'Lỗi khi xác nhận lịch học');
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
      message.error('Thiếu thông tin học viên');
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
        throw new Error('Lịch học không hợp lệ');
      }
      
      // Update student data
      await updateStudentClass(studentData.Id, {
        lichHoc: formattedSchedule,
        trangThai: "Đăng ký lịch ngoài"
      });
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        lichHoc: formattedSchedule,
        trangThai: "Đăng ký lịch ngoài"
      }));
      
      // Show success screen
      setCurrentScreen('success');
      message.success('Đăng ký lịch học thành công!');
    } catch (error) {
      console.error('Error updating custom schedule:', error);
      message.error(error.message || 'Lỗi khi đăng ký lịch học');
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
    if (studentData.size === '1:01') {
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
    const studentId = queryParams.get('id');
    
    if (studentId) {
      loadStudentData(studentId);
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
            onCancel={() => studentData.size === '1:01' ? window.history.back() : setCurrentScreen('classList')}
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