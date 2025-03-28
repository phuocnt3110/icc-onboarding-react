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
  Col,
  Tooltip
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
import _ from 'lodash';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Extract field mappings for easier access
const { STUDENT: STUDENT_FIELDS, CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;

/**
 * Component to display available classes for selection
 * Uses CombinedView approach to group classes by class code
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
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [groupedClasses, setGroupedClasses] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Process and group classes when classList changes
  useEffect(() => {
    if (!classList || !classList.length) {
      setFilteredClasses([]);
      setGroupedClasses([]);
      return;
    }
    
    // Ensure all classes have schedules property
    const classesWithSchedules = classList.map(classItem => {
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
    
    setFilteredClasses(classesWithSchedules);
    
    // Group classes by class code
    const grouped = _.groupBy(classesWithSchedules, CLASS_FIELDS.CODE);
    
    // Create array of grouped classes
    const transformedData = Object.keys(grouped).map(classCode => {
      const classGroup = grouped[classCode];
      const firstClass = classGroup[0]; // Use first class for common properties
      
      // Collect all schedules from all classes with this code
      const allSchedules = [];
      classGroup.forEach(cls => {
        if (cls.schedules && cls.schedules.length) {
          cls.schedules.forEach(schedule => {
            allSchedules.push({
              ...schedule,
              originalClass: cls // Store reference to original class for selection
            });
          });
        }
      });
      
      return {
        ...firstClass,
        key: classCode,
        allSchedules,
        originalClasses: classGroup
      };
    });
    
    setGroupedClasses(transformedData);
  }, [classList]);

  // Handle search
  const handleSearch = (value) => {
    setTableLoading(true);
    
    setTimeout(() => {
      if (!value) {
        setFilteredClasses(classList);
        // Re-group classes
        const grouped = _.groupBy(classList, CLASS_FIELDS.CODE);
        const transformedData = Object.keys(grouped).map(classCode => {
          const classGroup = grouped[classCode];
          const firstClass = classGroup[0];
          
          const allSchedules = [];
          classGroup.forEach(cls => {
            if (cls.schedules && cls.schedules.length) {
              cls.schedules.forEach(schedule => {
                allSchedules.push({
                  ...schedule,
                  originalClass: cls
                });
              });
            }
          });
          
          return {
            ...firstClass,
            key: classCode,
            allSchedules,
            originalClasses: classGroup
          };
        });
        
        setGroupedClasses(transformedData);
        setTableLoading(false);
        return;
      }

      const searchValue = value.toLowerCase();
      
      // Filter the original list
      const filtered = classList.filter(classItem => {
        return (
          (classItem[CLASS_FIELDS.CODE] && classItem[CLASS_FIELDS.CODE].toLowerCase().includes(searchValue)) ||
          (classItem[CLASS_FIELDS.WEEKDAY] && classItem[CLASS_FIELDS.WEEKDAY].toLowerCase().includes(searchValue)) ||
          (classItem[CLASS_FIELDS.START_TIME] && classItem[CLASS_FIELDS.START_TIME].toLowerCase().includes(searchValue)) ||
          (classItem[CLASS_FIELDS.END_TIME] && classItem[CLASS_FIELDS.END_TIME].toLowerCase().includes(searchValue)) ||
          (classItem[CLASS_FIELDS.START_DATE] && classItem[CLASS_FIELDS.START_DATE].toLowerCase().includes(searchValue))
        );
      });
      
      setFilteredClasses(filtered);
      
      // Re-group filtered classes
      const grouped = _.groupBy(filtered, CLASS_FIELDS.CODE);
      const transformedData = Object.keys(grouped).map(classCode => {
        const classGroup = grouped[classCode];
        const firstClass = classGroup[0];
        
        const allSchedules = [];
        classGroup.forEach(cls => {
          if (cls.schedules && cls.schedules.length) {
            cls.schedules.forEach(schedule => {
              allSchedules.push({
                ...schedule,
                originalClass: cls
              });
            });
          }
        });
        
        return {
          ...firstClass,
          key: classCode,
          allSchedules,
          originalClasses: classGroup
        };
      });
      
      setGroupedClasses(transformedData);
      setTableLoading(false);
    }, 300);
  };
  
  // Handle class and schedule selection
  const handleClassSelection = (record, schedule) => {
    // If schedule is provided, use its original class
    const classToSelect = schedule ? schedule.originalClass : record;
    
    const validationResult = validateClassSelection(studentData, classToSelect);
    
    if (!validationResult.valid) {
      alert(validationResult.message);
      return;
    }
    
    setSelectedClass(classToSelect);
    setSelectedSchedule(schedule);
  };
  
  // Render class schedules as tags
  const renderSchedules = (schedules) => {
    if (!schedules || schedules.length === 0) return <Text type="secondary">Không có lịch</Text>;
    
    return (
      <Space size={[0, 8]} wrap>
        {schedules.map((schedule, index) => (
          <Tooltip 
            key={index} 
            title={`${schedule.weekday}: ${schedule.time}`}
          >
            <Tag 
              color="blue" 
              style={{ 
                cursor: 'pointer', 
                margin: '2px',
                background: selectedSchedule === schedule ? '#1890ff' : undefined,
                color: selectedSchedule === schedule ? 'white' : undefined
              }}
              onClick={() => handleClassSelection(null, schedule)}
            >
              <Space size={8} align="center">
                <CalendarOutlined style={{ fontSize: '12px' }} />
                <span style={{ marginRight: '4px' }}>{schedule.weekday}</span>
                <ClockCircleOutlined style={{ fontSize: '12px' }} />
                <span>{schedule.time}</span>
              </Space>
            </Tag>
          </Tooltip>
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
      width: 120,
    },
    {
      title: 'Lịch học',
      key: 'schedules',
      render: (_, record) => renderSchedules(record.allSchedules),
      width: 300,
    },
    {
      title: 'Sĩ số',
      key: 'capacity',
      render: (_, record) => (
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
      width: 100,
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
      width: 130,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => handleClassSelection(record)}
          size="small"
          disabled={selectedSchedule && selectedSchedule.originalClass[CLASS_FIELDS.CODE] !== record[CLASS_FIELDS.CODE]}
        >
          Chọn
        </Button>
      ),
      width: 100,
    },
  ];
  
  // Render selected class details
  const renderSelectedClass = () => {
    if (!selectedClass) return null;
    
    // If we have a selected schedule, display that specific schedule
    const scheduleToDisplay = selectedSchedule ? 
      [{
        weekday: selectedSchedule.weekday,
        time: selectedSchedule.time
      }] : 
      (selectedClass.schedules || []);
    
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
            <Text strong>Lịch học:</Text>
            <div style={{ marginTop: '8px' }}>
              {renderSchedules(scheduleToDisplay)}
            </div>
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
      
      {groupedClasses && groupedClasses.length > 0 ? (
        <Table 
          dataSource={groupedClasses} 
          columns={columns} 
          rowKey={(record) => record[CLASS_FIELDS.CODE]} 
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