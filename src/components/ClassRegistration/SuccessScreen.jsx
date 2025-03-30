import React from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Result, 
  Space, 
  Skeleton,
  Row,
  Col,
  Tag
} from 'antd';
import { 
  CheckCircleOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { formatDate } from './utils';
import { FIELD_MAPPINGS } from '../../config';

const { Title, Text } = Typography;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

/**
 * Component to display success message after schedule selection
 * @param {Object} studentData - Student data with updated schedule
 * @param {Function} onChooseAgain - Function to call when choosing again
 * @param {Function} onComplete - Function to call when completing registration
 * @param {boolean} loading - Loading state
 */
const SuccessScreen = ({ 
  studentData, 
  onChooseAgain,
  onComplete,
  loading = false
}) => {
  // Get appropriate course type description based on product and status
  const getCourseTypeLabel = () => {
    if (!studentData) return 'LỚP HỌC';
    
    const status = studentData[STUDENT_FIELDS.STATUS] || studentData.trangThaiChonLop;
    
    // Nếu có mã lớp, đây là lớp học
    if (studentData[STUDENT_FIELDS.CLASS_CODE] || studentData.maLop) {
      return 'LỚP HỌC';
    }
    
    // Nếu là đăng ký lịch tùy chỉnh
    if (status === "HV Chọn lịch ngoài") {
      return 'LỊCH HỌC';
    }
    
    // Nếu là xác nhận giữ chỗ
    if (status === "Đã xác nhận lịch được giữ") {
      return 'KHÓA HỌC';
    }
    
    // Mặc định
    return 'KHÓA HỌC';
  };
  
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
    
    // Formatting weekday display
    const formatWeekday = (weekday) => {
      return weekday;
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
              <td className="weekday-cell">{formatWeekday(weekday)}</td>
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
  
  // If data is still loading, show skeleton
  if (loading || !studentData) {
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }
  
  // Determine dynamic title and subtitle based on context
  const resultTitle = "Đăng ký lịch học thành công!";
  const resultSubtitle = `Bạn đã đăng ký thành công lịch học cho khóa học "${
    studentData.sanPham || 
    studentData[STUDENT_FIELDS.PRODUCT] || 
    'của bạn'
  }". Hãy kiểm tra lại thông tin một lần nữa và vui lòng giữ lại thông tin để đối chiếu sau này.`;
  
  return (
    <Card 
      style={{ 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}
    >
      <Result
        status="success"
        title={<div style={{ fontWeight: "bold", fontSize: "24px", color: "#52c41a" }}>{resultTitle}</div>}
        subTitle={<div style={{ fontWeight: "600", fontSize: "16px" }}>{resultSubtitle}</div>}
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
      />
      
      <Title level={4} style={{ textAlign: 'center', margin: '24px 0', color: '#00509f' }}>
        <Space>
          <BookOutlined />
          <span>THÔNG TIN {getCourseTypeLabel()} CỦA BẠN</span>
        </Space>
      </Title>
      
      <div className="class-info-container">
        <Row gutter={[24, 24]}>
          {/* Left column - Course info */}
          <Col xs={24} md={12}>
            <div className="column-header">
              <BookOutlined />
              <span>THÔNG TIN KHÓA HỌC</span>
            </div>
            
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {/* Sản phẩm */}
              <div className="info-item">
                <Row>
                  <Col span={8}>
                    <div className="info-label">
                      <BookOutlined /> Sản phẩm
                    </div>
                  </Col>
                  <Col span={16}>
                    <div className="info-value">
                      {studentData.sanPham || 
                       studentData[STUDENT_FIELDS.PRODUCT] || 
                       'Không có thông tin'}
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Trình độ bắt đầu */}
              <div className="info-item">
                <Row>
                  <Col span={8}>
                    <div className="info-label">
                      <BookOutlined /> Trình độ bắt đầu
                    </div>
                  </Col>
                  <Col span={16}>
                    <div className="info-value">
                      {studentData.goiMua || 
                       studentData[STUDENT_FIELDS.PACKAGE] || 
                       'Không có thông tin'}
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Loại lớp */}
              <div className="info-item">
                <Row>
                  <Col span={8}>
                    <div className="info-label">
                      <TeamOutlined /> Loại lớp
                    </div>
                  </Col>
                  <Col span={16}>
                    <div className="info-value">
                      <Tag color="cyan">
                        {studentData.sizeLop || 
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
                  <Col span={8}>
                    <div className="info-label">
                      <UserOutlined /> Loại giáo viên
                    </div>
                  </Col>
                  <Col span={16}>
                    <div className="info-value">
                      <Tag color="geekblue">
                        {studentData.loaiGv || 
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
                  <Col span={8}>
                    <div className="info-label">
                      <ClockCircleOutlined /> Số buổi
                    </div>
                  </Col>
                  <Col span={16}>
                    <div className="info-value">
                      {studentData.soBuoi || 
                       studentData[STUDENT_FIELDS.SESSIONS] || 
                       'Không có thông tin'}
                    </div>
                  </Col>
                </Row>
              </div>
            </Space>
          </Col>
          
          {/* Right column - Schedule info */}
          <Col xs={24} md={12}>
            <div className="column-header">
              <CalendarOutlined />
              <span>THÔNG TIN LỊCH HỌC</span>
            </div>
            
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {/* Mã lớp - Chỉ hiển thị nếu có */}
              {(studentData.maLop || studentData[STUDENT_FIELDS.CLASS_CODE]) && (
                <div className="info-item">
                  <Row>
                    <Col span={8}>
                      <div className="info-label">
                        <TeamOutlined /> Mã lớp
                      </div>
                    </Col>
                    <Col span={16}>
                      <div className="info-value">
                        <Tag color="purple">
                          {studentData.maLop || 
                           studentData[STUDENT_FIELDS.CLASS_CODE] || 
                           'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
              
              {/* Loại lịch đăng ký */}
              <div className="info-item">
                <Row>
                  <Col span={8}>
                    <div className="info-label">
                      <CheckCircleOutlined /> Loại lịch
                    </div>
                  </Col>
                  <Col span={16}>
                    <div className="info-value">
                      <Tag color="success">
                        {studentData.trangThaiChonLop || 
                         studentData[STUDENT_FIELDS.STATUS] || 
                         'Đã đăng ký'}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Lịch học */}
              <div className="info-item">
                <Row>
                  <Col span={8}>
                    <div className="info-label">
                      <CalendarOutlined /> Lịch học
                    </div>
                  </Col>
                  <Col span={16}>
                    <div className="info-value">
                      {formatScheduleDisplay(
                        studentData.lichHoc || 
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
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Button 
          onClick={onChooseAgain}
          icon={<CalendarOutlined />}
          size="large"
        >
          Chọn lại lịch
        </Button>
      </div>
      
      <style jsx>{`
        .class-info-container {
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        .column-header {
          background-color: #00509f;
          color: white;
          padding: 10px 16px;
          border-radius: 4px;
          font-weight: bold;
          margin-bottom: 16px;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .info-item {
          padding: 10px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }
        .info-label {
          font-weight: bold;
          color: #333;
          padding: 4px 0;
        }
        .info-value {
          padding: 4px 0;
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

export default SuccessScreen;