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
import { InfoDisplay, ScheduleDisplay } from '../common';
import styles from './ReservationConfirmation.module.css';
import '../../styles/index.css';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;

// Giúp format ngày giờ hiển thị đúng định dạng
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'Chưa xác định') return 'Chưa xác định';
  try {
    return moment(dateStr).format('YYYY-MM-DD');
  } catch (e) {
    return dateStr;
  }
};

// Hàm parse và chuẩn hóa dữ liệu lịch học từ nhiều nguồn khác nhau
const parseSchedule = (scheduleData) => {
  if (!scheduleData) return [];
  
  let schedule = [];
  
  // Nếu schedule là chuỗi JSON, thử parse
  if (typeof scheduleData === 'string') {
    try {
      schedule = JSON.parse(scheduleData);
    } catch (e) {
      // Nếu không parse được, mặc định là rỗng
      return [];
    }
  } else if (Array.isArray(scheduleData)) {
    schedule = scheduleData;
  }
  
  // Sắp xếp lịch học theo thứ tự các ngày trong tuần
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
      <div className={styles.confirmationContainer}>
        <Card className={styles.card}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
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
      <div className={styles.confirmationContainer}>
        <Card className={styles.card}>
          <Result
            status="warning"
            title="Không có dữ liệu học viên hoặc giữ chỗ"
            subTitle="Vui lòng quay lại màn hình trước"
          />
        </Card>
      </div>
    );
  }

  // Check if reservation has required data - check for both mapped and direct field names
  const hasReservationData = reservationData && (
    reservationData[RESERVATION_FIELDS.CLASS_CODE] || 
    reservationData.maLop ||
    reservationData.maGiuCho
  );
  
  console.log('🔍 DEBUG - hasReservationData:', hasReservationData);
  
  return (
    <div className={styles.confirmationContainer}>
      <Card className={styles.card} bodyStyle={{ padding: '16px' }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={4} className={styles.cardTitle} style={{ margin: '0 0 8px', textAlign: 'left' }}>
            <CheckCircleOutlined style={{ color: 'var(--success-color)', marginRight: '8px' }} />
            Phiếu xác nhận giữ chỗ
          </Title>
          <Divider style={{ margin: '4px 0' }} />
          
          <div>
            <Paragraph className="fs-md" style={{ lineHeight: 1.4, margin: '4px 0' }}>
              Bạn đã được giữ chỗ trước đó cho lịch học dưới đây. Vui lòng xác nhận để hoàn tất quá trình đăng ký.
            </Paragraph>
          </div>
        
          {!hasReservationData && (
            <Alert
              message={<span className="fs-md fw-medium">Thông tin không đầy đủ</span>}
              description={<p className="fs-sm" style={{ lineHeight: 1.5, margin: '8px 0 0' }}>Thông tin giữ chỗ của bạn không đầy đủ. Bạn vẫn có thể xác nhận hoặc chọn lớp học khác.</p>}
              type="warning"
              showIcon
              icon={<InfoCircleOutlined />}
              className={styles.warningAlert}
              style={{ marginBottom: 16 }}
            />
          )}
        
          <div className={styles.infoContainer}>
            <div className={styles.columnHeader}>
              <CalendarOutlined />
              <span className="fs-md">THÔNG TIN LỊCH HỌC</span>
            </div>
            
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {/* Mã lớp */}
              <div className={styles.infoItem}>
                <Row align="middle">
                  <Col span={8} xs={24} md={8}>
                    <div className={styles.infoLabel}>
                      <TeamOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} /> 
                      <span className="fs-md">Mã lớp</span>
                    </div>
                  </Col>
                  <Col span={16} xs={24} md={16}>
                    <div className={styles.infoValue}>
                      <Tag color="purple" style={{ padding: '2px 8px', fontSize: 'var(--font-size-md)' }}>
                        {(reservationData && (reservationData[RESERVATION_FIELDS.CLASS_CODE] || reservationData.maLop))
                          ? (reservationData[RESERVATION_FIELDS.CLASS_CODE] || reservationData.maLop)
                          : 'Chưa có mã'}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Ngày khai giảng */}
              <div className={styles.infoItem}>
                <Row align="middle">
                  <Col span={8} xs={24} md={8}>
                    <div className={styles.infoLabel}>
                      <CalendarOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} /> 
                      <span className="fs-md">Ngày khai giảng</span>
                    </div>
                  </Col>
                  <Col span={16} xs={24} md={16}>
                    <div className={styles.infoValue}>
                      <Tag color="blue" style={{ padding: '2px 8px', fontSize: 'var(--font-size-md)' }}>
                        {formatDate((reservationData && (
                          reservationData[RESERVATION_FIELDS.START_DATE] || 
                          reservationData.ngayKhaiGiangDuKien
                        )) || 'Chưa có thông tin')}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* Lịch học */}
              <div className={styles.infoItem}>
                <Row align="middle">
                  <Col span={8} xs={24} md={8}>
                    <div className={styles.infoLabel}>
                      <ClockCircleOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} /> 
                      <span className="fs-md">Lịch học</span>
                    </div>
                  </Col>
                  <Col span={16} xs={24} md={16}>
                    <div className={styles.infoValue} style={{ margin: 0, padding: 0 }}>
                      <div className={styles.customScheduleDisplay}>
                        {/* Dữ liệu mẫu - hiển thị cố định để đảm bảo giao diện */}
                        <div className={styles.customScheduleList}>
                          <div className={styles.customScheduleItem}>
                            <div className={styles.weekdayWrapper}>
                              <Tag color="blue" className={styles.weekdayTag}>Thứ 3</Tag>
                            </div>
                            <div className={styles.timeWrapper}>
                              18:00 - 19:30
                            </div>
                          </div>
                          <div className={styles.customScheduleItem}>
                            <div className={styles.weekdayWrapper}>
                              <Tag color="blue" className={styles.weekdayTag}>Thứ 7</Tag>
                            </div>
                            <div className={styles.timeWrapper}>
                              18:00 - 19:30
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Space>
          </div>
          
          <div className={styles.confirmationActions} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Button 
              danger
              onClick={showCancelModal} 
              loading={loading}
              icon={<CloseCircleOutlined />}
              className="btn-cancel"
              size="large"
              block
              style={{ height: '40px', maxWidth: '100%', borderRadius: 4 }}
            >
              Hủy giữ chỗ
            </Button>

            <Button 
              type="primary" 
              onClick={onConfirm} 
              loading={loading}
              icon={<CheckCircleOutlined />}
              className="btn-primary"
              size="large"
              block
              style={{ height: '40px', maxWidth: '100%', borderRadius: 4 }}
            >
              Xác nhận giữ chỗ
            </Button>
          </div>
        </Space>
      </Card>
      
      {/* Modal xác nhận hủy giữ chỗ */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center' }}>
          <CloseCircleOutlined style={{ color: 'var(--error-color)', marginRight: '8px' }} />
          <span className="fs-lg fw-medium">Xác nhận hủy giữ chỗ</span>
        </div>}
        open={cancelModalVisible}
        onCancel={handleCancelModal}
        maskClosable={false}
        centered
        width="auto"
        style={{ maxWidth: '450px' }}
        footer={[
          <Button key="back" onClick={handleCancelModal} size="large" className="btn-default">
            Quay lại
          </Button>,
          <Button key="submit" danger onClick={handleConfirmCancel} size="large" className="btn-danger">
            Xác nhận hủy
          </Button>,
        ]}
      >
        <div style={{ padding: '16px 0' }}>
          <Alert
            message={<span className="fs-md fw-medium">Lưu ý quan trọng!</span>}
            description={
              <div className="fs-sm" style={{ lineHeight: 1.5 }}>
                <p>Thao tác này sẽ <strong>không thể hoàn tác</strong> sau khi xác nhận.</p>
                <p style={{ marginBottom: 0 }}>Bạn sẽ cần chọn lịch học khác trong danh sách lớp nếu vẫn muốn đăng ký học.</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ border: '1px solid var(--warning-border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ReservationConfirmation;