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
      <Card className={styles.card}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={5} className={styles.cardTitle}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
            Xác nhận lịch học đã được giữ chỗ
          </Title>
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
            className={styles.warningAlert}
          />
        )}
        
        <div className={styles.infoContainer}>
          <Row gutter={[12, 12]}>
            {/* Course info */}
            <Col xs={24}>
              <div className={styles.columnHeader}>
                <BookOutlined />
                <span>THÔNG TIN KHÓA HỌC</span>
              </div>
              
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {/* Sản phẩm */}
                <div className={styles.infoItem}>
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className={styles.infoLabel}>
                        <BookOutlined style={{ marginRight: '5px' }} /> Sản phẩm
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className={styles.infoValue}>
                        {studentData && (studentData[STUDENT_FIELDS.PRODUCT] || studentData.sanPham) || 'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Trình độ bắt đầu */}
                <div className={styles.infoItem}>
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className={styles.infoLabel}>
                        <BookOutlined style={{ marginRight: '5px' }} /> Trình độ bắt đầu
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className={styles.infoValue}>
                        {studentData && (studentData[STUDENT_FIELDS.LEVEL] || studentData.trinhDo) || 'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Loại lớp */}
                <div className={styles.infoItem}>
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className={styles.infoLabel}>
                        <TeamOutlined style={{ marginRight: '5px' }} /> Loại lớp
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className={styles.infoValue}>
                        <Tag color="cyan">
                          {studentData && (studentData[STUDENT_FIELDS.CLASS_SIZE] || studentData.loaiLop) || 'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Loại giáo viên */}
                <div className={styles.infoItem}>
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className={styles.infoLabel}>
                        <UserOutlined style={{ marginRight: '5px' }} /> Loại giáo viên
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className={styles.infoValue}>
                        <Tag color="geekblue">
                          {studentData && (studentData[STUDENT_FIELDS.TEACHER_TYPE] || studentData.loaiGV) || 'Không có thông tin'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Số buổi theo trình độ */}
                <div className={styles.infoItem}>
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className={styles.infoLabel}>
                        <ClockCircleOutlined style={{ marginRight: '5px' }} /> Số buổi
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className={styles.infoValue}>
                        {studentData && (studentData[STUDENT_FIELDS.SESSIONS] || studentData.soBuoi) || 'Không có thông tin'}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Space>
            </Col>
            
            {/* Schedule info */}
            <Col xs={24}>
              <div className={styles.columnHeader}>
                <CalendarOutlined />
                <span>THÔNG TIN LỊCH HỌC</span>
              </div>
              
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {/* Mã lớp */}
                <div className={styles.infoItem}>
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className={styles.infoLabel}>
                        <TeamOutlined style={{ marginRight: '5px' }} /> Mã lớp
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className={styles.infoValue}>
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
                <div className={styles.infoItem}>
                  <Row align="middle">
                    <Col span={8} xs={24} md={8}>
                      <div className={styles.infoLabel}>
                        <CalendarOutlined style={{ marginRight: '5px' }} /> Ngày khai giảng
                      </div>
                    </Col>
                    <Col span={16} xs={24} md={16}>
                      <div className={styles.infoValue}>
                        {formatDate((reservationData && (
                          reservationData[RESERVATION_FIELDS.START_DATE] || 
                          reservationData.ngayKhaiGiangDuKien
                        )) || 'Không có thông tin')}
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Lịch học - Sử dụng ScheduleDisplay component mới */}
                <div className={styles.infoItem}>
                  <Row align="middle">
                    <Col span={24}>
                      <ScheduleDisplay 
                        schedule={reservationData && (reservationData[RESERVATION_FIELDS.SCHEDULE] || reservationData.lichHoc)}
                        startDate={formatDate((reservationData && (reservationData[RESERVATION_FIELDS.START_DATE] || reservationData.ngayKhaiGiangDuKien)))}
                        compact={true}
                        showHeader={true}
                        showTeacher={true}
                        showVenue={true}
                        showClassCode={false}
                        colorScheme="pastel"
                        size="default"
                        emptyText="Không có thông tin lịch học"
                        loading={loading}
                        className={styles.scheduleDisplay}
                      />
                    </Col>
                  </Row>
                </div>
              </Space>
            </Col>
          </Row>
        </div>
        
        <div className={styles.confirmationActions}>
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
      
        </Space>
      </Card>
    </div>
  );
};

export default ReservationConfirmation;