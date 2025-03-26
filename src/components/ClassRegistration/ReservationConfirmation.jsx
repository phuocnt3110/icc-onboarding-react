import React from 'react';
import { Card, Typography, Button, Divider, Descriptions, Space, Alert, Skeleton } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
  
  return (
    <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
      <Title level={5} className="card-title">
        Xác nhận lịch học đã được giữ chỗ
      </Title>
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
        
        <Card 
          type="inner" 
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span>Thông tin lớp học</span>
            </Space>
          }
          style={{ marginBottom: '20px' }}
        >
          <Descriptions column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label="Mã lớp" span={2}>
              {reservationData[RESERVATION_FIELDS.CLASS_CODE] || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Tên khóa học" span={2}>
              {studentData[STUDENT_FIELDS.PACKAGE] || studentData[STUDENT_FIELDS.PRODUCT] || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Loại lớp">
              {studentData[STUDENT_FIELDS.CLASS_SIZE] || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Giáo viên">
              {studentData[STUDENT_FIELDS.TEACHER_TYPE] || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Trình độ">
              {studentData[STUDENT_FIELDS.LEVEL] || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Số buổi">
              {studentData[STUDENT_FIELDS.SESSIONS] || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Lịch học" span={2}>
              {studentData[STUDENT_FIELDS.SCHEDULE] || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Ngày khai giảng" span={2}>
              {formatDate(studentData[STUDENT_FIELDS.START_DATE]) || 'Không có thông tin'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <Button onClick={onCancel} disabled={loading}>
            Chọn lịch khác
          </Button>
          <Button 
            type="primary" 
            onClick={onConfirm} 
            loading={loading}
          >
            Xác nhận lịch học
          </Button>
        </div>
      </Space>
    </Card>
  );
};

export default ReservationConfirmation;