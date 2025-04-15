import React from 'react';
import { Segmented } from 'antd';
import TimeColumn from './TimeColumn';
import DayColumn from './DayColumn';
import { WEEKDAYS } from './constants';
import { 
  findVisibleSlotsForDay,
  generateTimeLabels,
  filterTimeLabels
} from './utils';

/**
 * Component hiển thị lưới lịch kéo thả
 * Đã tối ưu hóa để tránh scroll ngang
 */
const ScheduleGrid = ({ 
  schedule,
  timeFilter,
  onTimeFilterChange,
  isDragging,
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
  
  // Custom filter options với nhãn rõ ràng hơn
  const filterOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Buổi sáng', value: 'morning' },
    { label: 'Buổi chiều', value: 'afternoon' },
    { label: 'Buổi tối', value: 'evening' },
  ];
  
  return (
    <div>
      {/* Time filter */}
      <div className="filter-bar" style={{ padding: '0 10px' }}>
        <Segmented
          options={filterOptions}
          value={timeFilter}
          onChange={onTimeFilterChange}
          block
        />
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
            
            return (
              <DayColumn
                key={`day-${dayIndex}`}
                day={day}
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