
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Divider, 
  Alert, 
  Space, 
  Tooltip,
  Skeleton,
  FloatButton,
  message
} from 'antd';
import { 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  ReloadOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { FIELD_MAPPINGS } from '../../../config';
import ScheduleGrid from './ScheduleGrid';
import SelectedSlots from './SelectedSlots';
import MobileDrawer from './MobileDrawer';
import ConfirmDialog from './ConfirmDialog';
import { updateStudentSchedule, saveScheduleBitmap } from './api';
import { 
  createEmptySchedule,
  getScheduleList,
  getGroupedSchedule,
  hasSelectedSlots as checkHasSelectedSlots,
  formatSchedulesForSubmit,
  positionToSlot
} from './utils';
import './CustomScheduleStyles.css';
import './LayoutAdjustments.css';

const { Title, Text, Paragraph } = Typography;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

/**
 * Component chọn lịch học tùy chỉnh
 */
const CustomSchedule = ({ 
  studentData,
  onSubmit,
  onCancel,
  loading = false,
  fromCase2 = false
}) => {
  // States
  const [schedule, setSchedule] = useState(createEmptySchedule());
  const [timeFilter, setTimeFilter] = useState('all');
  const [formErrors, setFormErrors] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [selectionMode, setSelectionMode] = useState(1); // 1: Select, 0: Deselect
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Monitor window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Kiểm tra nếu có khung giờ đã chọn
  const hasSelectedSlots = checkHasSelectedSlots(schedule);
  
  // Get grouped schedule for display
  const groupedSchedule = getGroupedSchedule(schedule);
  
  // Toggle a single cell in the schedule
  const toggleCell = (dayIndex, slotIndex) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      const dayCopy = [...newSchedule[dayIndex]];
      dayCopy[slotIndex] = dayCopy[slotIndex] === 1 ? 0 : 1;
      newSchedule[dayIndex] = dayCopy;
      return newSchedule;
    });
    
    // Clear error when user modifies schedule
    if (formErrors) {
      setFormErrors(null);
    }
  };
  
  // Handle drag start
  const handleMouseDown = (e, dayIndex) => {
    // Nếu click vào slot đã có, component DayColumn sẽ xử lý
    // bằng cách gọi onToggleCell riêng lẻ, không xử lý ở đây
    if (e.target.closest('.schedule-slot')) {
      return;
    }
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // Determine event type
    const isTouch = e.type.startsWith('touch');
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    // Get slot from position, considering time filter
    const slot = positionToSlot(clientY, rect.top, timeFilter);
    
    // Determine selection mode (select or deselect)
    const currentValue = schedule[dayIndex][slot] || 0;
    const mode = currentValue === 1 ? 0 : 1;
    setSelectionMode(mode);
    
    // Start dragging
    setIsDragging(true);
    setDragStart({ dayIndex, slot });
    setDragCurrent({ dayIndex, slot });
    
    // Prevent default for touch events to avoid scrolling
    if (isTouch) {
      e.preventDefault();
    }
  };
  
  // Handle drag move
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    // Determine event type
    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    // Get day column element from x position
    const columns = document.querySelectorAll('.day-grid');
    let targetDayIndex = dragStart.dayIndex;
    
    for (let i = 0; i < columns.length; i++) {
      const rect = columns[i].getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        targetDayIndex = i;
        break;
      }
    }
    
    // Get slot from y position
    const dayColumn = columns[targetDayIndex];
    if (!dayColumn) return;
    
    const rect = dayColumn.getBoundingClientRect();
    // Use positionToSlot with time filter
    const slot = positionToSlot(clientY, rect.top, timeFilter);
    
    // Update current drag position
    setDragCurrent({ dayIndex: targetDayIndex, slot });
    
    // Prevent default for touch events to avoid scrolling
    if (isTouch) {
      e.preventDefault();
    }
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    if (!isDragging) return;
    
    // Get range of days and slots
    const startDayIndex = Math.min(dragStart.dayIndex, dragCurrent.dayIndex);
    const endDayIndex = Math.max(dragStart.dayIndex, dragCurrent.dayIndex);
    
    const startSlot = Math.min(dragStart.slot, dragCurrent.slot);
    const endSlot = Math.max(dragStart.slot, dragCurrent.slot);
    
    // Use selection mode determined at start
    const newValue = selectionMode;
    
    // Update schedule
    setSchedule(prev => {
      const newSchedule = { ...prev };
      
      for (let dayIndex = startDayIndex; dayIndex <= endDayIndex; dayIndex++) {
        const dayCopy = [...newSchedule[dayIndex]];
        
        for (let slotIndex = startSlot; slotIndex <= endSlot; slotIndex++) {
          // Set new value
          dayCopy[slotIndex] = newValue;
        }
        
        newSchedule[dayIndex] = dayCopy;
      }
      
      return newSchedule;
    });
    
    // Reset drag state
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
    
    // Clear error when user modifies schedule
    if (formErrors) {
      setFormErrors(null);
    }
  };
  
  // Handle delete slot
  const handleDeleteSlot = (slot) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      const dayCopy = [...newSchedule[slot.dayIndex]];
      
      // Set all slots in this range to 0
      for (let i = slot.start; i <= slot.end; i++) {
        dayCopy[i] = 0;
      }
      
      newSchedule[slot.dayIndex] = dayCopy;
      return newSchedule;
    });
  };
  
  // Handle reset confirmation
  const showResetConfirm = () => {
    setResetConfirmVisible(true);
  };
  
  const handleResetConfirm = () => {
    setSchedule(createEmptySchedule());
    setResetConfirmVisible(false);
  };
  
  const handleResetCancel = () => {
    setResetConfirmVisible(false);
  };
  
  // Thêm state localLoading trong component chính
  const [localLoading, setLocalLoading] = useState(false);
  
  // Handle submit
  const handleSubmit = async () => {
    try {
      const scheduleList = getScheduleList(schedule);
      
      if (scheduleList.length === 0) {
        setFormErrors('Vui lòng chọn ít nhất một khung giờ');
        return;
      }
      
      // Sử dụng state nội bộ cho loading
      setLocalLoading(true);
      
      // 1. Tạo lịch học dạng văn bản rõ ràng
      const scheduleText = scheduleList.map(slot => {
        return `${slot.day} - ${slot.startTime} : ${slot.endTime}`;
      }).join(' / ');
      
      // Log thông tin lịch học ra console theo yêu cầu
      console.log('Schedule bitmap:', schedule);
      console.log('Schedule list:', scheduleList);
      console.log('Schedule text:', scheduleText);
      
      let success = true;
      let errorMessage = '';
      
      try {
        // Lấy mã học viên từ dữ liệu học viên
        const studentId = studentData.Id;
        const maHocVien = studentData[STUDENT_FIELDS.MA_THEO_DOI] || 
                          studentData.maTheoDoi || 
                          studentData[STUDENT_FIELDS.BILL_ITEM_ID] || 
                          studentData.billItemId;
        
        if (!studentId) {
          throw new Error('Không tìm thấy ID học viên');
        }
        
        // 2. Cập nhật lịch học văn bản vào bảng student
        try {
          await updateStudentSchedule(
            studentId, 
            scheduleText, 
            "HV Chọn lịch ngoài" // Trạng thái khi đăng ký lịch tùy chỉnh
          );
        } catch (studentUpdateError) {
          success = false;
          errorMessage = `Lỗi khi cập nhật lịch học: ${studentUpdateError.message}`;
          console.error('Error updating student schedule:', studentUpdateError);
        }
        
        // 3. Lưu bitmap lịch học vào bảng student_info nếu có mã học viên
        // Chỉ thực hiện nếu cập nhật student thành công
        if (success && maHocVien) {
          try {
            await saveScheduleBitmap(maHocVien, schedule);
          } catch (bitmapError) {
            // Không coi lưu bitmap là trọng yếu, chỉ log lỗi
            console.warn('Error saving schedule bitmap, but continuing:', bitmapError);
          }
        } else if (!maHocVien) {
          console.warn('Không tìm thấy mã theo dõi học viên, không thể lưu bitmap lịch học');
        }
        
        // 4. Nếu thành công, chuyển đến màn hình thành công
        if (success) {
          // Gọi callback để chuyển đến màn hình thành công
          onSubmit(scheduleList.map(item => ({
            weekday: item.day,
            time: `${item.startTime}-${item.endTime}`
          })));
          
          message.success('Đăng ký lịch học thành công!');
        } else {
          setFormErrors(errorMessage);
          message.error('Đăng ký lịch học thất bại!');
        }
      } catch (error) {
        console.error('Error in schedule submission process:', error);
        setFormErrors(`Lỗi xử lý: ${error.message}`);
        message.error('Đăng ký lịch học thất bại!');
      } finally {
        setLocalLoading(false);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      setFormErrors(`Lỗi xử lý: ${error.message}`);
      setLocalLoading(false);
      message.error('Đăng ký lịch học thất bại!');
    }
  };
  
  // Global mouse/touch event handlers
  useEffect(() => {
    const handleGlobalMove = (e) => {
      if (isDragging) {
        handleDragMove(e);
      }
    };
    
    const handleGlobalEnd = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);
    
    return () => {
      // Remove event listeners
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, dragStart, dragCurrent, timeFilter]);
  
  // If data is still loading, show skeleton
  if (loading && !studentData) {
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: '8px', marginBottom: '20px' }} className="custom-schedule">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} className="card-title" style={{ marginBottom: 0 }}>
          Đăng ký khung giờ học
        </Title>
        
        {!isMobile && (
          <Button 
            icon={<ReloadOutlined />}
            onClick={showResetConfirm}
            disabled={!hasSelectedSlots}
            size="small"
          >
            Thiết lập lại
          </Button>
        )}
      </div>
      <Divider />
      
      {fromCase2 && (
        <Alert
          message="Cảnh báo"
          description={`Bạn đã giữ chỗ trước đó, nhưng chúng tôi không tìm thấy ${studentData?.[STUDENT_FIELDS.CLASS_RESERVATION] || 'mã lớp'} của bạn. Vui lòng liên hệ với tư vấn viên của bạn, hoặc tiếp tục chọn lịch học theo ý muốn dưới đây.`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '20px' }}
        />
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <Alert
          message="Hướng dẫn chọn lịch: Chọn các khung giờ mà bạn có thể tham gia học tập. Chúc bạn sẽ có những trải nghiệm học tập tốt cùng ICANCONNECT"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </div>
      
      {formErrors && (
        <Alert
          message="Lỗi"
          description={formErrors}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
          closable
          onClose={() => setFormErrors(null)}
        />
      )}
      
      <Card 
        type="inner"
        extra={
          isMobile && (
            <Button 
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              size="small"
            >
              Khung giờ đã chọn
            </Button>
          )
        }
        bodyStyle={{ padding: '12px 0', width: '100%' }}
      >
        <ScheduleGrid 
          schedule={schedule}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          isDragging={isDragging}
          dragStart={dragStart}
          dragCurrent={dragCurrent}
          selectionMode={selectionMode}
          onMouseDown={handleMouseDown}
          onToggleCell={toggleCell}
          isMobile={isMobile}
        />
      </Card>
      
      {/* Selected slots (desktop only) */}
      {!isMobile && hasSelectedSlots && (
        <SelectedSlots 
          groupedSchedule={groupedSchedule}
          onDeleteSlot={handleDeleteSlot}
        />
      )}
      
      {/* Mobile drawer */}
      <MobileDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        groupedSchedule={groupedSchedule}
        hasSelectedSlots={hasSelectedSlots}
        onDeleteSlot={handleDeleteSlot}
        onReset={showResetConfirm}
      />
      
      {/* Float button for mobile */}
      {isMobile && hasSelectedSlots && !drawerVisible && (
        <FloatButton
          type="primary"
          icon={<CalendarOutlined />}
          onClick={() => setDrawerVisible(true)}
          style={{ right: 24, bottom: 74 }}
          tooltip="Khung giờ đã chọn"
        />
      )}
      
      {/* Confirm dialog */}
      <ConfirmDialog
        visible={resetConfirmVisible}
        title="Xác nhận thiết lập lại"
        content="Bạn có chắc chắn muốn xóa tất cả các khung giờ đã chọn?"
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <Button onClick={onCancel} disabled={loading}>
          Quay lại
        </Button>
        <Button 
          type="primary" 
          onClick={handleSubmit}
          disabled={!hasSelectedSlots || loading || localLoading}
          loading={localLoading}
        >
          Xác nhận lịch học
        </Button>
      </div>
    </Card>
  );
};

export default CustomSchedule;