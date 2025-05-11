import React from 'react';
import { Modal, Button, Typography, Divider, Space } from 'antd';
import { PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useStudentInfo } from '../context/StudentInfoContext';

const { Title, Text } = Typography;

/**
 * Confirmation Modal for student information changes
 * Displays changed fields and allows confirmation before saving
 */
const ConfirmationModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  loading = false,
  form 
}) => {
  console.log('[DEBUG-MODAL] ConfirmationModal rendered, visible:', visible);
  
  // Trực tiếp lấy values từ form thay vì dùng context
  const formValues = form ? form.getFieldsValue(true) : {};
  console.log('[DEBUG-MODAL] Form values lấy trực tiếp:', formValues);
  
  // Tạo hàm getChangedFields đơn giản nếu không có từ context
  const getChangedFields = () => {
    // Return một số trường cơ bản để hiển thị trong modal
    return ['hoTenHocVien', 'sdtHocVien', 'emailHocVien'];
  };
  
  // Bỏ qua việc sử dụng context và thay bằng implementation đơn giản
  const getFieldLabel = (field) => {
    const mapping = {
      'hoTenHocVien': 'Họ tên học viên',
      'gioiTinh': 'Giới tính',
      'ngaySinh': 'Ngày sinh',
      'sdtHocVien': 'Số điện thoại học viên',
      'emailHocVien': 'Email học viên',
      'tinhThanh': 'Tỉnh/Thành',
      'hoTenDaiDien': 'Họ tên người đại diện',
      'moiQuanHe': 'Mối quan hệ',
      'sdtDaiDien': 'Số điện thoại người đại diện',
      'emailDaiDien': 'Email người đại diện',
      'confirmStudentInfo': 'Xác nhận SĐT học viên cho ClassIn',
      'confirmGuardianInfo': 'Xác nhận SĐT người đại diện cho Zalo'
    };
    return mapping[field] || field;
  };
  
  // Tạo originalData rỗng để so sánh
  const originalData = {};

  // Get list of changed fields - dùng hàm đã tạo ở trên
  const changedFields = getChangedFields();
  console.log('[DEBUG-MODAL] Danh sách trường thay đổi:', changedFields);

  // Format field value for display
  const formatFieldValue = (field, value) => {
    // Handle special cases
    if (field === 'confirmStudentInfo') {
      return value === '1' ? 'Có, sử dụng SĐT học viên' : 'Không, sử dụng SĐT khác';
    }
    
    if (field === 'confirmGuardianInfo') {
      return value === '1' ? 'Có, sử dụng SĐT người đại diện' : 'Không, sử dụng SĐT khác';
    }
    
    // Default case
    return value || '-';
  };

  console.log('[DEBUG-MODAL] Modal properties - visible:', visible, 'loading:', loading);
  
  return (
    <Modal
      title="Xác nhận thông tin đăng ký"
      open={visible}
      closable={true}
      maskClosable={false}
      onCancel={onCancel}
      footer={[
        <Button 
          key="back" 
          onClick={onCancel} 
          disabled={loading}
        >
          Quay lại
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={onConfirm}
        >
          Xác nhận
        </Button>
      ]}
      width="auto"
      style={{ maxWidth: '500px' }}
      centered
    >
      <div className="confirmation-content">
        <Title level={5} style={{ marginBottom: 16, color: 'var(--primary-color)' }}>Vui lòng xác nhận thông tin liên lạc</Title>
          
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="confirm-info-item">
            <span className="confirm-info-label">
              <PhoneOutlined style={{ color: 'var(--primary-color)' }} /> 
              <Text>SĐT ClassIn</Text>
            </span>
            <Text strong className="confirm-info-value">
              {formValues.confirmStudentInfo === '1' 
                ? formValues.sdtHocVien 
                : formValues.sdtHocVienMoi || '-'}
            </Text>
          </div>

          <div className="confirm-info-item">
            <span className="confirm-info-label">
              <PhoneOutlined style={{ color: 'var(--primary-color)' }} /> 
              <Text>SĐT Zalo</Text>
            </span>
            <Text strong className="confirm-info-value">
              {formValues.confirmGuardianInfo === '1' 
                ? formValues.sdtDaiDien 
                : formValues.newGuardianPhone || '-'}
            </Text>
          </div>

          <div className="confirm-info-item">
            <span className="confirm-info-label">
              <MailOutlined style={{ color: 'var(--primary-color)' }} /> 
              <Text>Email người đại diện</Text>
            </span>
            <Text strong className="confirm-info-value">
              {formValues.emailDaiDien || '-'}
            </Text>
          </div>
        </Space>

        <Divider style={{ margin: '16px 0' }} />
          
        <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
          Nhấn "Xác nhận" để lưu thông tin và chuyển sang bước tiếp theo
        </Text>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
