import React from 'react';
import PropTypes from 'prop-types';
import { Table, Tag, Tooltip, Typography, Space } from 'antd';
import { 
  ClockCircleOutlined, 
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import styles from './ScheduleDisplay.module.css';

const { Text } = Typography;

/**
 * Component hiển thị lịch học
 * Hỗ trợ nhiều định dạng lịch học và tùy chọn hiển thị
 */
const ScheduleDisplay = ({
  schedule,
  startDate,
  compact = false,
  showHeader = true,
  showTeacher = true,
  showVenue = true,
  showClassCode = true,
  colorScheme = 'default',
  size = 'default',
  className = '',
  emptyText = 'Chưa có lịch học nào được cài đặt',
  loading = false,
}) => {
  // Xử lý định dạng lịch học từ nhiều nguồn dữ liệu khác nhau
  const parseSchedule = () => {
    if (!schedule) return [];
    
    // Kiểm tra nếu schedule là string (dạng JSON) thì parse nó
    if (typeof schedule === 'string') {
      try {
        return JSON.parse(schedule);
      } catch (error) {
        console.error('Invalid schedule format:', error);
        // Nếu là chuỗi và không parse được JSON, xử lý như text thông thường
        return parseTextSchedule(schedule);
      }
    }
    
    // Nếu là array sẵn thì trả về luôn
    if (Array.isArray(schedule)) {
      return schedule;
    }
    
    // Trường hợp khác, trả về mảng trống
    return [];
  };
  
  // Xử lý lịch học ở dạng text thuần
  const parseTextSchedule = (textSchedule) => {
    // Cắt chuỗi theo dòng hoặc dấu phẩy
    const lines = textSchedule.split(/[,\n]/);
    const result = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Thử xử lý các định dạng phổ biến
      // Ví dụ: "Thứ 2: 18:30-20:30" hoặc "Thứ 2 (18:30-20:30)" hoặc "T2: 18:30-20:30"
      const dayRegex = /(Thứ|T)\s?([2-8]|Hai|Ba|Tư|Năm|Sáu|Bảy|CN)[\s:-]+(\d{1,2}[:h]\d{1,2})[\s-]+(\d{1,2}[:h]\d{1,2})/i;
      const match = trimmedLine.match(dayRegex);
      
      if (match) {
        // Map ngày thứ từ chuỗi sang định dạng chuẩn 
        let weekday = match[2];
        if (weekday === 'Hai' || weekday === '2') weekday = 'Thứ 2';
        if (weekday === 'Ba' || weekday === '3') weekday = 'Thứ 3';
        if (weekday === 'Tư' || weekday === '4') weekday = 'Thứ 4';
        if (weekday === 'Năm' || weekday === '5') weekday = 'Thứ 5';
        if (weekday === 'Sáu' || weekday === '6') weekday = 'Thứ 6';
        if (weekday === 'Bảy' || weekday === '7') weekday = 'Thứ 7';
        if (weekday === 'CN' || weekday === '8') weekday = 'Chủ nhật';
        
        result.push({
          weekday,
          startTime: match[3],
          endTime: match[4]
        });
      } else {
        // Nếu không match định dạng standard, thêm dưới dạng note
        result.push({
          note: trimmedLine
        });
      }
    });
    
    return result;
  };
  
  // Sắp xếp lịch học theo thứ tự ngày trong tuần
  const sortScheduleByWeekday = (schedule) => {
    const weekdayOrder = {
      'Thứ 2': 1,
      'Thứ 3': 2, 
      'Thứ 4': 3,
      'Thứ 5': 4,
      'Thứ 6': 5,
      'Thứ 7': 6,
      'Chủ nhật': 7,
      'CN': 7
    };
    
    return [...schedule].sort((a, b) => {
      const orderA = weekdayOrder[a.weekday] || 10;
      const orderB = weekdayOrder[b.weekday] || 10;
      return orderA - orderB;
    });
  };
  
  // Xử lý hiển thị tag màu cho lịch học
  const getWeekdayTag = (weekday) => {
    const colorMap = {
      default: {
        'Thứ 2': 'blue',
        'Thứ 3': 'cyan',
        'Thứ 4': 'green',
        'Thứ 5': 'lime',
        'Thứ 6': 'gold', 
        'Thứ 7': 'orange',
        'Chủ nhật': 'red',
        'CN': 'red'
      },
      primary: {
        'Thứ 2': 'blue',
        'Thứ 3': 'blue',
        'Thứ 4': 'blue',
        'Thứ 5': 'blue',
        'Thứ 6': 'blue',
        'Thứ 7': 'blue',
        'Chủ nhật': 'blue',
        'CN': 'blue'
      }
    };
    
    const color = colorMap[colorScheme]?.[weekday] || 'blue';
    return (
      <Tag color={color} className={styles.weekdayTag}>{weekday}</Tag>
    );
  };
  
  // Định dạng hiển thị lịch học compact
  const renderCompactSchedule = () => {
    const parsedSchedule = parseSchedule();
    if (!parsedSchedule.length) return <Text type="secondary">{emptyText}</Text>;
    
    const sortedSchedule = sortScheduleByWeekday(parsedSchedule);
    
    return (
      <div className={styles.compactSchedule}>
        {sortedSchedule.map((item, index) => {
          if (item.note) {
            return (
              <div key={`note-${index}`} className={styles.scheduleNote}>
                <InfoCircleOutlined className={styles.noteIcon} />
                <Text type="secondary">{item.note}</Text>
              </div>
            );
          }
          
          return (
            <div key={`day-${index}`} className={styles.scheduleItem}>
              <div className={styles.scheduleItemContent}>
                <div className={styles.dayColumn}>
                  {getWeekdayTag(item.weekday)}
                </div>
                <div className={styles.detailsColumn}>
                  <Text className={styles.timeRange}>
                    {item.startTime} - {item.endTime}
                  </Text>
                  {(showVenue && item.venue) || (showTeacher && item.teacher) ? (
                    <div className={styles.extraInfo}>
                      {showVenue && item.venue && (
                        <Text type="secondary" className={styles.venue}>
                          <EnvironmentOutlined className={styles.venueIcon} />
                          {item.venue}
                        </Text>
                      )}
                      {showTeacher && item.teacher && (
                        <Text type="secondary" className={styles.teacher}>
                          <UserOutlined className={styles.teacherIcon} />
                          {item.teacher}
                        </Text>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        
        {startDate && (
          <div className={styles.startDate}>
            <CalendarOutlined className={styles.calendarIcon} />
            <Text>Khai giảng: {startDate}</Text>
          </div>
        )}
      </div>
    );
  };
  
  // Định dạng hiển thị lịch học dạng bảng
  const renderTableSchedule = () => {
    const parsedSchedule = parseSchedule();
    const sortedSchedule = sortScheduleByWeekday(parsedSchedule);
    
    const columns = [
      {
        title: 'Thứ',
        dataIndex: 'weekday',
        key: 'weekday',
        render: (text) => text ? getWeekdayTag(text) : null,
      },
      {
        title: 'Thời gian',
        dataIndex: 'time',
        key: 'time',
        render: (_, record) => (
          record.startTime && record.endTime ? (
            <Space>
              <ClockCircleOutlined className={styles.timeIcon} />
              {`${record.startTime} - ${record.endTime}`}
            </Space>
          ) : record.note
        ),
      }
    ];
    
    if (showVenue) {
      columns.push({
        title: 'Địa điểm',
        dataIndex: 'venue',
        key: 'venue',
        render: (text) => text ? (
          <Tooltip title={text}>
            <Space>
              <EnvironmentOutlined />
              {text.length > 15 ? `${text.slice(0, 15)}...` : text}
            </Space>
          </Tooltip>
        ) : null,
      });
    }
    
    if (showTeacher) {
      columns.push({
        title: 'Giáo viên',
        dataIndex: 'teacher',
        key: 'teacher',
        render: (text) => text ? (
          <Space>
            <UserOutlined />
            {text}
          </Space>
        ) : null,
      });
    }
    
    return (
      <div className={styles.tableSchedule}>
        <Table
          dataSource={sortedSchedule}
          columns={columns}
          pagination={false}
          size={size}
          rowKey={(record, index) => `schedule-${index}`}
          locale={{ emptyText }}
          loading={loading}
          className={styles.scheduleTable}
        />
        
        {startDate && (
          <div className={styles.startDateInfo}>
            <Space>
              <CalendarOutlined className={styles.calendarIcon} />
              <span>Khai giảng: <strong>{startDate}</strong></span>
            </Space>
          </div>
        )}
      </div>
    );
  };
  
  // Lấy class name dựa vào kích thước
  const getContainerClassName = () => {
    const classes = [styles.container, className];
    
    if (size === 'small') classes.push(styles.small);
    if (size === 'large') classes.push(styles.large);
    
    return classes.join(' ');
  };
  
  return (
    <div className={getContainerClassName()}>
      {showHeader && (
        <div className={styles.header}>
          <Space align="center">
            <CalendarOutlined className={styles.headerIcon} />
            <Text strong className={styles.headerText}>Lịch học</Text>
          </Space>
          {showClassCode && (
            <div className={styles.classCode}>
              <Text type="secondary">Mã lớp: {schedule?.classCode}</Text>
            </div>
          )}
        </div>
      )}
      
      <div className={styles.content}>
        {compact ? renderCompactSchedule() : renderTableSchedule()}
      </div>
    </div>
  );
};

ScheduleDisplay.propTypes = {
  schedule: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.shape({
      weekday: PropTypes.string,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      venue: PropTypes.string,
      teacher: PropTypes.string,
      note: PropTypes.string
    }))
  ]),
  startDate: PropTypes.string,
  compact: PropTypes.bool,
  showHeader: PropTypes.bool,
  showTeacher: PropTypes.bool,
  showVenue: PropTypes.bool,
  showClassCode: PropTypes.bool,
  colorScheme: PropTypes.oneOf(['default', 'pastel', 'monochrome']),
  size: PropTypes.oneOf(['small', 'default', 'large']),
  className: PropTypes.string,
  emptyText: PropTypes.string,
  loading: PropTypes.bool
};

export default ScheduleDisplay;
