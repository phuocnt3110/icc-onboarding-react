import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Row, Col, Divider, message, Spin } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

// API configurations
const API_TOKEN = "45UUXAPg34nKjGVdMpss7iwhccn7xPg4corm_X1c";
const BASE_URL = "https://noco-erp.com/api/v2";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'xc-token': API_TOKEN
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

  useEffect(() => {
    // Get student ID from URL
    const queryParams = new URLSearchParams(window.location.search);
    const studentId = queryParams.get('id');
    
    if (studentId) {
      fetchStudentData(studentId);
    }
  }, []);

  // Fetch student data from API
  const fetchStudentData = async (studentId) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/tables/m6whmcc44o8tgh8/records?where=(studentId,allof,${studentId})`);
      
      if (response.data && response.data.list && response.data.list.length > 0) {
        const data = response.data.list[0];
        setStudentData(data);
        
        // Initialize form with data
        form.setFieldsValue({
          hoTenHocVien: data.hoTenHocVien || '',
          sdtHocVien: data.sdtHocVien || '',
          emailHocVien: data.emailHocVien || '',
          hoTenDaiDien: data.hoTenDaiDien || '',
          sdtDaiDien: data.sdtDaiDien || '',
          emailDaiDien: data.emailDaiDien || ''
        });
      } else {
        message.error('Không tìm thấy thông tin học viên');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      message.error('Lỗi khi tải dữ liệu học viên');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = () => {
    setEditing(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Update student data
      await apiClient.patch(`/tables/m6whmcc44o8tgh8/records`, {
        Id: studentData.Id,
        ...values
      });

      message.success('Cập nhật thông tin thành công');
      setEditing(false);
      
      // Update local state
      setStudentData(prev => ({
        ...prev,
        ...values
      }));
      
      // Redirect to step two after successful update
      const studentId = studentData.studentId;
      if (studentId) {
        window.location.href = `/step-two?id=${studentId}`;
      }
    } catch (error) {
      console.error('Error updating student data:', error);
      message.error('Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {loading && !studentData.Id ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      ) : (
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
                <Text>{studentData.tenSanPham || ''}</Text>
              </Col>
              
              <Col xs={24} sm={8}>
                <Text strong>Trình độ bắt đầu:</Text>
              </Col>
              <Col xs={24} sm={16}>
                <Text>{studentData.trinhDo || ''}</Text>
              </Col>
              
              <Col xs={24} sm={8}>
                <Text strong>Sĩ số:</Text>
              </Col>
              <Col xs={24} sm={16}>
                <Text>{studentData.size || ''}</Text>
              </Col>
              
              <Col xs={24} sm={8}>
                <Text strong>Giáo viên:</Text>
              </Col>
              <Col xs={24} sm={16}>
                <Text>{studentData.loaiGiaoVien || ''}</Text>
              </Col>
              
              <Col xs={24} sm={8}>
                <Text strong>Số buổi:</Text>
              </Col>
              <Col xs={24} sm={16}>
                <Text>{studentData.soBuoi || ''}</Text>
              </Col>
              
              <Col xs={24} sm={8}>
                <Text strong>Học phí:</Text>
              </Col>
              <Col xs={24} sm={16}>
                <Text>{studentData.giaThucDong ? `${parseInt(studentData.giaThucDong).toLocaleString('vi-VN')} VNĐ` : ''}</Text>
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
              <Input disabled={!editing} />
            </Form.Item>
            
            <Form.Item
              name="sdtHocVien"
              label={<RequiredLabel text="Số điện thoại học viên" />}
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại học viên' },
                { pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ' }
              ]}
            >
              <Input disabled={!editing} />
            </Form.Item>
            
            <Form.Item
              name="emailHocVien"
              label={<RequiredLabel text="Email học viên" />}
              rules={[
                { required: true, message: 'Vui lòng nhập email học viên' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input disabled={!editing} />
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
              <Input disabled={!editing} />
            </Form.Item>
            
            <Form.Item
              name="sdtDaiDien"
              label={<RequiredLabel text="Số điện thoại người liên hệ" />}
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại người liên hệ' },
                { pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ' }
              ]}
            >
              <Input disabled={!editing} />
            </Form.Item>
            
            <Form.Item
              name="emailDaiDien"
              label={<RequiredLabel text="Email người liên hệ" />}
              rules={[
                { required: true, message: 'Vui lòng nhập email người liên hệ' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input disabled={!editing} />
            </Form.Item>
          
            <Text type="danger" style={{ display: 'block', marginBottom: 16 }}>
              (*) là trường thông tin bắt buộc nhập
            </Text>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {!editing ? (
                <Button 
                  type="default"
                  onClick={handleEdit}
                >
                  Sửa thông tin
                </Button>
              ) : (
                <Button 
                  type="default" 
                  onClick={() => setEditing(false)}
                >
                  Hủy
                </Button>
              )}
              
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                disabled={!editing}
              >
                Xác nhận thông tin
              </Button>
            </div>
          </Card>
        </Form>
      )}
    </div>
  );
};

export default StudentInfo;