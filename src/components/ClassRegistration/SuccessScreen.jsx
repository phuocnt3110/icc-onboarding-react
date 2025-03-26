import React from 'react';
import { Card, Typography, Button, Result, Descriptions, Space, Skeleton } from 'antd';
import { formatDate } from './utils';
import { FIELD_MAPPINGS } from '../../config';

const { Text, Paragraph } = Typography;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

/**
 * Component to display success message after schedule selection
 * @param {Object} studentData - Student data with updated schedule
 * @param {Function} onChooseAgain - Function to call when choosing again
 * @param {Function} onComplete - Function to call when completing registration
 * @param {boolean} loading - Loading state
 */
const SuccessScreen = ({ 
  studentData, 
  onChooseAgain,
  onComplete,
  loading = false
}) => {
  // Get appropriate schedule type description based on status
  const scheduleType = () => {
    if (!studentData) return '';
    
    const status = studentData[STUDENT_FIELDS.STATUS];
    
    if (status === "Đã xác nhận lịch được giữ") {
      return "giữ chỗ";
    } else if (status === "Đăng ký lịch ngoài") {
      return "tùy chỉnh";
    } else {
      return "lớp học";
    }
  };
  
  // If data is still loading, show skeleton
  if (loading || !studentData) {
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }
  
  return (
    <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
      <Result
        status="success"
        title="Đăng ký lịch học thành công!"
        subTitle={
          <Space direction="vertical">
            <Paragraph>
              Bạn đã đăng ký thành công lịch học {scheduleType()} cho khóa học "{
                studentData[STUDENT_FIELDS.PACKAGE] || 
                studentData[STUDENT_FIELDS.PRODUCT] || 
                'của bạn'
              }".
            </Paragraph>
            <Paragraph>
              Chúng tôi sẽ liên hệ với bạn để xác nhận lịch học trong thời gian sớm nhất.
            </Paragraph>
          </Space>
        }
        extra={[
          <Button key="back" onClick={onChooseAgain}>
            Chọn lại lịch
          </Button>,
          <Button key="home" type="primary" onClick={onComplete}>
            Hoàn thành
          </Button>,
        ]}
      />
      
      <div style={{ background: '#fafafa', padding: '24px', borderRadius: '2px', marginTop: '24px' }}>
        <Descriptions title="Thông tin lớp học" bordered column={{ xs: 1, sm: 2 }}>
          {studentData[STUDENT_FIELDS.CLASS_CODE] && (
            <Descriptions.Item label="Mã lớp" span={2}>
              {studentData[STUDENT_FIELDS.CLASS_CODE]}
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Khóa học" span={2}>
            {studentData[STUDENT_FIELDS.PACKAGE] || 
             studentData[STUDENT_FIELDS.PRODUCT] || 
             'Không có thông tin'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Loại lớp">
            {studentData[STUDENT_FIELDS.CLASS_SIZE] || 'Không có thông tin'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Giáo viên">
            {studentData[STUDENT_FIELDS.TEACHER_TYPE] || 'Không có thông tin'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Trình độ">
            {studentData[STUDENT_FIELDS.LEVEL] || 'Không có thông tin'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Số buổi">
            {studentData[STUDENT_FIELDS.SESSIONS] || 'Không có thông tin'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Lịch học" span={2}>
            {studentData[STUDENT_FIELDS.SCHEDULE] || 'Không có thông tin'}
          </Descriptions.Item>
          
          {studentData[STUDENT_FIELDS.START_DATE] && (
            <Descriptions.Item label="Ngày khai giảng" span={2}>
              {formatDate(studentData[STUDENT_FIELDS.START_DATE])}
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Trạng thái" span={2}>
            <Text strong type="success">
              {studentData[STUDENT_FIELDS.STATUS] || 'Không có thông tin'}
            </Text>
          </Descriptions.Item>
        </Descriptions>
        
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Text type="secondary">
            Vui lòng giữ lại thông tin này để tham khảo sau này.
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default SuccessScreen;