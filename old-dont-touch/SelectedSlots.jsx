import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { WEEKDAYS } from './constants';

const { Text } = Typography;

/**
 * Component hiển thị danh sách các slot đã chọn
 */
const SelectedSlots = ({ groupedSchedule, onDeleteSlot }) => {
  return (
    <Card 
      className="selected-slots-card" 
      title="Danh sách khung giờ đã chọn" 
      size="small"
    >
      {WEEKDAYS.map((day, index) => {
        const daySlots = groupedSchedule[day] || [];
        if (daySlots.length === 0) return null;
        
        return (
          <div key={`list-${index}`} className="day-slots">
            <Text strong>{day}:</Text>
            <div className="slot-tags">
              {daySlots.map((slot) => (
                <Tag
                  key={`tag-${slot.id}`}
                  color="blue"
                  closable
                  onClose={() => onDeleteSlot(slot)}
                >
                  {slot.startTime} - {slot.endTime}
                </Tag>
              ))}
            </div>
          </div>
        );
      })}
    </Card>
  );
};

export default SelectedSlots;