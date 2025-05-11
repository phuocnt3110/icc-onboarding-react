import React, { useState } from 'react';
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
  Dropdown,
  Pagination
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
  ReloadOutlined,
  LeftOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { FIELD_MAPPINGS, MESSAGES } from '../../../config';
import '../../../styles/class-selection.css';
import '../../../styles/index.css';
import useClassSelectionLogic from './useClassSelectionLogic';
import FilterButton, { ResetFilterButton } from './FilterButton';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;
const { STUDENT: STUDENT_FIELDS, CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;

const ClassSelectionDesktop = ({
  student,
  classList = [],
  showWarning = false,
  onClassSelect,
  onSwitchToCustomSchedule,
  loading = false,
  onRefresh
}) => {
  // Lấy logic filter, group, state từ hook
  const {
    selectedClass, setSelectedClass,
    selectedSchedule, setSelectedSchedule,
    searchText, setSearchText,
    filteredClasses, groupedClasses,
    weekdayFilter, setWeekdayFilter,
    timeFilter, setTimeFilter,
    startDateRange, setStartDateRange,
    selectedQuickDate, setSelectedQuickDate,
    handleQuickDateSelect,
    resetAllFilters
  } = useClassSelectionLogic({ student, classList });

  // Debug log thứ tự danh sách lớp học mỗi khi groupedClasses thay đổi
  React.useEffect(() => {
    console.log('DEBUG - Danh sách lớp học truyền vào Table (groupedClasses):', groupedClasses.map(cls => ({
      maLop: cls.maLop,
      ngayDuKienKhaiGiang: cls.ngayDuKienKhaiGiang,
      ngayKhaiGiang: cls.ngayKhaiGiang
    })));
  }, [groupedClasses]);

  // Các state UI riêng cho desktop
  const [tableLoading, setTableLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [classToConfirm, setClassToConfirm] = useState(null);

  // Thứ tự các thứ trong tuần để sort
  const weekdayOrder = {
    'Hai': 1, 'Ba': 2, 'Tư': 3, 'Năm': 4, 'Sáu': 5, 'Bảy': 6, 'CN': 7
  };

  // Hàm so sánh thời gian bắt đầu ("08:00 - 10:00")
  function getStartTime(timeStr) {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }

  // Hàm render tag lịch học đã sort
  function renderSortedSchedules(schedules = []) {
    if (!schedules || !schedules.length) return <Text type="secondary">Không có dữ liệu</Text>;
    
    const sorted = [...schedules].sort((a, b) => {
      // Ưu tiên sort theo ngayHoc (thứ học), sau đó tới time
      const dayA = a.ngayHoc || a.weekday || '';
      const dayB = b.ngayHoc || b.weekday || '';
      if (dayA !== dayB) return dayA.localeCompare(dayB, 'vi');
      return getStartTime(a.time) - getStartTime(b.time);
    });
    
    return (
      <div className="tag-group">
        {sorted.map((sch, idx) => (
          <Tag key={idx} color="blue" icon={<CalendarOutlined />} className="schedule-tag">
            <span className="text-bold">{sch.ngayHoc || sch.weekday}</span> {sch.time}
          </Tag>
        ))}
      </div>
    );
  }

  return (
    <Card className="card card-md card-primary class-selection-desktop" bodyStyle={{ padding: 0 }}>
      <div className="card-header" style={{ padding: '16px 24px', borderBottom: 'none' }}>
        <Title level={4} style={{ fontSize: '20px', margin: '0 0 8px', fontWeight: 600 }}>Chọn lớp học phù hợp</Title>
        {/* Ghi chú mặc định hoặc ghi chú từ prop */}
        <Paragraph style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)', margin: '0 0 12px' }}>
          {typeof window !== 'undefined' && window.classSelectionNote
            ? window.classSelectionNote
            : ''}
        </Paragraph>
        {showWarning && (
          <Alert 
            type="warning" 
            showIcon 
            message={`Mã giữ chỗ "${student?.maLopBanGiao || student?.maGiuCho || 'xxxxxx'}" không còn hiệu lực. Vui lòng chọn lịch học theo danh sách dưới đây, hoặc liên hệ với bộ phận Chăm sóc khách hàng.`} 
            style={{ marginBottom: '16px', fontSize: '14px' }} 
          />
        )}
      </div>
      <div style={{ padding: '0 24px 24px' }}>
      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {/* Thứ học */}
        <FilterButton
          icon={<CalendarOutlined />}
          label="Thứ"
          count={weekdayFilter.length}
          title="Chọn thứ học"
          isActive={weekdayFilter.length > 0}
          popoverContent={
            <div className="filter-popover-content">
              <div className="filter-grid filter-grid-3">
                {[
                  { label: 'Thứ 2', value: 'Thứ 2' },
                  { label: 'Thứ 3', value: 'Thứ 3' },
                  { label: 'Thứ 4', value: 'Thứ 4' },
                  { label: 'Thứ 5', value: 'Thứ 5' },
                  { label: 'Thứ 6', value: 'Thứ 6' },
                  { label: 'Thứ 7', value: 'Thứ 7' },
                  { label: 'CN', value: 'Chủ Nhật' }
                ].map(day => (
                  <Button
                    key={day.value}
                    size="small"
                    type={weekdayFilter.includes(day.value) ? 'primary' : 'default'}
                    onClick={() => {
                      const newFilter = weekdayFilter.includes(day.value)
                        ? weekdayFilter.filter(item => item !== day.value)
                        : [...weekdayFilter, day.value];
                      setWeekdayFilter(newFilter);
                    }}
                    style={{ width: '100%', height: '28px', margin: '2px 0' }}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
              {weekdayFilter.length > 0 && (
                <Button 
                  size="small" 
                  type="link"
                  onClick={() => setWeekdayFilter([])}
                  style={{ padding: '4px 0', marginTop: '8px' }}
                >
                  Xóa lọc thứ
                </Button>
              )}
            </div>
          }
        />

        {/* Ca học */}
        <FilterButton
          icon={<ClockCircleOutlined />}
          label="Ca"
          count={timeFilter.length}
          title="Chọn ca học"
          isActive={timeFilter.length > 0}
          popoverContent={
            <div style={{ padding: '8px', minWidth: '200px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Sáng', value: 'sáng' },
                  { label: 'Chiều', value: 'chiều' },
                  { label: 'Tối', value: 'tối' }
                ].map(time => (
                  <Button
                    key={time.value}
                    size="small"
                    type={timeFilter.includes(time.value) ? 'primary' : 'default'}
                    onClick={() => {
                      const newFilter = timeFilter.includes(time.value)
                        ? timeFilter.filter(item => item !== time.value)
                        : [...timeFilter, time.value];
                      setTimeFilter(newFilter);
                    }}
                    style={{ width: '100%', height: '28px', margin: '2px 0' }}
                  >
                    {time.label}
                  </Button>
                ))}
              </div>
              {timeFilter.length > 0 && (
                <Button 
                  size="small" 
                  type="link"
                  onClick={() => setTimeFilter([])}
                  style={{ padding: '4px 0', marginTop: '8px' }}
                >
                  Xóa lọc ca
                </Button>
              )}
            </div>
          }
        />

        {/* Ngày khai giảng */}
        <FilterButton
          icon={<CalendarOutlined />}
          label="Ngày KG"
          title="Chọn ngày khai giảng"
          isActive={!!selectedQuickDate}
          popoverContent={
            <div style={{ padding: '8px', minWidth: '240px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Hôm nay', key: 'today' },
                  { label: 'Ngày mai', key: 'tomorrow' },
                  { label: 'Tuần này', key: 'thisWeek' },
                  { label: 'Tuần sau', key: 'nextWeek' },
                  { label: 'Tháng này', key: 'thisMonth' },
                  { label: 'Tháng sau', key: 'nextMonth' }
                ].map(opt => (
                  <Button
                    key={opt.key}
                    size="small"
                    type={selectedQuickDate === opt.key ? 'primary' : 'default'}
                    onClick={() => {
                      console.log('Date preset clicked:', opt.key);
                      // Toggle logic ở level UI
                      if (selectedQuickDate === opt.key) {
                        // Nếu đã chọn, bỏ chọn
                        handleQuickDateSelect(null);
                      } else {
                        // Nếu chưa chọn, chọn mới
                        handleQuickDateSelect(opt.key);
                      }
                    }}
                    style={{ width: '100%', height: '28px', margin: '2px 0' }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {selectedQuickDate && (
                <Button 
                  size="small" 
                  type="link"
                  onClick={() => handleQuickDateSelect(null)}
                  style={{ padding: '4px 0', marginTop: '8px' }}
                >
                  Xóa lọc ngày
                </Button>
              )}
            </div>
          }
        />

        {/* Reset filter */}
        <ResetFilterButton
          onClick={resetAllFilters}
          disabled={!(weekdayFilter.length > 0 || timeFilter.length > 0 || selectedQuickDate)}
        />
      </div>
      <Divider style={{ margin: '16px 0' }} />
      <Spin spinning={loading || tableLoading} tip="Đang tải danh sách lớp...">
        {/* Kiểm tra trạng thái trống dựa trên filteredClasses, nhưng vẫn hiển thị dữ liệu nhóm từ groupedClasses */}
        {filteredClasses.length === 0 ? (
          <Empty
            description={
              <div style={{ maxWidth: '80%', margin: '0 auto' }}>
                <Text style={{ fontSize: '14px', display: 'block', marginBottom: '12px', color: 'rgba(0, 0, 0, 0.65)' }}>
                  {(weekdayFilter.length > 0 || timeFilter.length > 0 || selectedQuickDate) 
                    ? 'Không có lớp nào phù hợp với bộ lọc đã chọn!' 
                    : 'Không có lớp nào khả dụng!'}
                </Text>
                {(weekdayFilter.length > 0 || timeFilter.length > 0 || selectedQuickDate) && (
                  <Button 
                    size="middle" 
                    type="primary"
                    onClick={resetAllFilters}
                    style={{ marginTop: '12px', height: '32px', borderRadius: '4px' }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '40px 0' }}
          />
        ) : (
          <>
            <Table
              dataSource={groupedClasses}
              rowKey={record => record.key || record.maLop}
              pagination={false}
              bordered
              size="middle"
              className="class-table"
              style={{ fontSize: '14px' }}
              columns={[
              {
                title: 'Mã lớp',
                dataIndex: 'maLop',
                key: 'maLop',
                width: '15%',
                render: text => <span style={{ fontWeight: 600, fontSize: '14px' }}>{text}</span>
              },

              {
                title: 'Lịch học',
                dataIndex: 'allSchedules',
                key: 'allSchedules',
                width: '30%',
                render: allSchedules => {
                  if (!allSchedules || !allSchedules.length) return <Text type="secondary" style={{ fontSize: '14px' }}>Không có dữ liệu</Text>;
                  
                  const sorted = [...allSchedules].sort((a, b) => {
                    // Ưu tiên sort theo ngayHoc (thứ học), sau đó tới time
                    const dayA = a.ngayHoc || a.weekday || '';
                    const dayB = b.ngayHoc || b.weekday || '';
                    if (dayA !== dayB) return dayA.localeCompare(dayB, 'vi');
                    return getStartTime(a.time) - getStartTime(b.time);
                  });
                  
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sorted.map((sch, idx) => (
                        <Tag key={idx} color="blue" style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CalendarOutlined style={{ fontSize: '12px' }} />
                          <span style={{ fontWeight: 600 }}>{sch.ngayHoc || sch.weekday}</span> {sch.time}
                        </Tag>
                      ))}
                    </div>
                  );
                }
              },
              {
                title: 'Ngày khai giảng',
                dataIndex: 'ngayDuKienKhaiGiang',
                key: 'ngayDuKienKhaiGiang',
                width: '25%',
                render: (_, record) => {
                  const date = record.ngayKhaiGiangDuKien;
                  if (!date) return <span style={{ fontSize: '14px' }}>-</span>;
                  const d = new Date(date);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  // Lấy thứ trong tuần (vi-VN)
                  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
                  // Hiển thị: dd/mm/yyyy - Thứ
                  return <span style={{ fontSize: '14px' }}>{`${day}/${month}/${year} - ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`}</span>;
                }
              },
              {
                title: 'Sĩ số',
                key: 'siSo',
                width: '10%',
                render: (_, record) => {
                  const toNumber = v => isNaN(Number(v)) ? 0 : Number(v);
                  const registered = toNumber(record.soSlotGiuCho) + toNumber(record.soSlotChuyenKhoa) + toNumber(record.soDaDangKy);
                  const total = toNumber(record.siSo);
                  const isFull = registered >= total;
                  
                  return (
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 500,
                      color: isFull ? 'var(--error-color)' : 'inherit'
                    }}>
                      {registered}/{total}
                    </span>
                  );
                }
              },
              {
                title: 'Chọn lớp',
                key: 'action',
                width: '15%',
                align: 'center',
                render: (_, record) => {
                  const toNumber = v => isNaN(Number(v)) ? 0 : Number(v);
                  const registered = toNumber(record.soSlotGiuCho) + toNumber(record.soSlotChuyenKhoa) + toNumber(record.soDaDangKy);
                  const total = toNumber(record.siSo);
                  const isFull = registered >= total;
                  
                  return (
                    <Button
                      type="primary"
                      size="middle"
                      disabled={isFull}
                      style={{ 
                        height: '32px', 
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                      onClick={() => {
                        setClassToConfirm(record);
                        setIsModalVisible(true);
                      }}
                    >
                      Chọn lớp
                    </Button>
                  );
                }
              }
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
            <Button 
              icon={<LeftOutlined />}
              type="default" 
              style={{ height: '36px', borderRadius: '4px', fontSize: '14px' }}
              onClick={() => window.history.back()}
            >
              Quay lại
            </Button>
            <Button 
              type="default"
              style={{ 
                height: '36px', 
                borderRadius: '4px', 
                fontSize: '14px',
                borderColor: 'var(--primary-color)', 
                color: 'var(--primary-color)'
              }}
              onClick={() => onSwitchToCustomSchedule && onSwitchToCustomSchedule()}
            >
              Không tìm thấy lớp phù hợp
            </Button>
          </div>
        </>
      )}
      </Spin>
      <Modal
        open={isModalVisible}
        title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleOutlined style={{ color: 'var(--success-color)' }} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Xác nhận chọn lớp</span>
        </div>}
        onCancel={() => {
          setIsModalVisible(false);
          // Refresh lại danh sách để lấy dữ liệu mới nhất từ server
          if (onRefresh) onRefresh();
        }}
        onOk={() => {
          setIsModalVisible(false);
          // Cập nhật số đăng ký trước khi gọi callback để đảm bảo hiển thị đúng số lượng
          if (onClassSelect && classToConfirm) {
            // Tạo bản sao của classToConfirm và cập nhật soDaDangKy
            const updatedClass = {
              ...classToConfirm,
              soDaDangKy: (parseInt(classToConfirm.soDaDangKy || 0, 10) + 1).toString()
            };
            onClassSelect(updatedClass);
          }
        }}
        okText={<span style={{ fontSize: '14px', fontWeight: 500 }}>Xác nhận</span>}
        cancelText={<span style={{ fontSize: '14px' }}>Hủy</span>}
        okButtonProps={{ 
          style: { height: '36px', borderRadius: '4px' },
          size: 'middle' 
        }}
        cancelButtonProps={{ 
          style: { height: '36px', borderRadius: '4px' }, 
          size: 'middle' 
        }}
        centered
        width="480px"
        styles={{ 
          body: { padding: '24px' },
          footer: { padding: '16px 24px' } 
        }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ width: '100px', fontSize: '14px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.85)' }}>Mã lớp:</div> 
            <Tag color="magenta" style={{ fontSize: '14px', fontWeight: 600, padding: '4px 8px', margin: 0 }}>{classToConfirm?.maLop}</Tag>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '100px', fontSize: '14px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.85)' }}>Lịch học:</div> 
            <div style={{ fontSize: '14px' }}>{renderSortedSchedules(classToConfirm?.allSchedules || classToConfirm?.schedules || [])}</div>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ width: '100px', fontSize: '14px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.85)' }}>Khai giảng:</div> 
            <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.85)' }}>
              {classToConfirm?.ngayKhaiGiangDuKien ? 
                (() => {
                  const d = new Date(classToConfirm.ngayKhaiGiangDuKien);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
                  return `${day}/${month}/${year} - ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`;
                })() : '-'}
            </div>
          </div>
          
          <div style={{ marginTop: '16px', backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '12px', borderRadius: '4px', fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>
            <InfoCircleOutlined style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
            Bạn có thể thay đổi lớp học cho đến khi hoàn tất đăng ký.
          </div>
        </div>
      </Modal>
      </div>
    </Card>
  );
};

export default ClassSelectionDesktop;
