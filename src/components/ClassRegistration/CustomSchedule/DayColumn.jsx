import React from 'react';
import { Typography, Tooltip } from 'antd';
import { calculateSlotPosition } from './utils';

const { Text } = Typography;

/**
 * Component hiển thị cột ngày và các slot đã chọn
 */
const DayColumn = ({ 
  day, 
  dayIndex, 
  timeLabels, 
  isMobile, 
  visibleSlots, 
  timeFilter, 
  isDragging,
  dragStart,
  dragCurrent,
  selectionMode,
  onMouseDown,
  onToggleCell
}) => {
  // Tính chiều cao dựa trên số lượng time labels
  const visibleHeight = timeLabels.length * 36; // 36px is timeSlotHeight
  
  // Xác định nếu cột này đang trong vùng kéo
  const isDayInDragRange = () => {
    if (!isDragging || !dragStart || !dragCurrent) return false;
    
    const minDayIndex = Math.min(dragStart.dayIndex, dragCurrent.dayIndex);
    const maxDayIndex = Math.max(dragStart.dayIndex, dragCurrent.dayIndex);
    
    return dayIndex >= minDayIndex && dayIndex <= maxDayIndex;
  };
  
  // Xử lý khi click vào slot đã chọn
  // Thay vì xóa cả khối, chúng ta sẽ toggle từng ô riêng lẻ bằng cách xác định ô chính xác
  const handleSlotClick = (e, slot) => {
    // Xác định loại sự kiện (touch hay mouse)
    const isTouch = e.type.startsWith('touch');
    console.log('DEBUG - handleSlotClick:', { eventType: e.type, isTouch });
    
    // Lấy vị trí clientY từ cả touch và mouse events
    let clientY;
    if (isTouch) {
      // Ưu tiên changedTouches cho touchend, sau đó mới đến touches
      clientY = e.changedTouches?.[0]?.clientY || e.touches?.[0]?.clientY;
      console.log('DEBUG - Touch clientY:', clientY);
      
      // Ngăn chặn sự kiện lan truyền cho touch events
      e.stopPropagation();
    } else {
      // Mouse event
      clientY = e.clientY;
      console.log('DEBUG - Mouse clientY:', clientY);
    }
    
    // Kiểm tra clientY
    if (!clientY) {
      console.error('DEBUG - Không thể xác định clientY');
      return;
    }
    
    // Lấy vị trí click tương đối với slot container
    const rect = e.currentTarget.getBoundingClientRect();
    console.log('DEBUG - Slot rect:', rect);
    
    // Xác định ô chính xác được click
    const relativeY = clientY - rect.top;
    const slotHeight = 36; // chiều cao mỗi ô
    const relativeSlotIndex = Math.floor(relativeY / slotHeight);
    
    // Tính toán ô tuyệt đối trong phạm vi slot
    const clickedSlot = slot.start + relativeSlotIndex;
    console.log('DEBUG - Vị trí slot:', { relativeY, slotHeight, relativeSlotIndex, clickedSlot });
    
    // Đảm bảo ô nằm trong phạm vi của slot
    if (clickedSlot >= slot.start && clickedSlot <= slot.end) {
      // Toggle chỉ ô được click
      console.log('DEBUG - Toggle cell:', { dayIndex, clickedSlot });
      onToggleCell(dayIndex, clickedSlot);
    }
  };
  
  // Định dạng hiển thị khung giờ để rút gọn và dễ đọc
  const formatTimeDisplay = (startTime, endTime) => {
    // Phân tách thời gian
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');
    
    // Nếu giờ giống nhau nhưng phút khác nhau, hiển thị đầy đủ
    if (startHour === endHour && startMinute !== endMinute) {
      return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
    }
    
    // Nếu giờ khác nhau, hiển thị giờ kèm phút nếu phút khác 0
    const startDisplay = startMinute === '00' ? `${startHour}h` : `${startHour}:${startMinute}`;
    const endDisplay = endMinute === '00' ? `${endHour}h` : `${endHour}:${endMinute}`;
    
    return `${startDisplay} - ${endDisplay}`;
  };
  
  return (
    <div className="day-column">
      <div className="day-header">
        <Text strong>{day}</Text>
      </div>
      <div 
        className="day-grid"
        style={{ height: `${visibleHeight}px` }}
        onMouseDown={(e) => onMouseDown(e, dayIndex)}
        onTouchStart={(e) => onMouseDown(e, dayIndex)}
        data-day-index={dayIndex}
      >
        {/* Time slot grid lines */}
        {timeLabels.map((_, index) => (
          <div
            key={`grid-${dayIndex}-${index}`}
            className="grid-line"
            style={{ top: `${index * 36}px` }}
          />
        ))}
        
        {/* Render slots */}
        {visibleSlots.map((slot, index) => {
          const top = calculateSlotPosition(slot.start, timeFilter);
          const height = (slot.end - slot.start + 1) * 36; // 36px is timeSlotHeight
          
          // Tooltip hiển thị đầy đủ thông tin khung giờ
          const tooltipTitle = `${slot.startTime} - ${slot.endTime}`;
          // Hiển thị rút gọn trong slot
          const displayText = formatTimeDisplay(slot.startTime, slot.endTime);
          
          return (
            <Tooltip
              key={`slot-${dayIndex}-${index}`}
              title={tooltipTitle}
            >
              <div
                className="schedule-slot"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                }}
                data-day-index={dayIndex}
                data-start={slot.start}
                data-end={slot.end}
                onClick={(e) => handleSlotClick(e, slot)}
                onTouchEnd={(e) => handleSlotClick(e, slot)}
              >
                <div className="slot-time">
                  {displayText}
                </div>
              </div>
            </Tooltip>
          );
        })}
        
        {/* Render drag preview */}
        {isDragging && isDayInDragRange() && (
          <div
            className={`drag-preview ${selectionMode === 1 ? 'drag-preview-select' : 'drag-preview-deselect'}`}
            style={{
              top: `${calculateSlotPosition(Math.min(dragStart.slot, dragCurrent.slot), timeFilter)}px`,
              height: `${(Math.abs(dragCurrent.slot - dragStart.slot) + 1) * 36}px`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DayColumn;