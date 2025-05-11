import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, message, Spin, Modal, List, Typography, Divider } from 'antd';
import { CheckCircleFilled, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useStudentInfo } from './context/StudentInfoContext';
import useStudentInfoForm from './hooks/useStudentInfoForm';
import styles from './styles/StudentInfoMobile.module.css';
import MobileMultiStepForm from './MobileMultiStepForm';

const StudentInfoMobile = () => {
  // Get form instance
  const [form] = Form.useForm();
  
  // Thêm state quản lý modal trực tiếp - khai báo ở đầu component
  const [simpleModalVisible, setSimpleModalVisible] = useState(false);
  
  // Access student info context
  const {
    student,
    error,
    submitError,
    isDataLoading,
    confirmModalVisible,
    setConfirmModalVisible,
    contentVisible,
    setContentVisible
  } = useStudentInfo();
  
  // Use the form hook with form instance
  const {
    formInitialized,
    localLoading,
    handleValuesChange,
    showConfirmationModal,
    proceedToStepTwo,
    reloadStudentData
  } = useStudentInfoForm(form);
  
  // Multi-step form không cần quản lý state accordion

  // Manage content visibility with animation
  useEffect(() => {
    if (formInitialized && student) {
      // Use a small timeout to ensure smooth animation
      const timeoutId = setTimeout(() => {
        setContentVisible(true);
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [formInitialized, student, setContentVisible]);
  


  // Hiển thị modal xác nhận trực tiếp
  const handleShowConfirmationModal = async () => {
    try {
      console.log('Mobile: Attempting to show confirmation modal...');
      // Validate all form fields
      await form.validateFields();
      // Show modal
      setSimpleModalVisible(true);
      console.log('Mobile: Modal should be visible now');
    } catch (error) {
      console.error('Mobile: Error validating form:', error);
      if (error.errorFields && error.errorFields.length > 0) {
        message.error('Vui lòng kiểm tra lại các trường thông tin.');
      } else {
        message.error('Có lỗi xảy ra khi xác nhận thông tin.');
      }
    }
  };

  // Xử lý khi nhấn nút xác nhận trong modal
  const handleConfirm = () => {
    // Log giá trị form thực tế trước khi submit
    const values = form.getFieldsValue(true);
    console.log('[MOBILE][SUBMIT] Giá trị form trước khi submit:', values);
    // Đặc biệt log confirmStudentInfo
    console.log('[MOBILE][SUBMIT] confirmStudentInfo:', values.confirmStudentInfo, '| typeof:', typeof values.confirmStudentInfo);
    proceedToStepTwo(true);
  };
  
  // Xử lý khi đóng modal
  const handleCancel = () => {
    console.log('Mobile: Modal được đóng...');
    setSimpleModalVisible(false);
  };
   
  return (
    <>
      {/* Alerts and notifications */}
      {submitError && (
        <Alert
          message="Lỗi xác nhận thông tin"
          description={submitError}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
          action={
            <Button size="small" danger onClick={() => message.success('Đã đóng thông báo lỗi')}>
              Đóng
            </Button>
          }
        />
      )}

      {error && error !== submitError && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      
      {/* Main content with fade-in effect */}
      <Form
        form={form}
        layout="vertical"
        size="middle"
        requiredMark={false}
        className="student-info-form"
        onValuesChange={handleValuesChange}
        onFinish={handleShowConfirmationModal}
        style={{ 
          backgroundColor: 'transparent',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
      >
          <MobileMultiStepForm
            form={form}
            student={student}
            localLoading={localLoading}
            submitError={submitError}
          />
        </Form>

      {/* Modal Xác nhận - triển khai trực tiếp, không dùng lazy loading */}
      <Modal
        title={<div style={{ color: 'var(--primary-color)' }}><CheckCircleFilled style={{ color: 'var(--success-color)', marginRight: 8 }} /> Xác nhận thông tin</div>}
        open={simpleModalVisible}
        closable={true}
        maskClosable={false}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel} disabled={localLoading}>
            Quay lại
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={localLoading} 
            onClick={handleConfirm}
          >
            Xác nhận
          </Button>
        ]}
        width="95%" 
        style={{ top: '50px', maxWidth: '450px' }}
        centered
      >
        <div className="confirmation-content">
          <Typography.Title level={5} style={{ marginBottom: 16, color: 'var(--primary-color)', fontSize: '16px' }}>
            Vui lòng xác nhận thông tin liên lạc
          </Typography.Title>
          
          <div className="confirm-info-section">
            {/* SĐT ClassIn */}
            <div className="confirm-info-item">
              <span className="confirm-info-label">
                <PhoneOutlined style={{ color: 'var(--primary-color)' }} /> 
                <Typography.Text style={{ fontSize: '14px' }}>SĐT ClassIn</Typography.Text>
              </span>
              <Typography.Text strong className="confirm-info-value" style={{ fontSize: '14px' }}>
                {form.getFieldValue('confirmStudentInfo') === '1' 
                  ? form.getFieldValue('sdtHocVien') 
                  : form.getFieldValue('sdtHocVienMoi') || '-'}
              </Typography.Text>
            </div>

            {/* SĐT Zalo */}
            <div className="confirm-info-item">
              <span className="confirm-info-label">
                <PhoneOutlined style={{ color: 'var(--primary-color)' }} /> 
                <Typography.Text style={{ fontSize: '14px' }}>SĐT Zalo</Typography.Text>
              </span>
              <Typography.Text strong className="confirm-info-value" style={{ fontSize: '14px' }}>
                {form.getFieldValue('confirmGuardianInfo') === '1' 
                  ? form.getFieldValue('sdtDaiDien') 
                  : form.getFieldValue('newGuardianPhone') || '-'}
              </Typography.Text>
            </div>

            {/* Email người đại diện */}
            <div className="confirm-info-item">
              <span className="confirm-info-label">
                <MailOutlined style={{ color: 'var(--primary-color)' }} /> 
                <Typography.Text style={{ fontSize: '14px' }}>Email người đại diện</Typography.Text>
              </span>
              <Typography.Text strong className="confirm-info-value" style={{ fontSize: '14px' }}>
                {form.getFieldValue('emailDaiDien') || '-'}
              </Typography.Text>
            </div>
          </div>
          
          <Divider style={{ margin: '16px 0' }} />
            
          <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: '13px' }}>
            Nhấn "Xác nhận" để lưu thông tin và chuyển sang bước tiếp theo
          </Typography.Text>
        </div>
      </Modal>
    </>
  );
};

export default StudentInfoMobile;
