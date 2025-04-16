import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Divider, 
  Table, 
  Space, 
  Alert, 
  Skeleton,
  Input,
  Row,
  Col,
  Tooltip,
  Modal,
  message,
  Spin,
  List,
  Tag,
  Empty
} from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  CheckOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { FIELD_MAPPINGS, MESSAGES } from '../../../config';
import ScheduleGrid from './ScheduleGrid';
import SelectedSlots from './SelectedSlots';
import MobileDrawer from './MobileDrawer';
import ConfirmDialog from './ConfirmDialog';
import { 
  createEmptySchedule, 
  getScheduleList,
  getGroupedSchedule,
  hasSelectedSlots as checkHasSelectedSlots,
  formatSchedulesForSubmit,
  positionToSlot,
  optimizeBitmap,
  prioritizeSchedules,
  createCompactScheduleString,
  estimateScheduleStringLength
} from './utils';
import { 
  updateStudentSchedule, 
  saveScheduleBitmap 
} from './api';
import { updateClassRegistration, validateScheduleSelection } from '../../../services/api/class';
import '../../../styles/custom-schedule.css';
import '../../../styles/index.css';

const { Title, Text } = Typography;
const { Paragraph } = Typography;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

// Định nghĩa tên các ngày trong tuần (tiếng Việt)
// Theo bitmap: 0=Thứ 2, 1=Thứ 3, 2=Thứ 4, 3=Thứ 5, 4=Thứ 6, 5=Thứ 7, 6=Chủ nhật
const DAYS_OF_WEEK = {
  '0': 'Thứ 2',  // Monday
  '1': 'Thứ 3',  // Tuesday
  '2': 'Thứ 4',  // Wednesday
  '3': 'Thứ 5',  // Thursday
  '4': 'Thứ 6',  // Friday 
  '5': 'Thứ 7',  // Saturday
  '6': 'Chủ nhật', // Sunday
};

/**
 * Component chọn lịch học tùy chỉnh
 */
const CustomSchedule = ({ 
  student, 
  onSubmit,
  onCancel,
  loading = false,
  fromCase2 = false,
  showWarning = false
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
  const [submitConfirmVisible, setSubmitConfirmVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // Thêm state localLoading trong component chính
  const [localLoading, setLocalLoading] = useState(false);

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
  
  // Handle submit with improved error handling and optimization
  const handleSubmit = async () => {
    try {
      // Get schedule list from current bitmap
      const scheduleList = getScheduleList(schedule);
      
      if (scheduleList.length === 0) {
        setFormErrors('Vui lòng chọn ít nhất một khung giờ');
        return;
      }
      
      // Set loading state
      setLocalLoading(true);
      
      // Format the full schedule without optimization
      const scheduleText = scheduleList.map(slot => {
        return `${slot.day} - ${slot.startTime} : ${slot.endTime}`;
      }).join(' / ');
      
      // Log schedule data
      console.log('Schedule bitmap:', schedule);
      console.log('Schedule list:', scheduleList);
      console.log('Schedule text:', scheduleText);
      
      try {
        // Kiểm tra và lấy thông tin học viên
        if (!student) {
          throw new Error('Không tìm thấy thông tin học viên');
        }
        
        // Sử dụng trực tiếp biến student
        const studentObj = student;
        
        // Lấy ID học viên theo nhiều cách khác nhau
        const studentId = studentObj.Id || 
                        studentObj.id || 
                        studentObj[STUDENT_FIELDS.ID] || 
                        studentObj.billItemId || 
                        studentObj[STUDENT_FIELDS.BILL_ITEM_ID];
        
        // Lấy mã học viên hoặc billItemId cho bảng ScheduleBitmap
        const maHocVien = studentObj[STUDENT_FIELDS.MA_THEO_DOI] || 
                        studentObj.maTheoDoi || 
                        studentObj[STUDENT_FIELDS.BILL_ITEM_ID] || 
                        studentObj.billItemId || 
                        studentId; // Fallback to studentId
        
        if (!studentId) {
          throw new Error('Không tìm thấy ID học viên');
        }
        
        console.log('Thông tin học viên đã xác nhận:', { studentId, maHocVien });
        
        // Update student record with full schedule
        await updateStudentSchedule(studentId, scheduleText, "HV Chọn lịch ngoài");
        
        console.log('Successfully updated student record with schedule');
        
        // Try to save bitmap, but don't block the flow
        if (maHocVien) {
          try {
            await saveScheduleBitmap(maHocVien, schedule);
            console.log('Bitmap saved successfully');
          } catch (bitmapError) {
            console.warn('Error saving bitmap, but continuing flow:', bitmapError);
          }
        }
        
        // IMPORTANT: Create formatted data for onSubmit
        const formattedSchedules = scheduleList.map(item => ({
          weekday: item.day,
          time: `${item.startTime}-${item.endTime}`
        }));
        
        // CRITICAL: Call onSubmit to navigate to success screen
        // This will call handleCustomScheduleSubmit in ClassRegistration.jsx
        message.success('Đăng ký lịch học thành công!');
        onSubmit(formattedSchedules);
        
      } catch (error) {
        console.error('Error in API operations:', error);
        setFormErrors(error.message);
        message.error('Đăng ký lịch học thất bại: ' + error.message);
        setLocalLoading(false); // Reset loading here
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
  if (loading && !student) {
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
      </div>
      <Divider />
      
      {/* CASE 1a: Chỉ hiển thị cảnh báo cho Case 1a */}
      {showWarning && student?.[STUDENT_FIELDS.ASSIGNED_CLASS] && (
        <Alert
          message={`Bạn đã được chỉ định lớp ${student[STUDENT_FIELDS.ASSIGNED_CLASS]} nhưng mã giữ chỗ không còn hiệu lực. Vui lòng chọn lịch mới.`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
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
        style={{ width: '100%', margin: '0 auto', maxWidth: '100%' }}

        bodyStyle={{ padding: '12px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}
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
          onReset={showResetConfirm}
          onViewSelected={() => setDrawerVisible(true)}
          hasSelectedSlots={hasSelectedSlots}
          selectedCount={groupedSchedule.length}
        />
      </Card>
      
      {/* Đã xóa phần hiển thị Selected slots ở desktop theo yêu cầu */}
      
      {/* Mobile drawer */}
      <MobileDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        groupedSchedule={groupedSchedule}
        hasSelectedSlots={hasSelectedSlots}
        onDeleteSlot={handleDeleteSlot}
        onReset={showResetConfirm}
      />
      
      {/* Đã thay thế FloatButton bằng nút trong thanh công cụ */}
      
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
        <Button onClick={onCancel} disabled={loading || localLoading}>
          Quay lại
        </Button>
        <Button 
          type="primary" 
          onClick={() => {
            if (hasSelectedSlots) {
              // Log thông tin lịch để debug
              console.log('Schedule bitmap:', schedule);
              console.log('Group lịch học trước khi hiển thị modal:', groupedSchedule);
              console.log('Số lượng lịch đã chọn:', groupedSchedule.length);
              
              // Hiển thị modal với dữ liệu đã chọn
              setSubmitConfirmVisible(true);
            }
          }}
          disabled={!hasSelectedSlots || loading || localLoading}
          loading={localLoading}
        >
          Xác nhận lịch học
        </Button>
      </div>
      
      {/* Confirm Submit dialog */}
      <Modal
        title={
          <Space style={{ display: 'flex', alignItems: 'center' }}>
            <CheckOutlined style={{ color: '#52c41a' }} />
            <span>Xác nhận thông tin đăng ký</span>
          </Space>
        }
        open={submitConfirmVisible}
        onOk={handleSubmit}
        onCancel={() => setSubmitConfirmVisible(false)}
        confirmLoading={localLoading}
        okText="Xác nhận"
        cancelText="Hủy"
        width={600}
        centered
        bodyStyle={{ padding: '24px' }}
      >
        <Paragraph>
          Bạn có chắc chắn muốn đăng ký với các khung giờ đã chọn không?
        </Paragraph>
        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', marginTop: '12px', maxHeight: '350px', overflow: 'auto' }}>
          {groupedSchedule.length > 0 ? (
            <div className="schedule-confirmation-table">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <tbody>
                  {groupedSchedule.map((item, idx) => (
                    <tr key={idx} className="day-schedule-row">
                      <td className="day-name-cell">
                        <strong>{DAYS_OF_WEEK[item.day] || `Ngày ${item.day}`}</strong>
                      </td>
                      <td className="time-slots-cell">
                        {item.slots.map((slot, slotIdx) => (
                          <Tag 
                            color="blue" 
                            key={slotIdx}
                            style={{ margin: '3px 5px', fontSize: '13px', padding: '2px 8px' }}
                          >
                            {slot.startTime} - {slot.endTime}
                          </Tag>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <style jsx="true">{`
                .schedule-confirmation-table {
                  border-radius: 4px;
                  overflow: hidden;
                }
                .day-schedule-row {
                  background-color: #fafafa;
                }
                .day-schedule-row:hover {
                  background-color: #f5f5f5;
                }
                .day-name-cell {
                  width: 100px;
                  background-color: #f0f0f0;
                  padding: 8px 12px;
                  border-radius: 4px 0 0 4px;
                  text-align: right;
                  vertical-align: middle;
                }
                .time-slots-cell {
                  padding: 8px 12px;
                  border-radius: 0 4px 4px 0;
                  display: flex;
                  flex-wrap: wrap;
                }
              `}</style>
            </div>
          ) : (
            <Empty description="Chưa có khung giờ nào được chọn" />
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default CustomSchedule;