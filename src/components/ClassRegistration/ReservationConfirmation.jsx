import React from 'react';
import { Card, Typography, Button, Divider, Descriptions, Space, Alert, Skeleton } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { formatDate } from './utils';

const { Title, Text, Paragraph } = Typography;

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
  const hasReservationData = reservationData && reservationData.ma_lop;
  
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
              {reservationData?.ma_lop || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Tên khóa học" span={2}>
              {studentData?.tenSanPham || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Loại lớp">
              {studentData?.size || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Giáo viên">
              {studentData?.loaiGiaoVien || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Trình độ">
              {studentData?.trinhDo || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Số buổi">
              {studentData?.soBuoi || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Lịch học" span={2}>
              {studentData?.lichHoc || 'Không có thông tin'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Ngày khai giảng" span={2}>
              {formatDate(studentData?.ngayKhaiGiangDuKien) || 'Không có thông tin'}
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