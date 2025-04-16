import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Result, 
  Space, 
  Skeleton,
  Row,
  Col,
  Tag,
  Divider,
  Alert,
  Modal
} from 'antd';
import { 
  CheckCircleOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useStudent } from '../../contexts/StudentContext';
import { ROUTES } from '../../config';
import { FIELD_MAPPINGS } from '../../config';
import { useProgressStep } from '../../contexts/ProgressStepContext';
import '../../styles/index.css';

const { Title, Text, Paragraph } = Typography;

// Giúp format ngày giờ hiển thị đúng định dạng
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return dateStr;
};

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS, RESERVATION: RESERVATION_FIELDS } = FIELD_MAPPINGS;

/**
 * Component to display reservation information and confirm
 * Used for Case 1 when student has a valid reservation
 * @param {Object} student - Student data from API
 * @param {Object} reservationData - Reservation data from API
 * @param {Function} onConfirm - Function to call when confirming reservation
 * @param {Function} onCancel - Function to call when navigating to class list
 * @param {Function} onCancelReservation - Function to call when canceling reservation
 * @param {boolean} loading - Loading state
 */
const ReservationConfirmation = ({ 
  student, 
  reservationData, 
  onConfirm, 
  onCancel,
  onCancelReservation,
  loading = false
}) => {
  // State để quản lý modal xác nhận hủy
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  
  // Hiển thị modal xác nhận hủy
  const showCancelModal = () => {
    setCancelModalVisible(true);
  };
  
  // Hủy thao tác trong modal
  const handleCancelModal = () => {
    setCancelModalVisible(false);
  };
  
  // Xác nhận hủy giữ chỗ
  const handleConfirmCancel = () => {
    setCancelModalVisible(false);
    onCancelReservation();
  };
  // Không cần thao tác DOM trực tiếp nữa vì đã sử dụng ProgressStepContext

  // Truy cập context để cập nhật trạng thái thanh tiến trình
  const { goToStep } = useProgressStep();
  
  // Cập nhật trạng thái thanh tiến trình khi component mount
  useEffect(() => {
    // Đặt bước 1 (Xác nhận thông tin) là active, quay lại từ bước 2
    goToStep(1);
  }, []);
  
  // Thêm log để kiểm tra dữ liệu nhận được
  console.log('🔍 DEBUG - ReservationConfirmation nhận student:', student);
  console.log('🔍 DEBUG - Student type:', typeof student);
  console.log('🔍 DEBUG - Student fields:', student ? Object.keys(student) : 'null');
  console.log('🔍 DEBUG - STUDENT_FIELDS:', STUDENT_FIELDS);
  console.log('🔍 DEBUG - ReservationConfirmation nhận reservationData:', reservationData);
  
  // Kiểm tra cấu trúc dữ liệu student và xử lý phù hợp
  // Có thể student là object trực tiếp hoặc student.data
  const studentData = student?.hasData ? student.data : student;
  console.log('🔍 DEBUG - studentData đã xử lý:', studentData);
  
  // If data is still loading or not available, show skeleton
  if (loading) {
    console.log('🔍 DEBUG - ReservationConfirmation đang loading...');
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  // Kiểm tra xem dữ liệu student có hay không, nếu không có và cũng không có dữ liệu reservation thì mới hiển thị warning
  // Nếu có reservation data, vẫn có thể hiển thị được không cần student data
  // Thêm kiểm tra null/undefined trước khi gọi Object.keys để tránh lỗi
  const hasAnyData = (studentData && Object.keys(studentData).length > 0) || 
                    (reservationData && (reservationData.tenHocVien || reservationData.maLop || reservationData[RESERVATION_FIELDS.CLASS_CODE]));
                    
  if (!hasAnyData) {
    console.log('🔍 DEBUG - ReservationConfirmation không có dữ liệu student hay reservation');
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Result
          status="warning"
          title="Không có dữ liệu học viên hoặc giữ chỗ"
          subTitle="Vui lòng quay lại màn hình trước"
        />
      </Card>
    );
  }

  // Check if reservation has required data - check for both mapped and direct field names
  const hasReservationData = reservationData && (
    reservationData[RESERVATION_FIELDS.CLASS_CODE] || 
    reservationData.maLop ||
    reservationData.maGiuCho
  );
  
  console.log('🔍 DEBUG - hasReservationData:', hasReservationData);
  
  // Format schedule for better display
  const formatScheduleDisplay = (schedule) => {
    if (!schedule) return null;
    console.log('🔍 DEBUG - Xử lý lịch học:', schedule);
    
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
    console.log('🔍 DEBUG - Danh sách lịch học sau khi tách:', schedules);
    
    // Group schedules by weekday
    const weekdaySchedules = {};
    
    schedules.forEach(item => {
      console.log('🔍 DEBUG - Xử lý phần lịch học:', item);
      let weekday, timeRange;
      
      // Kiểm tra xem định dạng có dấu '-' hay không
      if (item.includes(' - ')) {
        // Trường hợp có dấu '-' (ví dụ: "Thứ 2 - 09:00 : 10:00")
        const parts = item.split(' - ');
        weekday = parts[0];
        timeRange = parts[1];
      } else {
        // Trường hợp không có dấu '-' (ví dụ: "Thứ 5 18:00 : 19:00")
        // Tìm chỉ số của "Thứ" trong chuỗi
        const weekdayMatch = item.match(/Thứ \d|Chủ nhật/);
        
        if (weekdayMatch && weekdayMatch.index === 0) {
          // Tách weekday (Thứ 2, Thứ 3, ...) từ phần đầu chuỗi
          weekday = weekdayMatch[0];
          // Nếu là "Thứ" (không có số), thêm số vào
          if (weekday === 'Thứ ') {
            const nextChar = item.charAt(weekdayMatch.index + 4);
            weekday = `Thứ ${nextChar}`;
          }
          
          // Lấy phần còn lại làm timeRange, loại bỏ khoảng trắng đầu tiên
          timeRange = item.substring(weekday.length).trim();
        } else {
          // Không tìm thấy định dạng thứ, bỏ qua
          console.log('🔍 DEBUG - Không nhận dạng được định dạng thứ:', item);
          return;
        }
      }
      
      console.log('🔍 DEBUG - Đã xử lý:', { weekday, timeRange });
      
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
    <Card style={{ borderRadius: '8px', marginBottom: '20px', maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={5} className="card-title" style={{ margin: 0 }}>
          Xác nhận lịch học đã được giữ chỗ
        </Title>
      </div>
      <Divider />
      
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
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
          <Row gutter={[12, 12]}>
            {/* Course info */}
            <Col xs={24}>
              <div className="column-header" style={{ marginBottom: '10px' }}>
                <BookOutlined />
                <span>THÔNG TIN KHÓA HỌC</span>
              </div>
              
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {/* Sản phẩm */}
                <div className="info-item" style={{ padding: '8px' }}>
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <BookOutlined style={{ marginRight: '5px' }} /> Sản phẩm
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {studentData && (studentData[STUDENT_FIELDS.PRODUCT] || studentData.sanPham) || 'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Trình độ bắt đầu */}
                <div className="info-item">
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <BookOutlined style={{ marginRight: '5px' }} /> Trình độ bắt đầu
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {studentData && (studentData[STUDENT_FIELDS.LEVEL] || studentData.trinhDo) || 'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Loại lớp */}
                <div className="info-item">
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <TeamOutlined style={{ marginRight: '5px' }} /> Loại lớp
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        <Tag color="cyan">
                          {studentData && (studentData[STUDENT_FIELDS.CLASS_SIZE] || studentData.loaiLop) || 'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Loại giáo viên */}
                <div className="info-item">
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <UserOutlined style={{ marginRight: '5px' }} /> Loại giáo viên
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        <Tag color="geekblue">
                          {studentData && (studentData[STUDENT_FIELDS.TEACHER_TYPE] || studentData.loaiGV) || 'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Số buổi theo trình độ */}
                <div className="info-item">
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <ClockCircleOutlined style={{ marginRight: '5px' }} /> Số buổi
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {studentData && (studentData[STUDENT_FIELDS.SESSIONS] || studentData.soBuoi) || 'Không có thông tin'}
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
              
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {/* Mã lớp */}
                <div className="info-item">
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <TeamOutlined style={{ marginRight: '5px' }} /> Mã lớp
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        <Tag color="purple">
                          {(reservationData && (reservationData[RESERVATION_FIELDS.CLASS_CODE] || reservationData.maLop))
                            ? (reservationData[RESERVATION_FIELDS.CLASS_CODE] || reservationData.maLop)
                            : 'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Ngày khai giảng */}
                <div className="info-item">
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <CalendarOutlined style={{ marginRight: '5px' }} /> Ngày khai giảng
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {formatDate((reservationData && (
                          reservationData[RESERVATION_FIELDS.START_DATE] || 
                          reservationData.ngayKhaiGiangDuKien
                        )) || 'Không có thông tin')}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Lịch học */}
                <div className="info-item">
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className="info-label">
                        <CalendarOutlined style={{ marginRight: '5px' }} /> Lịch học
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className="info-value">
                        {reservationData && (reservationData[RESERVATION_FIELDS.SCHEDULE] || reservationData.lichHoc)
                          ? formatScheduleDisplay(reservationData[RESERVATION_FIELDS.SCHEDULE] || reservationData.lichHoc)
                          : <Text type="secondary" style={{ fontWeight: 'normal' }}>Không có thông tin</Text>
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
          <Space size="small">
            <Button onClick={onCancel} disabled={loading}>
              Xem danh sách các lớp khác
            </Button>
          </Space>
          <Space size="small">
            <Button 
              danger
              onClick={showCancelModal} 
              loading={loading}
              icon={<CloseCircleOutlined />}
              style={{ marginRight: '10px' }}
            >
              Hủy giữ chỗ
            </Button>
            <Button 
              type="primary" 
              onClick={onConfirm} 
              loading={loading}
              icon={<CheckCircleOutlined />}
            >
              Xác nhận giữ chỗ
            </Button>
          </Space>
        </div>
      </Space>
      
      {/* Modal xác nhận hủy giữ chỗ */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center' }}>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
          <span>Xác nhận hủy giữ chỗ</span>
        </div>}
        open={cancelModalVisible}
        onCancel={handleCancelModal}
        footer={[
          <Button key="back" onClick={handleCancelModal}>
            Quay lại
          </Button>,
          <Button key="submit" danger onClick={handleConfirmCancel}>
            Xác nhận hủy
          </Button>,
        ]}
      >
        <div style={{ padding: '10px 0' }}>
          <Alert
            message="Lưu ý quan trọng!"
            description={
              <div>
                <p>Thao tác này sẽ <strong>không thể hoàn tác</strong> sau khi xác nhận.</p>
                <p>Bạn sẽ cần chọn lịch học khác trong danh sách lớp nếu vẫn muốn đăng ký học.</p>
              </div>
            }
            type="warning"
            showIcon
          />
        </div>
      </Modal>
      
      <style jsx>{`
        .class-info-container {
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
          max-width: 100%;
          margin: 0 auto;
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
          padding: 6px 10px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          margin-bottom: 6px;
        }
        .info-label {
          font-weight: bold;
          color: #333;
          padding: 2px 0;
          font-size: 14px;
          display: flex;
          align-items: center;
          min-height: 28px;
        }
        .info-value {
          padding: 2px 0;
          font-size: 14px;
          min-height: 28px;
          display: flex;
          align-items: center;
        }
        .schedule-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 4px;
          max-width: 100%;
        }
        .weekday-cell {
          width: 80px;
          padding-right: 12px;
          font-weight: 500;
          color: #444;
          vertical-align: top;
          padding-top: 4px;
          font-size: 14px;
        }
        .timeslots-cell {
          vertical-align: top;
          font-size: 14px;
        }
      `}</style>
      
      {/* Additional CSS to force progress steps visibility */}
      <style jsx global>{`
        /* Progress steps visibility */
        .progress-steps {
          display: flex !important;
          visibility: visible !important;
          z-index: 1000 !important;
          position: relative !important;
        }
        
        /* Ensure first step is active, not completed */
        .progress-steps .step:first-child {
          color: #00509f !important;
        }
        .progress-steps .step:first-child .circle {
          background-color: #00509f !important;
          color: white !important;
        }
        .progress-steps .step:nth-child(3) {
          color: #bfbfbf !important;
        }
        .progress-steps .step:nth-child(3) .circle {
          background-color: #f0f0f0 !important;
          color: #bfbfbf !important;
        }
        
        /* Modify main containers to be narrower */
        .form-container.class-registration-wide {
          width: 60% !important;
          max-width: 70% !important;
          padding: 0.75rem !important;
          margin-left: auto !important;
          margin-right: auto !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        /* Target the direct div child of form-container */
        .form-container.class-registration-wide > div {
          width: 100% !important;
          max-width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          flex-direction: column !important;
        }
        
        /* Target the div inside that div */
        .form-container.class-registration-wide > div > div {
          width: 100% !important;
          max-width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          flex-direction: column !important;
        }
        
        /* Override ant-card styles for this screen */
        .form-container.class-registration-wide .ant-card {
          width: 100% !important;
          max-width: 700px !important;
          margin: 0 auto !important;
        }
      `}</style>
    </Card>
  );
};

export default ReservationConfirmation;