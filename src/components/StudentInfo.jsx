import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Row, Col, Divider, message, Spin, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../contexts/StudentContext';
import { FIELD_MAPPINGS, MESSAGES, ROUTES } from '../config';
import './StudentInfoStyles.css';

const { Title, Text } = Typography;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

// Custom form label component that only shows asterisk at the end
const RequiredLabel = ({ text }) => (
  <span>{text} <span style={{ color: 'red' }}>*</span></span>
);

const StudentInfo = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  // State
  const [editing, setEditing] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Access student context
  const { 
    studentData, 
    loading, 
    error, 
    fetchStudentData, 
    updateStudentData 
  } = useStudent();

  useEffect(() => {
    // Get id from URL
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');
    
    if (id) {
      console.log('Fetching data for billItemId:', id);
      
      // Chỉ gọi fetchStudentData khi không đang loading và chưa có studentData
      if (!loading && !studentData) {
        fetchStudentData(id);
      } else {
        console.log('No ID found in URL or already loading/loaded');
      }
    } else {
      console.log('No ID found in URL');
      message.error(MESSAGES.NO_ID_IN_URL);
    }
  }, [fetchStudentData, loading, studentData]);

  // Set form fields when student data is loaded
  useEffect(() => {
    if (studentData) {
      form.setFieldsValue({
        hoTenHocVien: studentData[STUDENT_FIELDS.NAME] || '',
        sdtHocVien: studentData[STUDENT_FIELDS.PHONE] || '',
        emailHocVien: studentData[STUDENT_FIELDS.EMAIL] || '',
        hoTenDaiDien: studentData[STUDENT_FIELDS.GUARDIAN_NAME] || '',
        sdtDaiDien: studentData[STUDENT_FIELDS.GUARDIAN_PHONE] || '',
        emailDaiDien: studentData[STUDENT_FIELDS.GUARDIAN_EMAIL] || ''
      });
    }
  }, [studentData, form]);

  // Handle edit button click
  const handleEdit = () => {
    setEditing(true);
    setSubmitError(null);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setSubmitError(null);
    
    try {
      if (!studentData || !studentData.Id) {
        setSubmitError('Không tìm thấy ID học viên');
        return;
      }

      // Map the form field names back to the database field names using config
      const updatedValues = {
        [STUDENT_FIELDS.NAME]: values.hoTenHocVien,
        [STUDENT_FIELDS.PHONE]: values.sdtHocVien,
        [STUDENT_FIELDS.EMAIL]: values.emailHocVien,
        [STUDENT_FIELDS.GUARDIAN_NAME]: values.hoTenDaiDien,
        [STUDENT_FIELDS.GUARDIAN_PHONE]: values.sdtDaiDien,
        [STUDENT_FIELDS.GUARDIAN_EMAIL]: values.emailDaiDien
      };

      // Try to update student data
      const success = await updateStudentData(studentData.Id, updatedValues);

      if (success) {
        message.success(MESSAGES.UPDATE_SUCCESS);
        setEditing(false);
        
        // Proceed to step two
        proceedToStepTwo();
      } else {
        // Check if it's a permission error based on the error returned from context
        if (error && error.includes('không có quyền')) {
          // Set read-only mode and show explanation
          setReadOnly(true);
          setSubmitError('Không có quyền cập nhật dữ liệu. Chuyển sang chế độ chỉ đọc.');
          
          // Still proceed to step two with the current data
          setTimeout(() => {
            proceedToStepTwo();
          }, 2000);
        } else {
          setSubmitError(error || MESSAGES.UPDATE_FAILED.replace('{error}', ''));
        }
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      setSubmitError(`Lỗi xử lý form: ${error.message}`);
    }
  };
  
  // Function to proceed to step two
  const proceedToStepTwo = () => {
    if (!studentData) {
      setSubmitError('Không tìm thấy thông tin học viên để chuyển trang');
      return;
    }
    
    const id = studentData[STUDENT_FIELDS.BILL_ITEM_ID];
    
    if (!id) {
      setSubmitError('Không tìm thấy ID để chuyển trang');
      return;
    }
    
    // Kiểm tra trạng thái chọn lớp
    const currentStatus = studentData[STUDENT_FIELDS.STATUS];
    console.log('Trạng thái chọn lớp hiện tại:', currentStatus);
    
    // Nếu đã có trạng thái và KHÁC "HV Chưa chọn lịch", chuyển đến success screen
    if (currentStatus && currentStatus !== "HV Chưa chọn lịch" && currentStatus.trim() !== "HV Chưa chọn lịch") {
      console.log('Trạng thái khác "HV Chưa chọn lịch", chuyển đến success screen');
      navigate(`${ROUTES.STEP_TWO}?id=${id}&direct_success=true`);
    } else {
      // Nếu là "HV Chưa chọn lịch" hoặc không có trạng thái, tiếp tục flow thông thường
      console.log('Trạng thái là "HV Chưa chọn lịch" hoặc chưa có trạng thái, tiếp tục quy trình thông thường');
      navigate(`${ROUTES.STEP_TWO}?id=${id}`);
    }
  };
  
  // Handle direct proceed to step two (skip editing)
  const handleProceedWithoutEditing = () => {
    proceedToStepTwo();
  };

  // Show loading spinner if data is still loading and not yet loaded
  if (loading && !studentData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', flexDirection: 'column', alignItems: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '10px' }}>Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {readOnly && (
        <Alert
          message="Chế độ chỉ đọc"
          description="API token hiện tại chỉ có quyền đọc dữ liệu, không thể cập nhật thông tin. Bạn vẫn có thể tiếp tục đến bước tiếp theo."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}
      
      {submitError && (
        <Alert
          message="Lỗi"
          description={submitError}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
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
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="middle"
        // Disable the automatic asterisks at the beginning
        requiredMark={false}
      >
        {/* Course Information */}
        <Card style={{ borderRadius: '8px 8px 0 0', marginBottom: 0 }}>
          <Title level={5} className="card-title">
            A. Thông tin khóa học
          </Title>
          <Divider />
          
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={8}>
              <Text strong>Khóa học đã đăng ký:</Text>
            </Col>
            <Col xs={24} sm={16}>
              <Text>{studentData?.[STUDENT_FIELDS.LEVEL] || studentData?.[STUDENT_FIELDS.PRODUCT] || ''}</Text>
            </Col>
            
            <Col xs={24} sm={8}>
              <Text strong>Loại lớp:</Text>
            </Col>
            <Col xs={24} sm={16}>
              <Text>{studentData?.[STUDENT_FIELDS.CLASS_SIZE] || '-'}</Text>
            </Col>
            
            <Col xs={24} sm={8}>
              <Text strong>Giáo viên:</Text>
            </Col>
            <Col xs={24} sm={16}>
              <Text>{studentData?.[STUDENT_FIELDS.TEACHER_TYPE] || '-'}</Text>
            </Col>
            
            <Col xs={24} sm={8}>
              <Text strong>Số buổi:</Text>
            </Col>
            <Col xs={24} sm={16}>
              <Text>{studentData?.[STUDENT_FIELDS.SESSIONS] || '-'}</Text>
            </Col>
            
            <Col xs={24} sm={8}>
              <Text strong>Học phí:</Text>
            </Col>
            <Col xs={24} sm={16}>
              <Text>{studentData?.[STUDENT_FIELDS.PRICE] ? 
                `${parseInt(studentData[STUDENT_FIELDS.PRICE]).toLocaleString('vi-VN')} VNĐ` : '-'}</Text>
            </Col>
          </Row>
        </Card>
        
        {/* Student Information */}
        <Card style={{ borderRadius: 0, marginTop: 0, marginBottom: 0 }}>
          <Title level={5} className="card-title">
            B. Thông tin học viên
          </Title>
          <Divider />
          
          <Form.Item
            name="hoTenHocVien"
            label={<RequiredLabel text="Họ và tên học viên" />}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên học viên' }]}
          >
            <Input disabled={!editing || readOnly} />
          </Form.Item>
          
          <Form.Item
            name="sdtHocVien"
            label={<RequiredLabel text="Số điện thoại học viên" />}
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại học viên' },
              { pattern: /^0\d{9,10}$|^84-\d+$/, message: 'Số điện thoại không hợp lệ' }
            ]}
          >
            <Input disabled={!editing || readOnly} />
          </Form.Item>
          
          <Form.Item
            name="emailHocVien"
            label={<RequiredLabel text="Email học viên" />}
            rules={[
              { required: true, message: 'Vui lòng nhập email học viên' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input disabled={!editing || readOnly} />
          </Form.Item>
        </Card>
        
        {/* Contact Information */}
        <Card style={{ borderRadius: '0 0 8px 8px', marginTop: 0 }}>
          <Title level={5} className="card-title">
            C. Thông tin người liên hệ, nhận báo cáo học tập
          </Title>
          <Divider />
          
          <Form.Item
            name="hoTenDaiDien"
            label={<RequiredLabel text="Họ tên người liên hệ" />}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên người liên hệ' }]}
          >
            <Input disabled={!editing || readOnly} />
          </Form.Item>
          
          <Form.Item
            name="sdtDaiDien"
            label={<RequiredLabel text="Số điện thoại người liên hệ" />}
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại người liên hệ' },
              { pattern: /^0\d{9,10}$|^84-\d+$/, message: 'Số điện thoại không hợp lệ' }
            ]}
          >
            <Input disabled={!editing || readOnly} />
          </Form.Item>
          
          <Form.Item
            name="emailDaiDien"
            label={<RequiredLabel text="Email người liên hệ" />}
            rules={[
              { required: true, message: 'Vui lòng nhập email người liên hệ' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input disabled={!editing || readOnly} />
          </Form.Item>
        
          <Text type="danger" style={{ display: 'block', marginBottom: 16 }}>
            (*) là trường thông tin bắt buộc nhập
          </Text>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {!editing ? (
              <>
                <Button 
                  type="default"
                  onClick={handleEdit}
                  disabled={readOnly}
                >
                  Sửa thông tin
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleProceedWithoutEditing}
                >
                  Tiếp tục
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="default" 
                  onClick={() => {
                    setEditing(false);
                    setSubmitError(null);
                  }}
                >
                  Hủy
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                  disabled={readOnly}
                >
                  Xác nhận thông tin
                </Button>
              </>
            )}
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default StudentInfo;