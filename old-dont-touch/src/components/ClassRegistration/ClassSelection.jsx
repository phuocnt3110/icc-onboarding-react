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
  Tooltip,
  Modal,
  message
} from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { formatDate, validateClassSelection } from './utils';
import { FIELD_MAPPINGS } from '../../config';
import _ from 'lodash';
import './ClassSelectionStyle.css';

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
 * @param {Function} onRefresh - Function to refresh class list data
 */
const ClassSelection = ({ 
  studentData, 
  classList = [], 
  showWarning = false, 
  onClassSelect, 
  onSwitchToCustomSchedule,
  loading = false,
  onRefresh
}) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [groupedClasses, setGroupedClasses] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [classToConfirm, setClassToConfirm] = useState(null);

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
    console.log("Đã nhận nút chọn");
    
    if (schedule) {
      // Nếu người dùng chọn một lịch học cụ thể từ tag
      const classToSelect = schedule.originalClass;
      
      // Tìm record đầy đủ từ groupedClasses có chứa tất cả lịch học 
      const fullRecord = groupedClasses.find(item => 
        item[CLASS_FIELDS.CODE] === classToSelect[CLASS_FIELDS.CODE]
      );
      
      // Kiểm tra tính hợp lệ của lớp học
      const validationResult = validateClassSelection(studentData, classToSelect);
      if (!validationResult.valid) {
        message.error(validationResult.message);
        return;
      }
      
      // Lưu lại record đầy đủ để hiển thị tất cả lịch học
      setClassToConfirm(fullRecord);
      setSelectedSchedule(schedule);
    } else {
      // Nếu người dùng nhấn nút "Chọn" trên bảng
      // Kiểm tra tính hợp lệ của lớp học
      const validationResult = validateClassSelection(studentData, record);
      if (!validationResult.valid) {
        message.error(validationResult.message);
        return;
      }
      
      // Lưu lại record đã được gom nhóm (đã có allSchedules)
      setClassToConfirm(record);
    }
    
    // Hiển thị modal xác nhận
    setIsModalVisible(true);
  };
  
  // Xác nhận chọn lớp
  const handleConfirmSelection = () => {
    if (classToConfirm) {
      // Nếu có selectedSchedule, truyền originalClass của schedule đó
      // Nếu không, truyền toàn bộ classToConfirm
      const classToSend = selectedSchedule 
        ? selectedSchedule.originalClass 
        : classToConfirm;
      
      // Gọi onClassSelect để chuyển đến màn hình Success
      onClassSelect(classToSend);
    }
    
    // Đóng modal
    setIsModalVisible(false);
  };
  
  // Hủy chọn lớp
  const handleCancelSelection = () => {
    // Đóng modal
    setIsModalVisible(false);
    
    // Reset class đã chọn
    setClassToConfirm(null);
    
    // Reset các state liên quan
    setSelectedClass(null);
    setSelectedSchedule(null);
    
    // Hiển thị thông báo
    message.info('Đã hủy chọn lớp, đang tải lại dữ liệu...');
    
    // Đặt bảng về trạng thái loading
    setTableLoading(true);
    
    // Gọi callback để tải lại dữ liệu từ server
    if (typeof onRefresh === 'function') {
      onRefresh().then(() => {
        // Đảm bảo tableLoading được đặt về false sau khi refresh xong
        setTableLoading(false);
      }).catch(() => {
        // Đảm bảo tableLoading được đặt về false ngay cả khi refresh thất bại
        setTableLoading(false);
      });
    } else {
      // Fallback nếu không có onRefresh
      setTimeout(() => {
        setTableLoading(false);
      }, 500);
    }
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
        >
          Chọn
        </Button>
      ),
      width: 100,
    },
  ];

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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <Button onClick={onSwitchToCustomSchedule} disabled={loading}>
          Tôi không thấy lịch học phù hợp
        </Button>
      </div>
      
      {/* Modal xác nhận chọn lớp */}
      <Modal
        title={
          <Space>
            <QuestionCircleOutlined style={{ color: '#1890ff' }} />
            <span>Xác nhận chọn lớp</span>
          </Space>
        }
        open={isModalVisible}
        onOk={handleConfirmSelection}
        onCancel={handleCancelSelection}
        okText="Xác nhận"
        cancelText="Hủy"
        centered
      >
        {classToConfirm && (
          <div>
            <Paragraph>
              Bạn có chắc chắn muốn chọn lớp này không?
            </Paragraph>
            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', marginTop: '12px' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong>Mã lớp:</Text> {classToConfirm[CLASS_FIELDS.CODE]}
                </div>
                <div>
                  <Text strong>Lịch học:</Text>
                  <div style={{ marginTop: '8px' }}>
                    {classToConfirm.allSchedules && classToConfirm.allSchedules.length > 0 ? (
                      // Hiển thị tất cả lịch học từ allSchedules
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {classToConfirm.allSchedules.map((schedule, index) => (
                          <Tag color="blue" key={index}>
                            <Space>
                              <CalendarOutlined /> {schedule.weekday}
                              <ClockCircleOutlined /> {schedule.time}
                            </Space>
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      // Backup: Hiển thị lịch học từ schedules hoặc trường nguyên bản
                      classToConfirm.schedules && classToConfirm.schedules.length > 0 ? (
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          {classToConfirm.schedules.map((schedule, index) => (
                            <Tag color="blue" key={index}>
                              <Space>
                                <CalendarOutlined /> {schedule.weekday}
                                <ClockCircleOutlined /> {schedule.time}
                              </Space>
                            </Tag>
                          ))}
                        </Space>
                      ) : (
                        <Tag color="blue">
                          <Space>
                            <CalendarOutlined /> {classToConfirm[CLASS_FIELDS.WEEKDAY] || ''}
                            <ClockCircleOutlined /> {
                              `${classToConfirm[CLASS_FIELDS.START_TIME] || ''} - ${classToConfirm[CLASS_FIELDS.END_TIME] || ''}`
                            }
                          </Space>
                        </Tag>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <Text strong>Ngày khai giảng:</Text> {formatDate(classToConfirm[CLASS_FIELDS.START_DATE])}
                </div>
                <div>
                  <Text strong>Sĩ số hiện tại:</Text> {classToConfirm[CLASS_FIELDS.REGISTERED] || 0}/{classToConfirm[CLASS_FIELDS.TOTAL_SLOTS] || 0}
                </div>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ClassSelection;