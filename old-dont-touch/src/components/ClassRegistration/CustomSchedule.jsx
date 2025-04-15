import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Divider, 
  Form, 
  Checkbox, 
  Row, 
  Col, 
  Alert, 
  Space, 
  Tag,
  Skeleton,
  Collapse,
  Tooltip
} from 'antd';
import { 
  ClockCircleOutlined, 
  CalendarOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { TIME_SLOTS, WEEKDAYS, validateScheduleSelection } from './utils';
import { FIELD_MAPPINGS } from '../../config';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

/**
 * Component to select custom schedule
 * Used for Case 3b (1:1 classes) or when student can't find a suitable class
 * @param {Object} studentData - Student data from API
 * @param {Function} onSubmit - Function to call when submitting schedule
 * @param {Function} onCancel - Function to call when canceling
 * @param {boolean} loading - Loading state
 * @param {boolean} fromCase2 - Whether coming from case 2 (invalid reservation)
 */
const CustomSchedule = ({ 
  studentData,
  onSubmit,
  onCancel,
  loading = false,
  fromCase2 = false
}) => {
  const [form] = Form.useForm();
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [formErrors, setFormErrors] = useState(null);
  
  // Set initial values based on student data if available
  useEffect(() => {
    if (studentData && studentData[STUDENT_FIELDS.SCHEDULE]) {
      try {
        // Try to parse existing schedule
        const scheduleEntries = studentData[STUDENT_FIELDS.SCHEDULE].split(' / ');
        const initialValues = {};
        
        scheduleEntries.forEach(entry => {
          const parts = entry.split(' - ');
          if (parts.length === 2) {
            const weekday = parts[0].trim();
            const time = parts[1].trim();
            
            if (WEEKDAYS.includes(weekday) && TIME_SLOTS.includes(time)) {
              if (!initialValues[weekday]) {
                initialValues[weekday] = [];
              }
              initialValues[weekday].push(time);
            }
          }
        });
        
        // Set form values
        if (Object.keys(initialValues).length > 0) {
          form.setFieldsValue(initialValues);
          
          // Trigger values change to update selected schedules
          handleValuesChange(null, initialValues);
        }
      } catch (error) {
        console.error('Error parsing existing schedule:', error);
      }
    }
  }, [studentData, form]);
  
  // Handle form submit
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        // Process form values to extract selected schedules
        const schedules = [];
        
        Object.keys(values).forEach(key => {
          if (Array.isArray(values[key]) && values[key].length > 0) {
            const weekday = key;
            values[key].forEach(time => {
              schedules.push({ weekday, time });
            });
          }
        });
        
        const validationResult = validateScheduleSelection(schedules);
        
        if (!validationResult.valid) {
          setFormErrors(validationResult.message);
          return;
        }
        
        if (schedules.length > 0) {
          setFormErrors(null);
          onSubmit(schedules);
        } else {
          setFormErrors('Vui lòng chọn ít nhất một lịch học');
        }
      })
      .catch(errorInfo => {
        console.error('Form validation failed:', errorInfo);
        setFormErrors('Vui lòng kiểm tra lại thông tin');
      });
  };
  
  // Handle form value changes
  const handleValuesChange = (changedValues, allValues) => {
    const schedules = [];
    
    Object.keys(allValues).forEach(key => {
      if (Array.isArray(allValues[key]) && allValues[key].length > 0) {
        const weekday = key;
        allValues[key].forEach(time => {
          schedules.push({ weekday, time });
        });
      }
    });
    
    setSelectedSchedules(schedules);
    
    if (schedules.length > 0) {
      setFormErrors(null);
    }
  };
  
  // Form validation rules
  const validateSchedules = (_, value) => {
    let totalSelected = 0;
    
    Object.keys(form.getFieldsValue()).forEach(key => {
      const values = form.getFieldValue(key);
      if (Array.isArray(values)) {
        totalSelected += values.length;
      }
    });
    
    if (totalSelected === 0) {
      return Promise.reject('Vui lòng chọn ít nhất một lịch học');
    }
    
    return Promise.resolve();
  };
  
  // Render selected schedules
  const renderSelectedSchedules = () => {
    if (selectedSchedules.length === 0) return null;
    
    return (
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Text strong>Lịch học đã chọn:</Text>
        <div style={{ marginTop: '8px' }}>
          <Space size={[8, 16]} wrap>
            {selectedSchedules.map((schedule, index) => (
              <Tag color="blue" key={index}>
                <Space>
                  <CalendarOutlined /> {schedule.weekday}
                  <ClockCircleOutlined /> {schedule.time}
                </Space>
              </Tag>
            ))}
          </Space>
        </div>
      </div>
    );
  };

  // If data is still loading, show skeleton
  if (loading && !studentData) {
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
      <Title level={5} className="card-title">
        Chọn lịch học theo ý muốn
      </Title>
      <Divider />
      
      {fromCase2 && (
        <Alert
          message="Cảnh báo"
          description={`Bạn đã giữ chỗ trước đó, nhưng chúng tôi không tìm thấy ${studentData?.[STUDENT_FIELDS.CLASS_RESERVATION] || 'mã lớp'} của bạn. Vui lòng liên hệ với tư vấn viên của bạn, hoặc tiếp tục chọn lịch học theo ý muốn dưới đây.`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '20px' }}
        />
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <Paragraph>
          Hãy chọn các thời gian bạn có thể tham gia học. Chúng tôi sẽ sắp xếp lớp học phù hợp dựa trên thông tin bạn cung cấp.
        </Paragraph>
        
        <Alert
          message="Lưu ý"
          description="Bạn nên chọn nhiều lịch học khác nhau để tăng khả năng sắp xếp lớp phù hợp."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      </div>
      
      {formErrors && (
        <Alert
          message="Lỗi"
          description={formErrors}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
          closable
          onClose={() => setFormErrors(null)}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        onFinish={handleSubmit}
      >
        <Form.Item 
          name="validator" 
          rules={[{ validator: validateSchedules }]}
          style={{ display: 'none' }}
        >
          <input />
        </Form.Item>
        
        <Card 
          type="inner" 
          title={
            <Space>
              <span>Lịch học mong muốn</span>
              <Tooltip title="Chọn tất cả các khung giờ mà bạn có thể tham gia học">
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            </Space>
          }
          extra={
            <Text type="secondary">
              Đã chọn: {selectedSchedules.length} lịch
            </Text>
          }
        >
          <Collapse defaultActiveKey={['0', '1']} ghost>
            {WEEKDAYS.map((weekday, index) => (
              <Panel 
                header={
                  <Space>
                    <CalendarOutlined />
                    <Text strong>{weekday}</Text>
                    {form.getFieldValue(weekday)?.length > 0 && (
                      <Tag color="blue">
                        {form.getFieldValue(weekday)?.length} khung giờ
                      </Tag>
                    )}
                  </Space>
                } 
                key={index}
              >
                <Form.Item key={weekday} name={weekday}>
                  <Checkbox.Group style={{ width: '100%' }}>
                    <Row gutter={[16, 8]}>
                      {TIME_SLOTS.map(slot => (
                        <Col xs={12} sm={8} key={slot}>
                          <Checkbox value={slot}>
                            <Space>
                              <ClockCircleOutlined />
                              <Text>{slot}</Text>
                            </Space>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
              </Panel>
            ))}
          </Collapse>
        </Card>
        
        {renderSelectedSchedules()}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <Button onClick={onCancel} disabled={loading}>
            Quay lại
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            disabled={selectedSchedules.length === 0 || loading}
            loading={loading}
          >
            Xác nhận lịch học
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default CustomSchedule;