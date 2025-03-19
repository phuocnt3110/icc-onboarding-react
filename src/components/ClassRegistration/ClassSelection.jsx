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

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

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
          (classItem.Classcode && classItem.Classcode.toLowerCase().includes(searchValue)) ||
          (classItem.schedules && classItem.schedules.some(s => 
            s.weekday.toLowerCase().includes(searchValue) || 
            s.time.toLowerCase().includes(searchValue)
          )) ||
          (classItem.Start_date && classItem.Start_date.toLowerCase().includes(searchValue))
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
      <Space direction="vertical" size="small">
        {schedules.map((schedule, index) => (
          <Tag color="blue" key={index}>
            <Space>
              <CalendarOutlined /> {schedule.weekday}
              <ClockCircleOutlined /> {schedule.time}
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
      dataIndex: 'Classcode',
      key: 'Classcode',
      sorter: (a, b) => {
        if (!a.Classcode || !b.Classcode) return 0;
        return a.Classcode.localeCompare(b.Classcode);
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Lịch học',
      dataIndex: 'schedules',
      key: 'schedules',
      render: renderSchedules,
    },
    {
      title: 'Sĩ số',
      key: 'capacity',
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <span>{record.soDaDangKy || 0}/{record.siSo || 0}</span>
        </Space>
      ),
      sorter: (a, b) => {
        const aRatio = (a.soDaDangKy || 0) / (a.siSo || 1);
        const bRatio = (b.soDaDangKy || 0) / (b.siSo || 1);
        return aRatio - bRatio;
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Ngày khai giảng',
      dataIndex: 'Start_date',
      key: 'Start_date',
      render: (text) => formatDate(text),
      sorter: (a, b) => {
        if (!a.Start_date || !b.Start_date) return 0;
        return new Date(a.Start_date) - new Date(b.Start_date);
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
            <Text strong>Mã lớp:</Text> {selectedClass.Classcode}
          </div>
          <div>
            <Text strong>Lịch học:</Text>
            <div style={{ marginTop: '8px' }}>
              {renderSchedules(selectedClass.schedules)}
            </div>
          </div>
          <div>
            <Text strong>Ngày khai giảng:</Text> {formatDate(selectedClass.Start_date)}
          </div>
          <div>
            <Text strong>Sĩ số hiện tại:</Text> {selectedClass.soDaDangKy || 0}/{selectedClass.siSo || 0}
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

  return (
    <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
      <Title level={5} className="card-title">
        Chọn lớp học phù hợp
      </Title>
      <Divider />
      
      {showWarning && (
        <Alert
          message="Cảnh báo"
          description={`Bạn đã giữ chỗ trước đó, nhưng chúng tôi không tìm thấy ${studentData?.maLopBanGiao || 'mã lớp'} của bạn. Vui lòng liên hệ với tư vấn viên của bạn, hoặc tiếp tục chọn lịch học theo danh sách dưới đây.`}
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
          rowKey="Classcode" 
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