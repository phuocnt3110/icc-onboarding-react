import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, message, Spin, Modal, List, Typography, Divider } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
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
    <div style={{ 
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      minHeight: '800px',
      width: '100%',
      maxWidth: '100%',
      margin: '0',
      padding: '0',
      position: 'relative'
    }}>
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
      <div style={{ 
        opacity: contentVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
        backgroundColor: 'transparent'
      }}>
        <Form
          form={form}
          layout="vertical"
          size="middle"
          requiredMark={false}
          className="student-info-form"
          onValuesChange={handleValuesChange}
          onFinish={handleShowConfirmationModal}
          style={{ backgroundColor: 'transparent' }}
        >
          <MobileMultiStepForm
            form={form}
            student={student}
            localLoading={localLoading}
            submitError={submitError}
          />
        </Form>
      </div>

      {/* Modal Xác nhận - triển khai trực tiếp, không dùng lazy loading */}
      <Modal
        title="Xác nhận thông tin đăng ký"
        visible={simpleModalVisible}
        open={simpleModalVisible}
        closable={true}
        maskClosable={true}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel} disabled={localLoading}>
            Quay lại
          </Button>,
          <Button type="primary" htmlType="submit" onClick={handleShowConfirmationModal}>
            Xác nhận thông tin
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
        width="95%" // Modal rộng hơn trên mobile
        style={{ top: '10px' }} // Hiển thị gần phía trên màn hình
      >
        <Typography.Title level={5} style={{ fontSize: '16px', marginBottom: '12px' }}>
          Thông tin học viên
        </Typography.Title>
        <List
          itemLayout="horizontal"
          size="small"
          dataSource={[
            { field: 'hoTenHocVien', label: 'Họ tên học viên' },
            { field: 'sdtHocVien', label: 'Số điện thoại học viên' },
            { field: 'emailHocVien', label: 'Email học viên' }
          ]}
          renderItem={item => (
            <List.Item style={{ padding: '8px 0' }}>
              <List.Item.Meta
                avatar={<CheckCircleFilled style={{ color: '#52c41a', fontSize: '16px' }} />}
                title={<span style={{ fontSize: '14px' }}>{item.label}</span>}
                description={
                  <Typography.Text strong style={{ fontSize: '14px' }}>
                    {form.getFieldValue(item.field) || '-'}
                  </Typography.Text>
                }
              />
            </List.Item>
          )}
        />
        
        <Divider style={{ margin: '12px 0' }} />
        
        <Typography.Title level={5} style={{ fontSize: '16px', marginBottom: '12px', marginTop: '8px' }}>
          Thông tin người đại diện
        </Typography.Title>
        <List
          itemLayout="horizontal"
          size="small"
          dataSource={[
            { field: 'hoTenDaiDien', label: 'Họ tên người đại diện' },
            { field: 'sdtDaiDien', label: 'Số điện thoại người đại diện' },
            { field: 'emailDaiDien', label: 'Email người đại diện' }
          ]}
          renderItem={item => (
            <List.Item style={{ padding: '8px 0' }}>
              <List.Item.Meta
                avatar={<CheckCircleFilled style={{ color: '#52c41a', fontSize: '16px' }} />}
                title={<span style={{ fontSize: '14px' }}>{item.label}</span>}
                description={
                  <Typography.Text strong style={{ fontSize: '14px' }}>
                    {form.getFieldValue(item.field) || '-'}
                  </Typography.Text>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default StudentInfoMobile;
