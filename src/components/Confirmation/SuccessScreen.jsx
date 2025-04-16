import React, { useEffect } from 'react';
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
import { FIELD_MAPPINGS } from '../../config';
import { useProgressStep } from '../../contexts/ProgressStepContext';
import './SuccessScreenStyles.css';

const { Title, Text } = Typography;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

/**
 * Component to display success message after schedule selection
 * @param {Object} student - Student data with updated schedule
 * @param {Function} onChooseAgain - Function to call when choosing again
 * @param {Function} onComplete - Function to call when completing registration
 * @param {boolean} loading - Loading state
 */
const SuccessScreen = ({ 
  student, 
  onChooseAgain,
  onComplete,
  loading = false
}) => {
  // Use the progress step context
  const { completeStep, goToStep } = useProgressStep();
  
  // When success screen is shown, mark step 2 as completed
  useEffect(() => {
    completeStep(2);  // Mark step 2 as completed (turns green)
    goToStep(3);     // Set step 3 as active
  }, [completeStep, goToStep]);
  // Get appropriate course type description based on product and status
  const getCourseTypeLabel = () => {
    if (!student) return 'LỚP HỌC';
    
    const status = student[STUDENT_FIELDS.STATUS] || student.trangThaiChonLop;
    
    // Nếu có mã lớp, đây là lớp học
    if (student[STUDENT_FIELDS.CLASS_CODE] || student.maLop) {
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
  if (loading || !student) {
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }
  
  // Determine dynamic title and subtitle based on context
  const resultTitle = "Đăng ký lịch học thành công!";
  const resultSubtitle = `Bạn đã đăng ký thành công lịch học cho khóa học "${
    student.sanPham || 
    student[STUDENT_FIELDS.PRODUCT] || 
    'của bạn'
  }". Hãy kiểm tra lại một lần nữa và vui lòng lưu lại thông tin để đối chiếu sau này.`;
  
  return (
      <Card 
        className="success-screen-container"
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
      
      <div className="class-info-container" style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <Row gutter={[24, 24]}>
          {/* Left column - Course info */}
          <Col xs={24} md={12}>
            <div style={{
              backgroundColor: '#00509f',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '4px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BookOutlined />
              <span>THÔNG TIN KHÓA HỌC</span>
            </div>
            
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {/* Sản phẩm */}
              <div style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                marginBottom: '8px'
              }}>
                <Row>
                  <Col span={8}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '4px 0'
                    }}>
                      <BookOutlined /> Sản phẩm
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{
                      padding: '4px 0'
                    }}>
                      {student.sanPham || 
                       student[STUDENT_FIELDS.PRODUCT] || 
                       'Không có thông tin'}
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Trình độ bắt đầu */}
              <div style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                marginBottom: '8px'
              }}>
                <Row>
                  <Col span={8}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '4px 0'
                    }}>
                      <BookOutlined /> Trình độ bắt đầu
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{
                      padding: '4px 0'
                    }}>
                      {student.trinhDo || 
                       student[STUDENT_FIELDS.LEVEL] || 
                       'Không có thông tin'}
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Loại lớp */}
              <div style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                marginBottom: '8px'
              }}>
                <Row>
                  <Col span={8}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '4px 0'
                    }}>
                      <TeamOutlined /> Loại lớp
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{
                      padding: '4px 0'
                    }}>
                      <Tag color="cyan">
                        {student.loaiLop || 
                         student[STUDENT_FIELDS.CLASS_SIZE] || 
                         'Không có thông tin'}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Loại giáo viên */}
              <div style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                marginBottom: '8px'
              }}>
                <Row>
                  <Col span={8}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '4px 0'
                    }}>
                      <UserOutlined /> Loại giáo viên
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{
                      padding: '4px 0'
                    }}>
                      <Tag color="geekblue">
                        {student.loaiGV || 
                         student[STUDENT_FIELDS.TEACHER_TYPE] || 
                         'Không có thông tin'}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Số buổi theo trình độ */}
              <div style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                marginBottom: '8px'
              }}>
                <Row>
                  <Col span={8}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '4px 0'
                    }}>
                      <ClockCircleOutlined /> Số buổi
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{
                      padding: '4px 0'
                    }}>
                      {student.soBuoi || 
                       student[STUDENT_FIELDS.SESSIONS] || 
                       'Không có thông tin'}
                    </div>
                  </Col>
                </Row>
              </div>
            </Space>
          </Col>
          
          {/* Right column - Schedule info */}
          <Col xs={24} md={12}>
            <div style={{
              backgroundColor: '#00509f',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '4px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CalendarOutlined />
              <span>THÔNG TIN LỊCH HỌC</span>
            </div>
            
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {/* Mã lớp - Chỉ hiển thị nếu có */}
              {(student.maLop || student[STUDENT_FIELDS.CLASS_CODE]) && (
                <div style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                marginBottom: '8px'
              }}>
                  <Row>
                    <Col span={8}>
                      <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '4px 0'
                    }}>
                        <TeamOutlined /> Mã lớp
                      </div>
                    </Col>
                    <Col span={16}>
                      <div style={{
                      padding: '4px 0'
                    }}>
                        <Tag color="purple">
                          {student.maLop || 
                           student[STUDENT_FIELDS.CLASS_CODE] || 
                           'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
              
              {/* Loại lịch đăng ký */}
              <div style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                marginBottom: '8px'
              }}>
                <Row>
                  <Col span={8}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '4px 0'
                    }}>
                      <CheckCircleOutlined /> Loại lịch
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{
                      padding: '4px 0'
                    }}>
                      <Tag color="success">
                        {student.trangThaiChonLop || 
                         student[STUDENT_FIELDS.STATUS] || 
                         'Đã đăng ký'}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Lịch học */}
              <div style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                marginBottom: '8px'
              }}>
                <Row>
                  <Col span={8}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '4px 0'
                    }}>
                      <CalendarOutlined /> Lịch học
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{
                      padding: '4px 0'
                    }}>
                      {formatScheduleDisplay(
                        student.lichHoc || 
                        student[STUDENT_FIELDS.SCHEDULE]
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
      
      {/* Đã xóa các nút Chọn lại lịch học và Hoàn tất */}
      
      {/* Inline styling trực tiếp trong component */}
      <style jsx="true">{`
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
          margin-bottom: 8px;
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