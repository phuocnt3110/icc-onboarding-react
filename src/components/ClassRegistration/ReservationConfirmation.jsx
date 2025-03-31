import React from 'react';
import { Card, Typography, Button, Divider, Space, Alert, Skeleton, Row, Col, Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  InfoCircleOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { formatDate } from './utils';
import { FIELD_MAPPINGS } from '../../config';

const { Title, Text, Paragraph } = Typography;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS, RESERVATION: RESERVATION_FIELDS } = FIELD_MAPPINGS;

/**
 * Component to display reservation information and confirm
 * Used for Case 1 when student has a valid reservation
 * @param {Object} studentData - Student data from API
 * @param {Object} reservationData - Reservation data from API
 * @param {Function} onConfirm - Function to call when confirming reservation
 * @param {Function} onCancel - Function to call when canceling reservation
 * @param {boolean} loading - Loading state
 */
const ReservationConfirmation = ({ 
  studentData, 
  reservationData, 
  onConfirm, 
  onCancel,
  loading
}) => {
  // If data is still loading or not available, show skeleton
  if (loading || !studentData || !reservationData) {
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  // Check if reservation has required data
  const hasReservationData = reservationData && reservationData[RESERVATION_FIELDS.CLASS_CODE];
  
  // Format schedule for better display
  const formatScheduleDisplay = (schedule) => {
    if (!schedule) return null;
    
    // Mapping thứ để sắp xếp theo đúng thứ tự
    const weekdayOrder = {
      'Thứ 2': 1,
      'Thứ 3': 2,
      'Thứ 4': 3, 
      'Thứ 5': 4,
      'Thứ 6': 5,
      'Thứ 7': 6,
      'Chủ nhật': 7
    };
    
    // Split schedules by slash separator
    const schedules = schedule.split(' / ');
    
    // Group schedules by weekday
    const weekdaySchedules = {};
    
    schedules.forEach(item => {
      const parts = item.split(' - ');
      if (parts.length < 2) return;
      
      const weekday = parts[0];
      const timeRange = parts[1];
      
      if (!weekdaySchedules[weekday]) {
        weekdaySchedules[weekday] = [];
      }
      
      weekdaySchedules[weekday].push(timeRange);
    });
    
    // Sort weekdays by order
    const sortedWeekdays = Object.keys(weekdaySchedules).sort((a, b) => {
      return (weekdayOrder[a] || 99) - (weekdayOrder[b] || 99);
    });
    
    return (
      <table className="schedule-table">
        <tbody>
          {sortedWeekdays.map((weekday, index) => (
            <tr key={index}>
              <td className="weekday-cell">{weekday}</td>
              <td className="timeslots-cell">
                {weekdaySchedules[weekday].map((timeSlot, timeIndex) => (
                  <Tag 
                    key={timeIndex}
                    color="blue"
                    style={{ margin: '2px 4px 2px 0' }}
                  >
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    {timeSlot}
                  </Tag>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
  return (
    <Card style={{ borderRadius: '8px', marginBottom: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={5} className="card-title" style={{ margin: 0 }}>
          Xác nhận lịch học đã được giữ chỗ
        </Title>
      </div>
      <Divider />
      
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Paragraph>
            Bạn đã được giữ chỗ cho lớp học phù hợp với khóa học bạn đã đăng ký.
            Vui lòng xác nhận để hoàn tất quá trình đăng ký.
          </Paragraph>
        </div>
        
        {!hasReservationData && (
          <Alert
            message="Thông tin không đầy đủ"
            description="Thông tin giữ chỗ của bạn không đầy đủ. Bạn vẫn có thể xác nhận hoặc chọn lớp học khác."
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: '20px' }}
          />
        )}
        
        <div className="class-info-container" style={{ padding: '12px' }}>
          <Row gutter={[16, 16]}>
            {/* Course info */}
            <Col xs={24}>
              <div className="column-header" style={{ marginBottom: '10px' }}>
                <BookOutlined />
                <span>THÔNG TIN KHÓA HỌC</span>
              </div>
              
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {/* Sản phẩm */}
                <div className="info-item" style={{ padding: '8px' }}>
                  <Row>
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <BookOutlined /> Sản phẩm
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {reservationData.product || 
                         studentData[STUDENT_FIELDS.PRODUCT] || 
                         'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Trình độ bắt đầu */}
                <div className="info-item">
                  <Row>
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <BookOutlined /> Trình độ bắt đầu
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {reservationData.trinhDo || 
                         studentData[STUDENT_FIELDS.LEVEL] || 
                         'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Loại lớp */}
                <div className="info-item">
                  <Row>
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <TeamOutlined /> Loại lớp
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        <Tag color="cyan">
                          {reservationData.sizeLop || 
                           studentData[STUDENT_FIELDS.CLASS_SIZE] || 
                           'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Loại giáo viên */}
                <div className="info-item">
                  <Row>
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <UserOutlined /> Loại giáo viên
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        <Tag color="geekblue">
                          {reservationData.teacherType || 
                           studentData[STUDENT_FIELDS.TEACHER_TYPE] || 
                           'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Số buổi theo trình độ */}
                <div className="info-item">
                  <Row>
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <ClockCircleOutlined /> Số buổi
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {studentData[STUDENT_FIELDS.SESSIONS] || 
                         'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Space>
            </Col>
            
            {/* Schedule info */}
            <Col xs={24}>
              <div className="column-header" style={{ marginBottom: '10px' }}>
                <CalendarOutlined />
                <span>THÔNG TIN LỊCH HỌC</span>
              </div>
              
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {/* Mã lớp */}
                <div className="info-item">
                  <Row>
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <TeamOutlined /> Mã lớp
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        <Tag color="purple">
                          {reservationData[RESERVATION_FIELDS.CLASS_CODE] || 
                           'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Ngày khai giảng */}
                <div className="info-item">
                  <Row>
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <CalendarOutlined /> Ngày khai giảng
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {formatDate(reservationData.ngayKhaiGiangDuKien || 
                                    studentData[STUDENT_FIELDS.START_DATE]) || 
                         'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Lịch học */}
                <div className="info-item">
                  <Row>
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <CalendarOutlined /> Lịch học
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {formatScheduleDisplay(
                          reservationData.lichHoc || 
                          studentData[STUDENT_FIELDS.SCHEDULE]
                        ) || 
                          <Text type="secondary" style={{ fontWeight: 'normal' }}>Không có thông tin</Text>
                        }
                      </div>
                    </Col>
                  </Row>
                </div>
              </Space>
            </Col>
          </Row>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <Button onClick={onCancel} disabled={loading}>
            Xem danh sách các lớp khác
          </Button>
          <Button 
            type="primary" 
            onClick={onConfirm} 
            loading={loading}
          >
            Xác nhận giữ chỗ
          </Button>
        </div>
      </Space>
      
      <style jsx>{`
        .class-info-container {
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        .column-header {
          background-color: #00509f;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-weight: bold;
          margin-bottom: 12px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .info-item {
          padding: 8px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: bold;
          color: #333;
          padding: 2px 0;
          font-size: 13px;
        }
        .info-value {
          padding: 2px 0;
          font-size: 13px;
        }
        .schedule-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 4px;
        }
        .weekday-cell {
          width: 80px;
          padding-right: 12px;
          font-weight: 500;
          color: #444;
          vertical-align: top;
          padding-top: 4px;
        }
        .timeslots-cell {
          vertical-align: top;
        }
      `}</style>
    </Card>
  );
};

export default ReservationConfirmation;