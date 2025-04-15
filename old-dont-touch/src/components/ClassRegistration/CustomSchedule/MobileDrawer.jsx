import React from 'react';
import { Modal, Button, Typography, Tag } from 'antd';
import { WEEKDAYS } from './constants';

const { Text } = Typography;

/**
 * Component hiển thị drawer các slot đã chọn trên thiết bị di động
 */
const MobileDrawer = ({ 
  visible, 
  onClose, 
  groupedSchedule, 
  hasSelectedSlots,
  onDeleteSlot,
  onReset
}) => {
  return (
    <Modal
      title="Khung giờ đã chọn"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button 
          key="reset" 
          onClick={onReset} 
          disabled={!hasSelectedSlots}
        >
          Làm mới
        </Button>,
        <Button 
          key="close" 
          onClick={onClose}
        >
          Đóng
        </Button>
      ]}
      className="mobile-drawer"
    >
      {!hasSelectedSlots ? (
        <Text>Chưa có khung giờ nào được chọn</Text>
      ) : (
        <>
          {WEEKDAYS.map((day, index) => {
            const daySlots = groupedSchedule[day] || [];
            if (daySlots.length === 0) return null;
            
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <Text strong>{day}</Text>
                <div className="slot-tags" style={{ marginTop: '8px' }}>
                  {daySlots.map((slot) => (
                    <Tag
                      key={`mobile-tag-${slot.id}`}
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
        </>
      )}
    </Modal>
  );
};

export default MobileDrawer;