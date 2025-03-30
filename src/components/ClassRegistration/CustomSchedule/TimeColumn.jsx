import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

/**
 * Component hiển thị cột thời gian
 */
const TimeColumn = ({ timeLabels }) => {
  return (
    <div className="time-column">
      <div className="time-header">
        <Text strong>Giờ</Text>
      </div>
      <div className="time-slots">
        {timeLabels.map((label, index) => (
          <div key={`time-${index}`} className="time-slot-cell">
            <Text>{label}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeColumn;