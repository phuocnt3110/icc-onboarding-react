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
      <div style={{ minHeight: '800px', opacity: 1 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          minHeight: '50vh'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Đang tải thông tin...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: '800px', opacity: 1 }}>
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
        transition: 'opacity 0.5s ease-in-out'
      }}>
        {!formInitialized ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p>Đang khởi tạo form...</p>
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
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button 
                type="primary" 
                size="large"
                onClick={handleShowConfirmationModal} // Sử dụng hàm mới
                loading={localLoading}
              >
                Xác nhận thông tin
              </Button>
            </div>
          </Form>
        )}
      </div>
      
      {/* Custom Confirmation Modal - directly in this component */}
      <Modal
        title="Xác nhận thông tin đăng ký"
        visible={simpleModalVisible}
        open={simpleModalVisible} // Hỗ trợ cả Ant Design v4 & v5
        maskClosable={true}
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
        width={600}
      >
        <Typography.Title level={5}>Xác nhận thông tin học viên:</Typography.Title>
        <List
          itemLayout="horizontal"
          dataSource={[
            { field: 'hoTenHocVien', label: 'Họ tên học viên' },
            { field: 'sdtHocVien', label: 'Số điện thoại học viên' },
            { field: 'emailHocVien', label: 'Email học viên' }
          ]}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<CheckCircleFilled style={{ color: '#52c41a', fontSize: '18px' }} />}
                title={item.label}
                description={
                  <Typography.Text strong>
                    {form.getFieldValue(item.field) || '-'}
                  </Typography.Text>
                }
              />
            </List.Item>
          )}
        />
        
        <Divider />
        
        <Typography.Title level={5}>Xác nhận thông tin người đại diện:</Typography.Title>
        <List
          itemLayout="horizontal"
          dataSource={[
            { field: 'hoTenDaiDien', label: 'Họ tên người đại diện' },
            { field: 'sdtDaiDien', label: 'Số điện thoại người đại diện' },
            { field: 'emailDaiDien', label: 'Email người đại diện' }
          ]}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<CheckCircleFilled style={{ color: '#52c41a', fontSize: '18px' }} />}
                title={item.label}
                description={
                  <Typography.Text strong>
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

export default StudentInfoDesktop;
