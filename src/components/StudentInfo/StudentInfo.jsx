import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Row, Col, Divider, message, Spin, Alert, Result, Radio, Select, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../../contexts/StudentContext';
import { FIELD_MAPPINGS, MESSAGES, ROUTES } from '../../config';
import '../../styles/student-info.css';
import '../../styles/index.css';
import { UserOutlined, CalendarOutlined } from '@ant-design/icons';


const { Title, Text } = Typography;

// Utility functions
const formatCurrency = (value) => {
  if (!value) return '-';
  return `${parseInt(value).toLocaleString('vi-VN')} VNĐ`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

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
  const [confirmStudentInfo, setConfirmStudentInfo] = useState(true);
  const [confirmGuardianInfo, setConfirmGuardianInfo] = useState(true);
  
  // Access student context
  const { 
    student, 
    loading, 
    error, 
    updateStudent 
  } = useStudent();

  // Set form fields when student data is loaded
  useEffect(() => {
    if (student) {
      console.log('Setting form fields with student data:', student);
      form.setFieldsValue({
        hoTenHocVien: student[STUDENT_FIELDS.NAME] || '',
        sdtHocVien: student[STUDENT_FIELDS.PHONE] || '',
        emailHocVien: student[STUDENT_FIELDS.EMAIL] || '',
        hoTenDaiDien: student[STUDENT_FIELDS.GUARDIAN_NAME] || '',
        sdtDaiDien: student[STUDENT_FIELDS.GUARDIAN_PHONE] || '',
        emailDaiDien: student[STUDENT_FIELDS.GUARDIAN_EMAIL] || ''
      });
    }
  }, [student, form]);

  // Handle edit button click
  const handleEdit = () => {
    setEditing(true);
    setSubmitError(null);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setSubmitError(null);
    
    try {
      if (!student || !student.Id) {
        setSubmitError('Không tìm thấy ID học viên');
        return;
      }

      // Map the form field names back to the database field names
      const updatedValues = {
        [STUDENT_FIELDS.NAME]: values.hoTenHocVien,
        [STUDENT_FIELDS.PHONE]: values.sdtHocVien,
        [STUDENT_FIELDS.EMAIL]: values.emailHocVien,
        [STUDENT_FIELDS.GUARDIAN_NAME]: values.hoTenDaiDien,
        [STUDENT_FIELDS.GUARDIAN_PHONE]: values.sdtDaiDien,
        [STUDENT_FIELDS.GUARDIAN_EMAIL]: values.emailDaiDien
      };

      // Try to update student data
      await updateStudent(updatedValues);
      message.success(MESSAGES.UPDATE_SUCCESS);
      setEditing(false);
      
      // Proceed to step two
      proceedToStepTwo();
    } catch (err) {
      console.error('Error updating student:', err);
      setSubmitError(err.message || MESSAGES.UPDATE_FAILED);
    }
  };

  const proceedToStepTwo = () => {
    navigate(ROUTES.CLASS_SELECTION);
  };

  const handleProceedWithoutEditing = () => {
    proceedToStepTwo();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Lỗi"
        subTitle={error}
        extra={[
          <Button type="primary" key="retry" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        ]}
      />
    );
  }

  if (!student) {
    return (
      <Result
        status="warning"
        title="Không tìm thấy thông tin học viên"
        subTitle="Vui lòng kiểm tra lại đường dẫn hoặc liên hệ hỗ trợ"
      />
    );
  }

  return (
    <div className="student-info-container">
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
        requiredMark={false}
        className="student-info-form"
      >
        {/* Course Information */}
        <Card className="info-card">
          <div className="card-title">A. Thông tin khóa học</div>
          <div className="course-info-grid">
            <div className="course-info-item">
              <div className="course-info-label">Khóa học đã đăng ký:</div>
              <div className="course-info-value">{student[STUDENT_FIELDS.PRODUCT] || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Trình độ bắt đầu:</div>
              <div className="course-info-value">{student[STUDENT_FIELDS.LEVEL] || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Loại lớp:</div>
              <div className="course-info-value">{student[STUDENT_FIELDS.CLASS_SIZE] || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Giáo viên:</div>
              <div className="course-info-value">{student[STUDENT_FIELDS.TEACHER_TYPE] || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Số buổi:</div>
              <div className="course-info-value">{student[STUDENT_FIELDS.SESSIONS] || '-'}</div>
            </div>
            <div className="course-info-item">
              <div className="course-info-label">Học phí:</div>
              <div className="course-info-value">
                {student[STUDENT_FIELDS.PRICE] ? 
                  `${parseInt(student[STUDENT_FIELDS.PRICE]).toLocaleString('vi-VN')} VNĐ` : '-'}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Student Information */}
        <Card className="info-card">
          <Title level={5} className="card-title">
            B. Thông tin học viên
          </Title>
          <Divider className="card-divider" />
          
          <Row gutter={[16, 16]} className="form-row">
            <Col xs={24} sm={12}>
              <Form.Item
                name="hoTenHocVien"
                label={<RequiredLabel text="Họ và tên học viên" />}
                rules={[{ required: true, message: 'Vui lòng nhập họ tên học viên' }]}
                className="form-item"
              >
                <Input disabled={!editing || readOnly} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="gioiTinh"
                label={<RequiredLabel text="Giới tính" />}
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                className="form-item"
              >
                <Select
                  disabled={!editing || readOnly}
                  placeholder="Chọn giới tính"
                  className="gender-select"
                >
                  <Select.Option value="Nam">Nam</Select.Option>
                  <Select.Option value="Nữ">Nữ</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="ngaySinh"
                label={<RequiredLabel text="Ngày sinh" />}
                rules={[{ required: true, message: 'Vui lòng nhập ngày sinh' }]}
                className="form-item"
              >
                <Input disabled={!editing || readOnly} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="sdtHocVien"
                label={<RequiredLabel text="Số điện thoại học viên" />}
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại học viên' },
                  { pattern: /^0\d{9,10}$|^84-\d+$/, message: 'Số điện thoại không hợp lệ' }
                ]}
                className="form-item"
              >
                <Input disabled={!editing || readOnly} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="emailHocVien"
                label={<RequiredLabel text="Email học viên" />}
                rules={[
                  { required: true, message: 'Vui lòng nhập email học viên' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
                className="form-item"
              >
                <Input disabled={!editing || readOnly} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="tinhThanh"
                label={<RequiredLabel text="Tỉnh/Thành" />}
                rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành' }]}
                className="form-item"
              >
                <Input disabled={!editing || readOnly} />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <div className="confirmation-section">
                <div className="confirmation-text">
                  Xác nhận sử dụng Số điện thoại học viên để mở tài khoản học trực tuyến
                </div>
                <Form.Item
                  name="confirmStudentInfo"
                  className="confirmation-select-item"
                >
                  <Select
                    onChange={(value) => setConfirmStudentInfo(value)}
                    disabled={!editing || readOnly}
                    className="confirmation-select"
                    placeholder="Chọn xác nhận"
                  >
                    <Select.Option value="yes">Có</Select.Option>
                    <Select.Option value="no">Không</Select.Option>
                  </Select>
                </Form.Item>

                {confirmStudentInfo === 'no' && (
                  <div className="new-phone-container">
                    <Form.Item
                      name="sdtHocVienMoi"
                      rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại đăng ký mới' },
                        { pattern: /^0\d{9,10}$|^84-\d+$/, message: 'Số điện thoại không hợp lệ' }
                      ]}
                      className="new-phone-form-item"
                    >
                      <Input 
                        disabled={!editing || readOnly} 
                        placeholder="Nhập số điện thoại khác"
                        className="new-phone-input"
                      />
                    </Form.Item>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Guardian Information */}
        <Card className="info-card">
          <Title level={5} className="card-title">
            C. Thông tin người đại diện
          </Title>
          <Divider className="card-divider" />
          
          <Row gutter={[16, 16]} className="form-row">
            <Col xs={24} sm={12}>
              <Form.Item
                name="hoTenDaiDien"
                label={<RequiredLabel text="Họ và tên người đại diện" />}
                rules={[{ required: true, message: 'Vui lòng nhập họ tên người đại diện' }]}
                className="form-item"
              >
                <Input disabled={!editing || readOnly} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="moiQuanHe"
                label={<RequiredLabel text="Mối quan hệ với học viên" />}
                rules={[{ required: true, message: 'Vui lòng chọn mối quan hệ' }]}
                className="form-item"
              >
                <Select
                  disabled={!editing || readOnly}
                  placeholder="Chọn mối quan hệ"
                  className="relationship-select"
                >
                  <Select.Option value="Cha">Cha</Select.Option>
                  <Select.Option value="Mẹ">Mẹ</Select.Option>
                  <Select.Option value="Anh/Chị">Anh/Chị</Select.Option>
                  <Select.Option value="Người giám hộ">Người giám hộ</Select.Option>
                  <Select.Option value="Khác">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="emailDaiDien"
                label={<RequiredLabel text="Email người đại diện" />}
                rules={[
                  { required: true, message: 'Vui lòng nhập email người đại diện' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
                className="form-item"
              >
                <Input disabled={!editing || readOnly} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="sdtDaiDien"
                label={<RequiredLabel text="Số điện thoại người đại diện" />}
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại người đại diện' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                ]}
                className="form-item"
              >
                <Input disabled={!editing || readOnly} />
              </Form.Item>
            </Col>
          </Row>

          <div className="confirmation-section">
            <div className="confirmation-text">
              Xác nhận Số người đại diện có sử dụng Zalo
            </div>
            <Form.Item
              name="confirmGuardianInfo"
              className="confirmation-select-item"
            >
              <Select
                onChange={(value) => setConfirmGuardianInfo(value)}
                disabled={!editing || readOnly}
                className="confirmation-select"
                placeholder="Chọn xác nhận"
              >
                <Select.Option value="yes">Có</Select.Option>
                <Select.Option value="no">Không, tôi sử dụng Zalo với số điện thoại khác</Select.Option>
              </Select>
            </Form.Item>

            {confirmGuardianInfo === 'no' && (
              <div className="new-phone-container">
                <Form.Item
                  name="newGuardianPhone"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại mới' },
                    { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                  ]}
                  className="new-phone-form-item"
                >
                  <Input 
                    disabled={!editing || readOnly} 
                    placeholder="Nhập số điện thoại đăng ký Zalo"
                    className="new-phone-input"
                  />
                </Form.Item>
              </div>
            )}
          </div>

          <div className="guardian-note">
            <Alert
              message={
                <div className="guardian-note-content">
                  <span className="guardian-note-icon">ℹ️</span>
                  <span className="guardian-note-text">
                    Công ty sẽ trao đổi các thông tin, thông báo và kết quả học tập với Người đại diện của học viên
                  </span>
                </div>
              }
              type="info"
              className="guardian-note-alert"
            />
          </div>
        </Card>

        <div className="form-actions">
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
      </Form>
    </div>
  );
};

export default StudentInfo;