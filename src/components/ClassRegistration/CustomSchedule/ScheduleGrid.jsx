import React from 'react';
import { Segmented, Button, Tooltip } from 'antd';
import { ReloadOutlined, CalendarOutlined } from '@ant-design/icons';
import TimeColumn from './TimeColumn';
import DayColumn from './DayColumn';
import { WEEKDAYS } from './constants';
import { 
  findVisibleSlotsForDay,
  generateTimeLabels,
  filterTimeLabels
} from './utils';
import { TIME_FILTERS_SHORT, WEEKDAYS_SHORT } from './constants';

/**
 * Component hiển thị lưới lịch kéo thả
 * Đã tối ưu hóa để tránh scroll ngang
 */
const ScheduleGrid = ({ 
  schedule,
  timeFilter,
  onTimeFilterChange,
  isDragging,
  onReset,
  onViewSelected,
  hasSelectedSlots,
  selectedCount = 0,
  dragStart,
  dragCurrent,
  selectionMode,
  onMouseDown,
  onToggleCell,
  isMobile
}) => {
  // Tạo và lọc nhãn thời gian
  const allTimeLabels = generateTimeLabels();
  const visibleTimeLabels = filterTimeLabels(allTimeLabels, timeFilter);
  
  // Lựa chọn bộ lọc dựa trên kích thước màn hình
  const filterOptions = isMobile ? TIME_FILTERS_SHORT : [
    { label: 'Tất cả', value: 'all' },
    { label: 'Buổi sáng', value: 'morning' },
    { label: 'Buổi chiều', value: 'afternoon' },
    { label: 'Buổi tối', value: 'evening' },
  ];
  
  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      {/* Time filter with reset button */}
      <div className="filter-bar">
        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Segmented
              options={filterOptions}
              value={timeFilter}
              onChange={onTimeFilterChange}
              block
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {onViewSelected && isMobile && (
              <Tooltip title="Khung giờ đã chọn">
                <Button 
                  icon={<CalendarOutlined />}
                  onClick={onViewSelected}
                  size="small"
                  type="text"
                  style={{ 
                    color: '#00509f',
                    marginLeft: '5px',
                    position: 'relative',
                    minWidth: isMobile ? '32px' : 'auto',
                    padding: isMobile ? '0 8px' : 'auto'
                  }}
                  disabled={!hasSelectedSlots}
                >
                  {!isMobile && "Khung giờ đã chọn"}
                  {selectedCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '0px',
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      borderRadius: '10px',
                      padding: '0 6px',
                      fontSize: '12px',
                      lineHeight: '16px',
                      fontWeight: 'bold'
                    }}>
                      {selectedCount}
                    </span>
                  )}
                </Button>
              </Tooltip>
            )}

            {onReset && (
              <Tooltip title="Thiết lập lại">
                <Button 
                  className="reset-button"
                  icon={<ReloadOutlined />}
                  onClick={onReset}
                  style={{ 
                    marginLeft: '10px', 
                    color: '#00509f', 
                    borderColor: '#00509f',
                    minWidth: isMobile ? '32px' : 'auto',
                    padding: isMobile ? '0 8px' : 'auto'
                  }}
                  disabled={!hasSelectedSlots}
                >
                  {!isMobile && "Thiết lập lại"}
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      
      {/* Schedule grid - stretch to full container width */}
      <div className="schedule-container" style={{ overflow: 'hidden' }}>
        <div className="schedule-grid" style={{ width: '100%' }}>
          {/* Time column */}
          <TimeColumn timeLabels={visibleTimeLabels} />
          
          {/* Day columns - divided equally */}
          {WEEKDAYS.map((day, dayIndex) => {
            // Tìm các slot hiển thị cho ngày này
            const visibleSlots = findVisibleSlotsForDay(schedule, dayIndex, timeFilter);
            // Sử dụng tên rút gọn cho màn hình nhỏ
            const displayDay = isMobile ? WEEKDAYS_SHORT[dayIndex] : day;
            
            return (
              <DayColumn
                key={`day-${dayIndex}`}
                day={displayDay}
                dayIndex={dayIndex}
                timeLabels={visibleTimeLabels}
                isMobile={isMobile}
                visibleSlots={visibleSlots}
                timeFilter={timeFilter}
                isDragging={isDragging}
                dragStart={dragStart}
                dragCurrent={dragCurrent}
                selectionMode={selectionMode}
                onMouseDown={onMouseDown}
                onToggleCell={onToggleCell}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;