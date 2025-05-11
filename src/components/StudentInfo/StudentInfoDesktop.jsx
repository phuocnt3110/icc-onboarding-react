import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Form, Button, Alert, message, Spin, Skeleton, Modal, List, Typography, Divider } from 'antd';
import { CheckCircleFilled, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useStudentInfo } from './context/StudentInfoContext';
import useStudentInfoForm from './hooks/useStudentInfoForm';

// Lazy load individual card components
const StudentCourseInfoCard = lazy(() => import('./components/StudentCourseInfoCard'));
const StudentPersonalInfoCard = lazy(() => import('./components/StudentPersonalInfoCard'));
const StudentGuardianInfoCard = lazy(() => import('./components/StudentGuardianInfoCard'));

/**
 * Desktop version of StudentInfo component
 * Displays student information in a 3-card layout
 */
const StudentInfoDesktop = () => {
  // Get form instance
  const [form] = Form.useForm();
  
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
  
  // Thêm state để quản lý modal trực tiếp trong component
  const [simpleModalVisible, setSimpleModalVisible] = useState(false);

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
  
  // Handle showing our custom modal
  const handleShowConfirmationModal = async () => {
    try {
      console.log('Attempting to show modal...');
      // Validate form
      await form.validateFields();
      // Show our custom modal
      setSimpleModalVisible(true);
      console.log('Modal should be visible now:', true);
    } catch (error) {
      console.error('Error validating form:', error);
      if (error.errorFields) {
        const errorMessages = error.errorFields.map(field => `${field.name.join('.')} - ${field.errors.join('; ')}`);
        message.error(`Có lỗi trong form: ${errorMessages.join(', ')}`);
      } else {
        message.error('Có lỗi xảy ra khi xác thực form.');
      }
    }
  };
    
  // Handle modal confirmation - direct action with our custom modal
  const handleConfirm = () => {
    console.log('Xác nhận được nhấn, tiến hành lưu dữ liệu...');
    proceedToStepTwo(true);
  };
  
  // Handle modal cancellation - direct action with our custom modal
  const handleCancel = () => {
    console.log('Modal được đóng...');
    setSimpleModalVisible(false);
  };
  
  // If loading, show spinner
  if (isDataLoading) {
    return (
      <div className="container container-md">
        <div className="text-center" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
          <div className="text-secondary" style={{ marginTop: '16px' }}>Đang tải thông tin...</div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Alerts and notifications */}
      {submitError && (
        <Alert
          message="Lỗi xác nhận thông tin"
          description={submitError}
          type="error"
          showIcon
          className="margin-bottom-md"
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
          className="margin-bottom-md"
        />
      )}
      
      {/* Main content with fade-in effect */}
      <div className={`fade-content ${contentVisible ? 'visible' : ''}`}>
        {!formInitialized ? (
          <div className="text-center padding-md">
            <Spin size="large" />
            <p className="text-secondary margin-top-sm">Đang khởi tạo form...</p>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            size="middle"
            requiredMark={false}
            className="student-info-form"
            onValuesChange={handleValuesChange}
            onFinish={showConfirmationModal}
          >
            {/* Course Information with Lazy Loading */}
            <Suspense fallback={<Skeleton active paragraph={{ rows: 3 }} />}>
              <StudentCourseInfoCard student={student} />
            </Suspense>
            
            {/* Student Information with Lazy Loading */}
            <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
              <StudentPersonalInfoCard form={form} student={student} />
            </Suspense>
            
            {/* Guardian Information with Lazy Loading */}
            <Suspense fallback={<Skeleton active paragraph={{ rows: 5 }} />}>
              <StudentGuardianInfoCard form={form} student={student} />
            </Suspense>
            
            {/* Form Buttons */}
            <div className="text-center margin-top-lg">
              <Button 
                type="primary" 
                size="large"
                onClick={handleShowConfirmationModal}
                loading={localLoading}
                className="btn-primary btn-lg"
              >
                Xác nhận thông tin
              </Button>
            </div>
          </Form>
        )}
      </div>
      
      {/* Custom Confirmation Modal - directly in this component */}
      <Modal
        title={<div style={{ color: 'var(--primary-color)' }}><CheckCircleFilled style={{ color: 'var(--success-color)', marginRight: 8 }} /> Xác nhận thông tin</div>}
        open={simpleModalVisible}
        maskClosable={false}
        closable={true}
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
        width="auto"
        style={{ maxWidth: '500px' }}
        centered
      >
        <div className="confirmation-content">
          <Typography.Title level={5} style={{ marginBottom: 16, color: 'var(--primary-color)' }}>Vui lòng xác nhận thông tin liên lạc</Typography.Title>
          
          <div className="confirm-info-section">
            {/* SĐT ClassIn */}
            <div className="confirm-info-item">
              <span className="confirm-info-label">
                <PhoneOutlined style={{ color: 'var(--primary-color)' }} /> 
                <Typography.Text>SĐT ClassIn</Typography.Text>
              </span>
              <Typography.Text strong className="confirm-info-value">
                {form.getFieldValue('confirmStudentInfo') === '1' 
                  ? form.getFieldValue('sdtHocVien') 
                  : form.getFieldValue('sdtHocVienMoi') || '-'}
              </Typography.Text>
            </div>

            {/* SĐT Zalo */}
            <div className="confirm-info-item">
              <span className="confirm-info-label">
                <PhoneOutlined style={{ color: 'var(--primary-color)' }} /> 
                <Typography.Text>SĐT Zalo</Typography.Text>
              </span>
              <Typography.Text strong className="confirm-info-value">
                {form.getFieldValue('confirmGuardianInfo') === '1' 
                  ? form.getFieldValue('sdtDaiDien') 
                  : form.getFieldValue('newGuardianPhone') || '-'}
              </Typography.Text>
            </div>

            {/* Email người đại diện */}
            <div className="confirm-info-item">
              <span className="confirm-info-label">
                <MailOutlined style={{ color: 'var(--primary-color)' }} /> 
                <Typography.Text>Email người đại diện</Typography.Text>
              </span>
              <Typography.Text strong className="confirm-info-value">
                {form.getFieldValue('emailDaiDien') || '-'}
              </Typography.Text>
            </div>
          </div>
          
          <Divider style={{ margin: '16px 0' }} />
            
          <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            Nhấn "Xác nhận" để lưu thông tin và chuyển sang bước tiếp theo
          </Typography.Text>
        </div>
      </Modal>
    </>
  );
};

export default StudentInfoDesktop;
