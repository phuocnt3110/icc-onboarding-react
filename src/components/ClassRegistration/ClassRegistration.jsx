import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Result, Button, message, Modal } from 'antd';
import { useStudent } from '../../contexts/StudentContext';
import { useClass } from '../../contexts/ClassContext';
import { validateScheduleSelection, validateClassSelection } from './utils';
import ReservationConfirmation from '../Confirmation/ReservationConfirmation';
import ClassSelection from './ClassSelection/ClassSelection';
import CustomSchedule from './CustomSchedule/index';
import SuccessScreen from '../Confirmation/SuccessScreen';
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
    student, 
    loading: studentLoading, 
    error: studentError,
    updateStudent,
    loadStudentData: fetchStudentDataFromContext  // Đổi tên để tránh xung đột với hàm cùng tên trong component
  } = useStudent();

  // Thêm log ở đây
  console.log('🔍 DEBUG - student từ context:', {
    hasData: !!student,
    dataType: typeof student,
    isEmpty: !student || Object.keys(student || {}).length === 0,
    data: student
  });
  
  const {
    classList,
    reservationData,
    loading: classLoading,
    error: classError,
    currentCase,
    setCurrentCase,
    checkReservation,
    loadClasses,        // Đây là hàm đúng từ context thay vì fetchAvailableClasses
    updateRegistration
  } = useClass();
  
  const navigate = useNavigate();
  
  // States
  const [currentScreen, setCurrentScreen] = useState('loading'); // loading, error, reservation, classList, customSchedule, success
  const [errorMessage, setErrorMessage] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Đồng bộ URL với màn hình hiển thị thực tế để dễ debug
  useEffect(() => {
    // Chỉ cập nhật URL khi đã tải dữ liệu và xác định màn hình
    if (currentScreen && currentScreen !== 'loading' && currentScreen !== 'error' && student?.Id) {
      const queryParams = new URLSearchParams(window.location.search);
      const existingScreen = queryParams.get('screen');
      const id = queryParams.get('id');
      
      // Nếu URL screen khác với màn hình hiện tại, cập nhật lại URL
      if (existingScreen !== currentScreen) {
        // Sử dụng billItemId thay vì Id để giữ tính nhất quán
        const billItemId = student[STUDENT_FIELDS.BILL_ITEM_ID] || id; // Sử dụng id hiện tại nếu không tìm thấy billItemId
        const newUrl = window.location.pathname + `?screen=${currentScreen}&id=${billItemId}`;
        // Sử dụng replaceState để không ảnh hưởng đến lịch sử navigation
        window.history.replaceState({}, '', newUrl);
        console.log(`🔄 Đã cập nhật URL từ screen=${existingScreen} sang screen=${currentScreen}`);
      }
    }
  }, [currentScreen, student]);

  useEffect(() => {
    // Get params from URL
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');
    
    if (!id) {
      setErrorMessage(MESSAGES.NO_ID_IN_URL);
      setCurrentScreen('error');
      return;
    }
    
    // Luồng xử lý thống nhất - không phụ thuộc vào các tham số URL khác
    console.log('Bắt đầu xử lý flow ClassRegistration dựa trên logic mới');
    
    // Thêm async IIFE để xử lý Promise từ loadStudentData
    (async () => {
      try {
        await loadStudentData(id);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu học viên:', error);
        setErrorMessage(error.message || 'Không thể tải thông tin học viên');
        setCurrentScreen('error');
      }
    })();
  }, []);
  
  /**
   * Hàm chính để tải dữ liệu học viên và xác định các trường hợp (case) hiển thị
   * @param {string} id - Bill Item ID từ URL
   * @returns {Object} - Dữ liệu học viên đã tải từ API
   */
  const loadStudentData = async (id) => {
    try {
      console.log('🔍 loadStudentData - Bắt đầu với ID:', id);
      
      // Reset error message
      setErrorMessage('');
      setCurrentScreen('loading');
      
      // Tải dữ liệu học viên
      const fetchedStudent = await fetchStudentDataFromContext(id);
      
      // Kiểm tra dữ liệu trả về từ hàm fetch
      if (!fetchedStudent) {
        console.error('❌ loadStudentData - Hàm fetchStudentData không trả về dữ liệu');
        throw new Error('Không thể tải thông tin học viên');
      }
      
      console.log('📋 loadStudentData - Dữ liệu học viên đã tải:', fetchedStudent);
      
      // CASE SUCCESS: student.trangThaiChonLop <> "HV Chưa chọn lịch"
      if (fetchedStudent[STUDENT_FIELDS.STATUS] !== 'HV Chưa chọn lịch') {
        console.log('🎯 Case SUCCESS: trangThaiChonLop khác "HV Chưa chọn lịch" - trangThaiChonLop =', 
          fetchedStudent[STUDENT_FIELDS.STATUS]);
        setCurrentScreen('success');
        return fetchedStudent;
      }
      
      // CASE NEW: student.trangThaiChonLop = "HV Chưa chọn lịch"
      console.log('🎯 Case NEW: trangThaiChonLop = "HV Chưa chọn lịch"');
      
      // Kiểm tra điều kiện cho Case 1 & Case 1a
      if (fetchedStudent[STUDENT_FIELDS.ASSIGNED_CLASS]) {
        console.log('👉 Student có maLopBanGiao:', fetchedStudent[STUDENT_FIELDS.ASSIGNED_CLASS]);
        
        // Kiểm tra reservation với maLopBanGiao
        const foundReservation = await checkReservation(fetchedStudent[STUDENT_FIELDS.ASSIGNED_CLASS]);
        
        // Case 1: maLopBanGiao có giá trị và tìm thấy reservation hợp lệ
        if (foundReservation && currentCase === 1) {
          console.log('🎯 Case 1: Tìm thấy reservation hợp lệ với mã lớp bàn giao');
          setCurrentScreen('reservation');
          return fetchedStudent;
        }
        
        // Case 1a: maLopBanGiao có giá trị nhưng không tìm thấy reservation hợp lệ
        console.log('🎯 Case 1a: Không tìm thấy reservation hợp lệ với mã lớp bàn giao');
        
        // Xác định màn hình dựa trên loại lớp
        if (fetchedStudent[STUDENT_FIELDS.CLASS_SIZE] === '1:1') {
          console.log('👉 Student có loại lớp 1:1, chuyển đến màn hình customSchedule');
          setCurrentScreen('customSchedule');
        } else {
          console.log('👉 Student có loại lớp khác 1:1, chuyển đến màn hình classSelection');
          // Load danh sách lớp học
          await loadClasses({
            sanPham: fetchedStudent[STUDENT_FIELDS.PRODUCT] || null,
            loaiLop: fetchedStudent[STUDENT_FIELDS.CLASS_SIZE] || null,
            loaiGV: fetchedStudent[STUDENT_FIELDS.TEACHER_TYPE] || null,
            trinhDo: fetchedStudent[STUDENT_FIELDS.LEVEL] || null
          });
          setCurrentScreen('classList');
        }
        
        return fetchedStudent;
      }
      
      // Case 2 và Case 3: maLopBanGiao trống
      console.log('👉 Student không có maLopBanGiao');
      
      // Case 2: maLopBanGiao trống && loaiLop = 1:1
      if (fetchedStudent[STUDENT_FIELDS.CLASS_SIZE] === '1:1') {
        console.log('🎯 Case 2: Student không có maLopBanGiao và loại lớp 1:1');
        setCurrentScreen('customSchedule');
        return fetchedStudent;
      }
      
      // Case 3: maLopBanGiao trống && loaiLop <> 1:1
      console.log('🎯 Case 3: Student không có maLopBanGiao và loại lớp khác 1:1');
      // Load danh sách lớp học
      await loadClasses({
        sanPham: fetchedStudent[STUDENT_FIELDS.PRODUCT] || null,
        loaiLop: fetchedStudent[STUDENT_FIELDS.CLASS_SIZE] || null,
        loaiGV: fetchedStudent[STUDENT_FIELDS.TEACHER_TYPE] || null,
        trinhDo: fetchedStudent[STUDENT_FIELDS.LEVEL] || null
      });
      setCurrentScreen('classList');
      
      return fetchedStudent;
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
    
    // Kiểm tra null/undefined và có thông báo lỗi rõ ràng
    if (!data) {
      console.error('❌ handleCase3 - Dữ liệu học viên trống');
      setErrorMessage('Không thể tải thông tin học viên');
      setCurrentScreen('error');
      return;
    }
    
    // Kiểm tra CLASS_SIZE với toán tử optional chaining
    const classSize = data?.[STUDENT_FIELDS.CLASS_SIZE];
    
    if (classSize === '1:1') {
      // Case 3b: 1:1 class - show custom schedule screen
      setCurrentScreen('customSchedule');
    } else {
      // Case 3a: Non 1:1 class - fetch available classes
      try {
        // Log what we're using for debugging
        console.log('Student data for class search:', {
          sanPham: data[STUDENT_FIELDS.PRODUCT] || null,
          sizeLop: data[STUDENT_FIELDS.CLASS_SIZE] || null, 
          loaiGv: data[STUDENT_FIELDS.TEACHER_TYPE] || null,
          goiMua: data[STUDENT_FIELDS.LEVEL] || null,
        });
        
        // Check if we have minimal data to search
        if (!data[STUDENT_FIELDS.PRODUCT] && !data[STUDENT_FIELDS.LEVEL]) {
          throw new Error(MESSAGES.MISSING_COURSE_INFO);
        }
        
        // Fetch classes using context
        await loadClasses({
          sanPham: data[STUDENT_FIELDS.PRODUCT] || null,
          loaiLop: data[STUDENT_FIELDS.CLASS_SIZE] || null,
          loaiGV: data[STUDENT_FIELDS.TEACHER_TYPE] || null,
          trinhDo: data[STUDENT_FIELDS.LEVEL] || null
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
    const validationResult = validateClassSelection(student, selectedClass);
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
        Id: student.Id, // Thêm ID vào updateData thay vì truyền riêng
        [STUDENT_FIELDS.CLASS_CODE]: selectedClass[FIELD_MAPPINGS.CLASS.CODE],
        [STUDENT_FIELDS.SCHEDULE]: scheduleString,
        [STUDENT_FIELDS.START_DATE]: selectedClass[FIELD_MAPPINGS.CLASS.START_DATE],
        [STUDENT_FIELDS.STATUS]: "HV Chọn lịch hệ thống"
      };
      
      console.log('Dữ liệu cập nhật học viên:', updateData);
      const updated = await updateStudent(updateData);
      
      if (updated) {
        // 3. Cập nhật số lượng đăng ký trong bảng Class
        try {
          // Lấy mã lớp học từ selectedClass
          const classCode = selectedClass[FIELD_MAPPINGS.CLASS.CODE];
          
          if (classCode) {
            // Gọi API để cập nhật số lượng đăng ký cho tất cả bản ghi của lớp
            await updateRegistration(classCode);
            console.log("Đã cập nhật số lượng đăng ký cho lớp:", classCode);
          } else {
            console.warn("Không tìm thấy mã lớp, không thể cập nhật số lượng đăng ký");
          }
        } catch (classUpdateError) {
          console.error("Lỗi khi cập nhật số lượng đăng ký:", classUpdateError);
          // Vẫn tiếp tục xử lý vì đã cập nhật thành công thông tin học viên
        }
        
        // 5. Tải lại dữ liệu học viên mới nhất trước khi chuyển màn hình
        try {
          console.log('Tải lại dữ liệu học viên sau khi cập nhật thành công');
          // Lấy billItemId từ student hiện tại
          const billItemId = student[STUDENT_FIELDS.BILL_ITEM_ID];
          // Gọi lại hàm fetchStudentData để tải dữ liệu mới nhất vào context
          const refreshedStudent = await fetchStudentDataFromContext(billItemId);
          console.log('Dữ liệu học viên đã được làm mới:', refreshedStudent);
        } catch (refreshError) {
          console.warn('Không thể tải lại dữ liệu học viên, tiếp tục với dữ liệu hiện tại', refreshError);
          // Vẫn tiếp tục vì đã cập nhật database thành công
        }
        
        // 6. Chuyển đến màn hình thành công
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
    if (!student || !student.Id || !reservationData) {
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
      
      const updated = await updateStudent(student.Id, updateData);
      
      if (updated) {
        // 3. Cập nhật số lượng đăng ký trong bảng Class
        try {
          if (classCode) {
            // Gọi API để cập nhật số lượng đăng ký cho lớp học
            await updateRegistration(classCode);
            console.log("Đã cập nhật số lượng đăng ký cho lớp:", classCode);
          } else {
            console.warn("Không tìm thấy mã lớp, không thể cập nhật số lượng đăng ký");
          }
        } catch (classUpdateError) {
          console.error("Lỗi khi cập nhật số lượng đăng ký:", classUpdateError);
          // Vẫn tiếp tục xử lý vì đã cập nhật thành công thông tin học viên
        }
        
        // Tải lại dữ liệu học viên mới nhất trước khi chuyển màn hình
        try {
          console.log('Tải lại dữ liệu học viên sau khi xác nhận reservation');
          // Lấy billItemId từ student hiện tại
          const billItemId = student[STUDENT_FIELDS.BILL_ITEM_ID];
          // Gọi lại hàm fetchStudentData để tải dữ liệu mới nhất vào context
          const refreshedStudent = await fetchStudentDataFromContext(billItemId);
          console.log('Dữ liệu học viên đã được làm mới:', refreshedStudent);
        } catch (refreshError) {
          console.warn('Không thể tải lại dữ liệu học viên sau xác nhận reservation:', refreshError);
          // Vẫn tiếp tục vì đã cập nhật database thành công
        }
        
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
    if (!student || !student.Id) {
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
      const updated = await updateStudent(student.Id, updateData);
      
      if (updated) {
        try {
          // Tải lại dữ liệu học viên từ server trước khi chuyển màn hình
          console.log('Tải lại dữ liệu học viên sau khi cập nhật lịch tùy chỉnh...');
          const billItemId = student[STUDENT_FIELDS.BILL_ITEM_ID]; 
          const refreshedStudent = await fetchStudentDataFromContext(billItemId);
          console.log('Dữ liệu học viên đã được làm mới:', refreshedStudent);
        } catch (refreshError) {
          console.warn('Lỗi khi tải lại dữ liệu học viên:', refreshError);
          // Vẫn tiếp tục với dữ liệu hiện tại
        }
        
        // Sau khi đã cố gắng làm mới dữ liệu, chuyển màn hình
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
   * Lưu ý: Đảm bảo giữ lại các điều kiện lọc ban đầu
   */
  const refreshClassList = async () => {
    if (!student) {
      message.error(MESSAGES.MISSING_STUDENT_INFO);
      return;
    }
    
    try {
      console.log("Làm mới danh sách lớp học với điều kiện lọc:", {
        sanPham: student[STUDENT_FIELDS.PRODUCT],
        loaiLop: student[STUDENT_FIELDS.CLASS_SIZE],
        loaiGV: student[STUDENT_FIELDS.TEACHER_TYPE],
        trinhDo: student[STUDENT_FIELDS.LEVEL]
      });
      
      // Sử dụng loadClasses từ context với các tham số đúng định dạng của API
      await loadClasses({
        sanPham: student[STUDENT_FIELDS.PRODUCT],
        loaiLop: student[STUDENT_FIELDS.CLASS_SIZE],
        loaiGV: student[STUDENT_FIELDS.TEACHER_TYPE],
        trinhDo: student[STUDENT_FIELDS.LEVEL]
      });
      
      message.success('Đã tải lại danh sách lớp học');
      return Promise.resolve();
    } catch (error) {
      console.error('Lỗi khi làm mới danh sách lớp học:', error);
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
    if (student[STUDENT_FIELDS.CLASS_SIZE] === '1:1') {
      setCurrentScreen('customSchedule');
    } else {
      setCurrentScreen('classList');
    }
  };

  const handleCancelReservation = () => {
    handleCase3(student);
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
            student={student}
            reservationData={reservationData}
            onConfirm={handleConfirmReservation}
            onCancel={handleCancelReservation}
            loading={processingAction}
          />
        );
        
      case 'classList':
        // Thêm log ở đây
        console.log('🔍 DEBUG - student trước khi truyền vào ClassSelection:', { 
          hasData: !!student, 
          dataType: typeof student,
          isEmpty: !student || Object.keys(student || {}).length === 0,
          studentId: student?.Id,
          productInfo: student?.[STUDENT_FIELDS.PRODUCT],
          classSize: student?.[STUDENT_FIELDS.CLASS_SIZE],
          fullData: student
        });
        return (
          <ClassSelection
            student={student}
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
            student={student}
            onSubmit={handleCustomScheduleSubmit}
            onCancel={() => student[STUDENT_FIELDS.CLASS_SIZE] === '1:1' 
              ? navigate(-1) 
              : setCurrentScreen('classList')}
            loading={processingAction}
            fromCase2={currentCase === 2}
          />
        );
      
      case 'success':
        return (
          <SuccessScreen
            student={student}
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

  // Sử dụng inline style để ghi đè toàn bộ CSS class từ theme chung
  return (
    <div 
      className="form-container class-registration-wide"
      style={{
        width: '70%',
        maxWidth: '80%',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '1rem'
      }}
    >
      {renderContent()}
    </div>
  );
};

export default ClassRegistration;