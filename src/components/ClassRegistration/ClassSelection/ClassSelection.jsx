import React, { useState, useEffect, useCallback } from 'react';
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
  message,
  Spin,
  Select,
  DatePicker,
  Radio,
  Collapse,
  Checkbox,
  Popover,
  Dropdown
} from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SunOutlined,
  DownOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { FIELD_MAPPINGS, MESSAGES } from '../../../config';
import _ from 'lodash';
import '../../../styles/class-selection.css';
import { useClass } from '../../../contexts/ClassContext';
import { useStudent } from '../../../contexts/StudentContext';
import '../../../styles/index.css';
import { checkClassAvailability, fetchAvailableClasses, updateClassRegistration } from '../../../services/api/class';
import { formatDate, validateClassSelection, processClassList, formatSchedule } from '../../../services/utils/class-registration';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

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
  
  // Thêm các state mới cho filter
  const [weekdayFilter, setWeekdayFilter] = useState([]);
  const [timeFilter, setTimeFilter] = useState([]);
  const [startDateRange, setStartDateRange] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  
  // Hook xử lý responsive
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Hàm xử lý resize của window
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  // Theo dõi thay đổi kích thước màn hình
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);
  
  // Hàm xử lý thay đổi thứ học
  const handleWeekdayChange = (values) => {
    console.log('Chọn thứ học:', values);
    setWeekdayFilter(values);
  };
  
  // Hàm xử lý thay đổi ca học
  const handleTimeFilterChange = (values) => {
    console.log('Chọn ca học:', values);
    setTimeFilter(values);
  };
  
  // Hàm đặt lại tất cả bộ lọc
  const handleResetFilters = () => {
    console.log('Đặt lại tất cả bộ lọc');
    setWeekdayFilter([]);
    setTimeFilter([]);
    setStartDateRange(null);
    setSearchText('');
  };

  // Process and group classes when classList changes
  useEffect(() => {
    if (!classList || !classList.length) {
      console.log('DISPLAY - Không có dữ liệu lớp học để hiển thị');
      setFilteredClasses([]);
      setGroupedClasses([]);
      return;
    }

    // Log thông tin tổng quan về danh sách lớp học cần hiển thị
    console.log(`DISPLAY - Đã nhận ${classList.length} lớp học để hiển thị trong danh sách`);
    
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
    
    console.log(`DISPLAY - Nhóm thành ${Object.keys(grouped).length} mã lớp khác nhau`);
    
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
    
    console.log(`DISPLAY - Có ${transformedData.length} lớp học sau khi xử lý để hiển thị trên giao diện`);
    
    setGroupedClasses(transformedData);
  }, [classList]);
  
  // Log khi trạng thái groupedClasses thay đổi
  useEffect(() => {
    if (groupedClasses.length === 0) {
      console.log('DISPLAY - Không có dữ liệu lớp học để hiển thị trong bảng');
    }
  }, [groupedClasses]);

  // Thực hiện lọc data với các bộ lọc
  useEffect(() => {
    if (!groupedClasses.length) return;
    
    let result = [...groupedClasses];
    let filtersApplied = false;
    
    // Lọc theo thứ học trong tuần (điều kiện AND)
    if (weekdayFilter.length > 0) {
      filtersApplied = true;
      result = result.filter(classItem => {
        // Kiểm tra tất cả các thứ được chọn đều tồn tại trong lịch học của lớp
        return weekdayFilter.every(day => {
          return classItem.allSchedules?.some(schedule => schedule.weekday === day);
        });
      });
      console.log(`Sau khi lọc theo thứ học (${weekdayFilter.join(', ')}): ${result.length} lớp`);
    }
    
    // Lọc theo ca học (sáng, chiều, tối)
    if (timeFilter.length > 0) {
      filtersApplied = true;
      result = result.filter(classItem => {
        return classItem.allSchedules?.some(schedule => {
          // Kiểm tra xem schedule.time có tồn tại và đúng định dạng không
          if (!schedule.time || typeof schedule.time !== 'string') {
            console.log('Lỗi: Lịch học không có thời gian hoặc định dạng không đúng:', schedule);
            return false;
          }

          try {
            const timeParts = schedule.time.split(' - ');
            if (!timeParts || timeParts.length < 1) return false;
            
            const startTimePart = timeParts[0].trim();
            if (!startTimePart) return false;
            
            const hourMinParts = startTimePart.split(':');
            if (!hourMinParts || hourMinParts.length < 1) return false;
            
            const startHour = parseInt(hourMinParts[0]);
            if (isNaN(startHour)) return false;
            
            console.log(`Ca học: ${schedule.time}, giờ bắt đầu: ${startHour}, đang kiểm tra với: ${timeFilter.join(', ')}`);
            
            // Kiểm tra từng loại ca học
            if (timeFilter.includes('sáng') && startHour >= 6 && startHour < 12) return true;
            if (timeFilter.includes('chiều') && startHour >= 12 && startHour < 18) return true;
            if (timeFilter.includes('tối') && (startHour >= 18 || startHour < 6)) return true;
          } catch (error) {
            console.error('Lỗi khi xử lý thời gian:', error, schedule);
            return false;
          }
          
          return false;
        });
      });
      console.log(`Sau khi lọc theo ca học (${timeFilter.join(', ')}): ${result.length} lớp`);
    }
    
    // Lọc theo ngày khai giảng
    if (startDateRange && startDateRange[0] && startDateRange[1]) {
      filtersApplied = true;
      const startDate = new Date(startDateRange[0]);
      const endDate = new Date(startDateRange[1]);
      
      // Đặt giờ về 0 cho startDate và 23:59:59 cho endDate để tính cả ngày
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      result = result.filter(classItem => {
        const rawDate = classItem[CLASS_FIELDS.START_DATE];
        if (!rawDate) return false;
        
        // Chuyển chuỗi ngày tháng sang đối tượng Date
        const classStartDate = new Date(rawDate);
        classStartDate.setHours(0, 0, 0, 0); // Reset giờ để so sánh chính xác
        
        return classStartDate >= startDate && classStartDate <= endDate;
      });
      console.log(`Sau khi lọc theo ngày khai giảng (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}): ${result.length} lớp`);
    }
    
    // Chỉ set filteredData nếu có bộ lọc nào được áp dụng và có kết quả lọc
    if (filtersApplied) {
      console.log(`Kết quả cuối cùng sau khi lọc: ${result.length} lớp`);
      setFilteredData(result);
    } else {
      setFilteredData([]);
    }
  }, [groupedClasses, weekdayFilter, timeFilter, startDateRange]);
  
  // Chúng ta đã loại bỏ toggleFilter vì đã sử dụng cách tiếp cận Popover
  const toggleFilter = () => {
    console.log('Hàm này đã không còn sử dụng');
    // setFilterVisible đã bị xóa
  };
  
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
      
      // Kiểm tra đầy đủ dữ liệu trước khi validate
      if (!studentData || !classToSelect) {
        message.error('Thiếu thông tin học viên hoặc lớp học');
        console.error('Thiếu dữ liệu:', { studentData, classToSelect });
        return;
      }

      // Kiểm tra tính hợp lệ của lớp học
      try {
        const validationResult = validateClassSelection(studentData, classToSelect);
        if (!validationResult.valid) {
          message.error(validationResult.message);
          return;
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra tính hợp lệ của lớp học:', error);
        message.error('Không thể kiểm tra tính hợp lệ của lớp học');
        return;
      }
      
      // Lưu lại record đầy đủ để hiển thị tất cả lịch học
      setClassToConfirm(fullRecord);
      setSelectedSchedule(schedule);
    } else {
      // Nếu người dùng nhấn nút "Chọn" trên bảng
      // Kiểm tra dữ liệu đầu vào trước khi validate
      if (!studentData || !record) {
        message.error('Thiếu thông tin học viên hoặc lớp học');
        console.error('Thiếu dữ liệu:', { studentData, record });
        return;
      }

      try {
        // Kiểm tra tính hợp lệ của lớp học
        const validationResult = validateClassSelection(studentData, record);
        if (!validationResult.valid) {
          message.error(validationResult.message);
          return;
        }
        
        // Lưu lại record đã được gom nhóm (đã có allSchedules)
        setClassToConfirm(record);
      } catch (error) {
        console.error('Lỗi khi kiểm tra tính hợp lệ của lớp học:', error);
        message.error('Không thể kiểm tra tính hợp lệ của lớp học');
        return;
      }
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
  
  // Table columns - tối ưu lại để phù hợp với mobile và thiết bị nhỏ
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
      width: isMobile ? 90 : 110,
      fixed: 'left',
      render: (text) => (
        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</div>
      ),
    },
    {
      title: 'Lịch học',
      key: 'schedules',
      render: (_, record) => {
        // Sử dụng state isMobile từ responsive hook để xử lý hiển thị
        if (isMobile) {
          // Hiển thị compact hơn cho mobile
          const firstSchedule = record.allSchedules?.[0];
          if (!firstSchedule) return <Text type="secondary">Không có lịch</Text>;
          
          return (
            <Tooltip title="Nhấn để xem tất cả lịch học">
              <div onClick={() => handleClassSelection(null, firstSchedule)}>
                <Tag color="blue" style={{cursor: 'pointer'}}>
                  <CalendarOutlined /> {firstSchedule.weekday} 
                  <ClockCircleOutlined style={{ marginLeft: '4px' }} />
                </Tag>
                {record.allSchedules.length > 1 && 
                  <Text type="secondary" style={{ marginLeft: '4px' }}>+{record.allSchedules.length - 1}</Text>
                }
              </div>
            </Tooltip>
          );
        } else {
          // Hiển thị đầy đủ cho desktop
          return renderSchedules(record.allSchedules);
        }
      },
      width: isMobile ? 130 : 210,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: isMobile ? 'Sĩ số' : 'Sĩ số',
      key: 'capacity',
      render: (_, record) => {
        // Hiển thị gọn cho mobile, đầy đủ cho desktop
        return (
          <Space size={2}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>
              {record[CLASS_FIELDS.REGISTERED] || 0}/
              {record[CLASS_FIELDS.TOTAL_SLOTS] || 0}
            </span>
          </Space>
        );
      },
      sorter: (a, b) => {
        const aRatio = (a[CLASS_FIELDS.REGISTERED] || 0) / (a[CLASS_FIELDS.TOTAL_SLOTS] || 1);
        const bRatio = (b[CLASS_FIELDS.REGISTERED] || 0) / (b[CLASS_FIELDS.TOTAL_SLOTS] || 1);
        return aRatio - bRatio;
      },
      width: isMobile ? 60 : 80,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: isMobile ? 'KG' : 'Khai giảng',
      dataIndex: CLASS_FIELDS.START_DATE,
      key: 'startDate',
      render: (text) => {
        if (!text) return <Text type="secondary">-</Text>;
        
        // Hiển thị gọn cho mobile
        if (isMobile) {
          const date = new Date(text);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        }
        
        // Hiển thị đầy đủ cho desktop
        return formatDate(text);
      },
      sorter: (a, b) => {
        if (!a[CLASS_FIELDS.START_DATE] || !b[CLASS_FIELDS.START_DATE]) return 0;
        return new Date(a[CLASS_FIELDS.START_DATE]) - new Date(b[CLASS_FIELDS.START_DATE]);
      },
      width: isMobile ? 60 : 110,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => handleClassSelection(record)}
          size="small"
          icon={isMobile ? <CheckCircleOutlined /> : null}
        >
          {isMobile ? '' : 'Chọn'}
        </Button>
      ),
      width: isMobile ? 50 : 70,
      fixed: 'right',
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
    <Card style={{ borderRadius: '8px', marginBottom: '20px', width: '100%', margin: '0 auto' }}>
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
      
      <div style={{ marginBottom: '24px', padding: '0 8px' }}>
        <Paragraph style={{ fontSize: '16px' }}>
          Dưới đây là các lớp học phù hợp với khóa học và trình độ của bạn. Vui lòng chọn lớp phù hợp với lịch trống của bạn.
        </Paragraph>
      </div>
      
      <div style={{ marginBottom: '12px', textAlign: 'right' }}>
        <Space wrap size="small" className="filter-buttons">
          <Button 
            size="small"
            shape="circle"
            icon={<ReloadOutlined />}
            onClick={handleResetFilters}
            disabled={!(weekdayFilter.length > 0 || timeFilter.length > 0 || startDateRange)}
            title="Đặt lại bộ lọc"
          />
          <Popover 
            content={
              <Checkbox.Group 
                options={['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']} 
                value={weekdayFilter}
                onChange={handleWeekdayChange}
              />
            }
            title="Chọn thứ học"
            trigger="click"
            placement="bottom"
          >
            <Button 
              icon={<CalendarOutlined />}
              type={weekdayFilter.length > 0 ? 'primary' : 'default'}
              size="small"
            >
              Thứ học {weekdayFilter.length > 0 && `(${weekdayFilter.length})`}
            </Button>
          </Popover>
          
          <Popover
            content={
              <Checkbox.Group 
                options={[{ label: 'Sáng (6h-12h)', value: 'sáng' }, 
                          { label: 'Chiều (12h-18h)', value: 'chiều' }, 
                          { label: 'Tối (18h-6h)', value: 'tối' }]} 
                value={timeFilter}
                onChange={handleTimeFilterChange}
              />
            }
            title="Chọn ca học"
            trigger="click"
            placement="bottom"
          >
            <Button 
              icon={<ClockCircleOutlined />}
              type={timeFilter.length > 0 ? 'primary' : 'default'}
              size="small"
            >
              Ca học {timeFilter.length > 0 && `(${timeFilter.length})`}
            </Button>
          </Popover>
          
          <Popover
            content={
              <div style={{ padding: '8px 0' }}>
                <RangePicker 
                  style={{ width: '230px' }} 
                  format="DD/MM/YYYY"
                  value={startDateRange}
                  onChange={setStartDateRange}
                />
              </div>
            }
            title="Chọn ngày khai giảng"
            trigger="click"
            placement="bottom"
          >
            <Button 
              icon={<CalendarOutlined />}
              type={startDateRange ? 'primary' : 'default'}
              size="small"
            >
              Ngày KG
            </Button>
          </Popover>
          
          {/* Chỉ sử dụng icon reset ở đầu danh sách */}
        </Space>
      </div>
      
      {groupedClasses && groupedClasses.length > 0 ? (
        <div className="table-responsive" style={{ width: '100%', overflow: 'auto' }}>
          <Table 
            dataSource={filteredData.length > 0 || (weekdayFilter.length > 0 || timeFilter.length > 0 || startDateRange) ? filteredData : groupedClasses} 
            columns={columns} 
            rowKey={(record) => record[CLASS_FIELDS.CODE]} 
            pagination={{ 
              pageSize: 10, // Tăng số dòng mỗi trang
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50'],
              showTotal: (total) => `Tổng ${total} lớp học`
            }}
            loading={tableLoading}
            scroll={{ x: 800 }} // Giảm chiều rộng tối thiểu của bảng
            style={{ width: '100%' }}
            size="middle"
            locale={{
              emptyText: (weekdayFilter.length > 0 || timeFilter.length > 0 || startDateRange) ? 
                'Không có lớp học nào thỏa mãn điều kiện lọc' : 
                'Không có lớp học nào'
            }}
          />
        </div>
      ) : (
        <Empty 
          description={
            classList.length > 0 
              ? "Không tìm thấy lớp học phù hợp với tìm kiếm của bạn" 
              : "Không tìm thấy lớp học phù hợp"
          }
          style={{ margin: '60px 0', padding: '20px' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '0 8px' }}>
        <Button 
          onClick={onSwitchToCustomSchedule} 
          disabled={loading}
          size="large"
          style={{ paddingLeft: '20px', paddingRight: '20px' }}
        >
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
        width={600}
        bodyStyle={{ padding: '24px' }}
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