import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Row, Col, Divider, message, Spin, Alert } from 'antd';
import axios from 'axios';
import { API_CONFIG, TABLE_IDS, FIELD_MAPPINGS, MESSAGES, ROUTES } from '../config';
import './StudentInfoStyles.css';

const { Title, Text } = Typography;

// Extract values from config
const { TOKEN, BASE_URL } = API_CONFIG;
const { STUDENT } = TABLE_IDS;
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

// Create API client
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'xc-token': TOKEN
  }
});

// Custom form label component that only shows asterisk at the end
const RequiredLabel = ({ text }) => (
  <span>{text} <span style={{ color: 'red' }}>*</span></span>
);

const StudentInfo = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [studentData, setStudentData] = useState({});
  const [readOnly, setReadOnly] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    // Get id from URL
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id');
    
    if (id) {
      console.log('Fetching data for billItemId:', id);
      fetchStudentData(id);
    } else {
      console.log('No ID found in URL');
      message.error(MESSAGES.NO_ID_IN_URL);
    }
  }, []);

  // Fetch student data using billItemId from config
  const fetchStudentData = async (id) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/tables/${STUDENT}/records?where=(${STUDENT_FIELDS.BILL_ITEM_ID},eq,${id})`);
      
      console.log('API response:', response.data);
      
      if (response.data && response.data.list && response.data.list.length > 0) {
        const data = response.data.list[0];
        console.log('Found student data:', data);
        setStudentData(data);
        
        // Initialize form with field mappings from config
        form.setFieldsValue({
          hoTenHocVien: data[STUDENT_FIELDS.NAME] || '',
          sdtHocVien: data[STUDENT_FIELDS.PHONE] || '',
          emailHocVien: data[STUDENT_FIELDS.EMAIL] || '',
          hoTenDaiDien: data[STUDENT_FIELDS.GUARDIAN_NAME] || '',
          sdtDaiDien: data[STUDENT_FIELDS.GUARDIAN_PHONE] || '',
          emailDaiDien: data[STUDENT_FIELDS.GUARDIAN_EMAIL] || ''
        });
      } else {
        console.log('No student data found for ID:', id);
        message.error('Không tìm thấy thông tin học viên');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      message.error(`Lỗi khi tải dữ liệu học viên: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = () => {
    setEditing(true);
    setSubmitError(null);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    setSubmitError(null);
    try {
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
      try {
        await apiClient.patch(`/tables/${STUDENT}/records`, {
          Id: studentData.Id,
          ...updatedValues
        });

        message.success(MESSAGES.UPDATE_SUCCESS);
        setEditing(false);
        
        // Update local state with the correct field mappings
        setStudentData(prev => ({
          ...prev,
          ...updatedValues
        }));
      } catch (error) {
        console.error('Error updating student data:', error);
        
        // Check if it's a permission error
        if (error.response && error.response.status === 403) {
          // Set read-only mode and show explanation
          setReadOnly(true);
          setSubmitError('Không có quyền cập nhật dữ liệu. Chuyển sang chế độ chỉ đọc.');
          
          // Still proceed to step two with the current data
          setTimeout(() => {
            proceedToStepTwo();
          }, 2000);
        } else {
          setSubmitError(MESSAGES.UPDATE_FAILED.replace('{error}', error.message));
        }
        return;
      }
      
      // Proceed to step two
      proceedToStepTwo();
      
    } catch (error) {
      console.error('Error in form submission:', error);
      setSubmitError(`Lỗi xử lý form: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to proceed to step two
  const proceedToStepTwo = () => {
    const id = studentData[STUDENT_FIELDS.BILL_ITEM_ID];
    
    if (!id) {
      setSubmitError('Không tìm thấy ID để chuyển trang');
      return;
    }
    
    // Kiểm tra trạng thái chọn lớp
    const currentStatus = studentData[STUDENT_FIELDS.STATUS];
    console.log('Trạng thái chọn lớp hiện tại:', currentStatus);
    
    // Kiểm tra chính xác chuỗi so sánh và thêm log để debug
    if (currentStatus) {
      console.log(`So sánh: "${currentStatus}" vs "HV Chưa chọn lịch"`);
    }
    
    // Nếu đã có trạng thái và KHÁC "HV Chưa chọn lịch", chuyển đến success screen
    if (currentStatus && currentStatus !== "HV Chưa chọn lịch" && currentStatus.trim() !== "HV Chưa chọn lịch") {
      console.log('Trạng thái khác "HV Chưa chọn lịch", chuyển đến success screen');
      window.location.href = `${ROUTES.STEP_TWO}?id=${id}&direct_success=true`;
    } else {
      // Nếu là "HV Chưa chọn lịch" hoặc không có trạng thái, tiếp tục flow thông thường
      console.log('Trạng thái là "HV Chưa chọn lịch" hoặc chưa có trạng thái, tiếp tục quy trình thông thường');
      window.location.href = `${ROUTES.STEP_TWO}?id=${id}`;
    }
  };
  
  // Handle direct proceed to step two (skip editing)
  const handleProceedWithoutEditing = () => {
    proceedToStepTwo();
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {loading && !studentData.Id ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      ) : (
        <>
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
                  <Text>{studentData[STUDENT_FIELDS.PACKAGE] || studentData[STUDENT_FIELDS.PRODUCT] || ''}</Text>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Text strong>Loại lớp:</Text>
                </Col>
                <Col xs={24} sm={16}>
                  <Text>{studentData[STUDENT_FIELDS.CLASS_SIZE] || '-'}</Text>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Text strong>Giáo viên:</Text>
                </Col>
                <Col xs={24} sm={16}>
                  <Text>{studentData[STUDENT_FIELDS.TEACHER_TYPE] || '-'}</Text>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Text strong>Số buổi:</Text>
                </Col>
                <Col xs={24} sm={16}>
                  <Text>{studentData[STUDENT_FIELDS.SESSIONS] || '-'}</Text>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Text strong>Học phí:</Text>
                </Col>
                <Col xs={24} sm={16}>
                  <Text>{studentData[STUDENT_FIELDS.PRICE] ? 
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
        </>
      )}
    </div>
  );
};

export default StudentInfo;