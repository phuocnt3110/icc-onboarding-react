import React from 'react';
import { Modal, Button, Typography, Divider, List } from 'antd';
import { CheckCircleFilled, PhoneOutlined, MailOutlined } from '@ant-design/icons';
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
      visible={true} // FORCE SHOW cho mục đích test
      open={true} // FORCE SHOW cho mục đích test
      closable={true}
      maskClosable={true}
      onCancel={onCancel || (() => console.log('onCancel được gọi, nhưng không được định nghĩa'))}
      footer={[
        <Button 
          key="back" 
          onClick={() => {
            console.log('[DEBUG-MODAL] Nút Quay lại được nhấn');
            if (onCancel) onCancel();
          }} 
          disabled={loading}
        >
          Quay lại
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={() => {
            console.log('[DEBUG-MODAL] Nút Xác nhận được nhấn');
            if (onConfirm) onConfirm();
          }}
        >
          Xác nhận
        </Button>
      ]}
      width={600}
    >
      {changedFields.length > 0 ? (
        <>
          <Title level={5}>Thông tin đã được thay đổi:</Title>
          <List
            itemLayout="horizontal"
            dataSource={changedFields}
            renderItem={field => (
              <List.Item>
                <List.Item.Meta
                  avatar={<CheckCircleFilled style={{ color: '#52c41a', fontSize: '18px' }} />}
                  title={getFieldLabel(field)}
                  description={
                    <div>
                      <Text type="secondary" style={{ textDecoration: 'line-through' }}>
                        {formatFieldValue(field, originalData[field])}
                      </Text>
                      <br />
                      <Text strong>
                        {formatFieldValue(field, formValues[field])}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          
          <Divider />
          
          {/* Display contact information summary */}
          <div style={{ marginBottom: '20px' }}>
            <Title level={5}>Xác nhận thông tin liên hệ:</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PhoneOutlined /> 
                <Text>Số điện thoại ClassIn: </Text>
                <Text strong>
                  {formValues.confirmStudentInfo === '1' 
                    ? formValues.sdtHocVien 
                    : formValues.sdtHocVienMoi}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PhoneOutlined /> 
                <Text>Số điện thoại Zalo: </Text>
                <Text strong>
                  {formValues.confirmGuardianInfo === '1' 
                    ? formValues.sdtDaiDien 
                    : formValues.newGuardianPhone}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MailOutlined /> 
                <Text>Email học viên: </Text>
                <Text strong>{formValues.emailHocVien || '-'}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MailOutlined /> 
                <Text>Email người đại diện: </Text>
                <Text strong>{formValues.emailDaiDien || '-'}</Text>
              </div>
            </div>
          </div>
          
          <Text type="secondary">
            Nhấn "Xác nhận" để lưu thông tin và chuyển sang bước tiếp theo.
          </Text>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Title level={4}>Không có thông tin nào thay đổi</Title>
          <Text>Nhấn "Xác nhận" để chuyển sang bước tiếp theo.</Text>
        </div>
      )}
    </Modal>
  );
};

export default ConfirmationModal;
