import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Divider, 
  Table, 
  Tag, 
  Space, 
  Alert, 
  Empty, 
  Skeleton,
  Input,
  Row,
  Col
} from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { formatDate, validateClassSelection } from './utils';
import { FIELD_MAPPINGS } from '../../config';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS, CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;

/**
 * Component to display available classes for selection
 * Used for Case 3a when student needs to select from available classes
 * @param {Object} studentData - Student data from API
 * @param {Array} classList - List of available classes
 * @param {boolean} showWarning - Whether to show warning about invalid reservation
 * @param {Function} onClassSelect - Function to call when selecting a class
 * @param {Function} onSwitchToCustomSchedule - Function to call when switching to custom schedule
 * @param {boolean} loading - Loading state
 */
const ClassSelection = ({ 
  studentData, 
  classList = [], 
  showWarning = false, 
  onClassSelect, 
  onSwitchToCustomSchedule,
  loading = false
}) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Process classes when classList changes
  useEffect(() => {
    setFilteredClasses(classList);
  }, [classList]);

  // Handle search
  const handleSearch = (value) => {
    setTableLoading(true);
    
    setTimeout(() => {
      if (!value) {
        setFilteredClasses(classList);
        setTableLoading(false);
        return;
      }

      const filtered = classList.filter(classItem => {
        const searchValue = value.toLowerCase();
        
        // Search in multiple fields
        return (
          (classItem[CLASS_FIELDS.CODE] && classItem[CLASS_FIELDS.CODE].toLowerCase().includes(searchValue)) ||
          (classItem.schedules && classItem.schedules.some(s => 
            s.weekday.toLowerCase().includes(searchValue) || 
            s.time.toLowerCase().includes(searchValue)
          )) ||
          (classItem[CLASS_FIELDS.START_DATE] && classItem[CLASS_FIELDS.START_DATE].toLowerCase().includes(searchValue))
        );
      });
      
      setFilteredClasses(filtered);
      setTableLoading(false);
    }, 300);
  };
  
  // Handle row selection
  const handleRowSelection = (record) => {
    const validationResult = validateClassSelection(studentData, record);
    
    if (!validationResult.valid) {
      // This shouldn't happen as we're filtering classes, but just in case
      alert(validationResult.message);
      return;
    }
    
    setSelectedClass(record);
  };
  
  // Render class schedules
  const renderSchedules = (schedules) => {
    if (!schedules || schedules.length === 0) return <Text type="secondary">Không có lịch</Text>;
    
    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {schedules.map((schedule, index) => (
          <Tag color="blue" key={index} style={{ padding: '2px 6px' }}>
            <Space size={8} align="center">
              <CalendarOutlined style={{ fontSize: '12px' }} />
              <span style={{ marginRight: '8px' }}>{schedule.weekday}</span>
              <ClockCircleOutlined style={{ fontSize: '12px' }} />
              <span>{schedule.time}</span>
            </Space>
          </Tag>
        ))}
      </Space>
    );
  };
  
  // Table columns
  const columns = [
    {
      title: 'Mã lớp',
      dataIndex: CLASS_FIELDS.CODE,
      key: 'code',
      sorter: (a, b) => {
        if (!a[CLASS_FIELDS.CODE] || !b[CLASS_FIELDS.CODE]) return 0;
        return a[CLASS_FIELDS.CODE].localeCompare(b[CLASS_FIELDS.CODE]);
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Ngày học',
      dataIndex: CLASS_FIELDS.WEEKDAY,
      key: 'weekday',
      render: (text) => text || 'Không có thông tin',
    },
    {
      title: 'Giờ học',
      key: 'time',
      render: (_, record) => (
        <span>{`${record[CLASS_FIELDS.START_TIME] || ''} - ${record[CLASS_FIELDS.END_TIME] || ''}`}</span>
      ),
    },
    {
      title: 'Sĩ số',
      key: 'capacity',
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <span>
            {record[CLASS_FIELDS.REGISTERED] || 0}/
            {record[CLASS_FIELDS.TOTAL_SLOTS] || 0}
          </span>
        </Space>
      ),
      sorter: (a, b) => {
        const aRatio = (a[CLASS_FIELDS.REGISTERED] || 0) / (a[CLASS_FIELDS.TOTAL_SLOTS] || 1);
        const bRatio = (b[CLASS_FIELDS.REGISTERED] || 0) / (b[CLASS_FIELDS.TOTAL_SLOTS] || 1);
        return aRatio - bRatio;
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Ngày khai giảng',
      dataIndex: CLASS_FIELDS.START_DATE,
      key: 'startDate',
      render: (text) => formatDate(text),
      sorter: (a, b) => {
        if (!a[CLASS_FIELDS.START_DATE] || !b[CLASS_FIELDS.START_DATE]) return 0;
        return new Date(a[CLASS_FIELDS.START_DATE]) - new Date(b[CLASS_FIELDS.START_DATE]);
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (text, record) => (
        <Button 
          type="primary" 
          onClick={() => handleRowSelection(record)}
          size="small"
        >
          Chọn
        </Button>
      ),
    },
  ];
  
  // Render selected class details
  const renderSelectedClass = () => {
    if (!selectedClass) return null;
    
    return (
      <Card 
        type="inner" 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Thông tin lớp đã chọn</span>
          </Space>
        }
        style={{ marginTop: '20px', marginBottom: '20px' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Mã lớp:</Text> {selectedClass[CLASS_FIELDS.CODE]}
          </div>
          <div>
            <Text strong>Ngày học:</Text> {selectedClass[CLASS_FIELDS.WEEKDAY] || 'Không có thông tin'}
          </div>
          <div>
            <Text strong>Giờ học:</Text> {`${selectedClass[CLASS_FIELDS.START_TIME] || ''} - ${selectedClass[CLASS_FIELDS.END_TIME] || ''}`}
          </div>
          <div>
            <Text strong>Ngày khai giảng:</Text> {formatDate(selectedClass[CLASS_FIELDS.START_DATE])}
          </div>
          <div>
            <Text strong>Sĩ số hiện tại:</Text> {selectedClass[CLASS_FIELDS.REGISTERED] || 0}/{selectedClass[CLASS_FIELDS.TOTAL_SLOTS] || 0}
          </div>
        </Space>
      </Card>
    );
  };

  // If data is still loading, show skeleton
  if (loading && !classList.length) {
    return (
      <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  // Add schedule info if missing
  const processedClasses = classList.map(classItem => {
    if (!classItem.schedules || classItem.schedules.length === 0) {
      return {
        ...classItem,
        schedules: [{
          weekday: classItem[CLASS_FIELDS.WEEKDAY] || '',
          time: `${classItem[CLASS_FIELDS.START_TIME] || ''} - ${classItem[CLASS_FIELDS.END_TIME] || ''}`
        }]
      };
    }
    return classItem;
  });

  return (
    <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
      <Title level={5} className="card-title">
        Chọn lớp học phù hợp
      </Title>
      <Divider />
      
      {showWarning && (
        <Alert
          message="Cảnh báo"
          description={`Bạn đã giữ chỗ trước đó, nhưng chúng tôi không tìm thấy ${studentData[STUDENT_FIELDS.CLASS_RESERVATION] || 'mã lớp'} của bạn. Vui lòng liên hệ với tư vấn viên của bạn, hoặc tiếp tục chọn lịch học theo danh sách dưới đây.`}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '20px' }}
        />
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <Paragraph>
          Dưới đây là các lớp học phù hợp với khóa học và trình độ của bạn. Vui lòng chọn lớp phù hợp với lịch trống của bạn.
        </Paragraph>
      </div>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} md={12}>
          <Search
            placeholder="Tìm kiếm lớp học..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
      </Row>
      
      {filteredClasses && filteredClasses.length > 0 ? (
        <Table 
          dataSource={filteredClasses} 
          columns={columns} 
          rowKey={(record) => `${record[CLASS_FIELDS.CODE]}_${record[CLASS_FIELDS.WEEKDAY]}_${record[CLASS_FIELDS.START_TIME]}`} 
          pagination={{ 
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total) => `Tổng ${total} lớp học`
          }}
          loading={tableLoading}
          scroll={{ x: 'max-content' }}
        />
      ) : (
        <Empty 
          description={
            classList.length > 0 
              ? "Không tìm thấy lớp học phù hợp với tìm kiếm của bạn" 
              : "Không tìm thấy lớp học phù hợp"
          }
          style={{ margin: '40px 0' }}
        />
      )}
      
      {renderSelectedClass()}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <Button onClick={onSwitchToCustomSchedule} disabled={loading}>
          Chọn lịch khác
        </Button>
        <Button 
          type="primary" 
          onClick={() => onClassSelect(selectedClass)}
          disabled={!selectedClass || loading}
          loading={loading}
        >
          Xác nhận lịch học
        </Button>
      </div>
    </Card>
  );
};

export default ClassSelection;