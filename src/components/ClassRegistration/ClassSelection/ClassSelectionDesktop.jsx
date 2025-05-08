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
  LeftOutlined
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {sorted.map((sch, idx) => (
          <Tag key={idx} color="blue" icon={<CalendarOutlined />} style={{ margin: 0, display: 'inline-block' }}>
            <span style={{fontWeight: 600}}>{sch.ngayHoc || sch.weekday}</span> {sch.time}
          </Tag>
        ))}
      </div>
    );
  }

  return (
    <Card className="class-selection-desktop" bodyStyle={{background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #f0f1f2'}}>
      <Button icon={<LeftOutlined />} type="link" style={{marginBottom: 8}} onClick={() => window.history.back()}>
        Quay lại
      </Button>
      <Title level={3} style={{marginTop: 0}}>Chọn lớp học phù hợp</Title>
      {/* Ghi chú mặc định hoặc ghi chú từ prop */}
      <Paragraph type="secondary" style={{marginBottom: 12}}>
        {typeof window !== 'undefined' && window.classSelectionNote
          ? window.classSelectionNote
          : 'Vui lòng chọn lớp học phù hợp nhất với nhu cầu của bạn. Nếu không tìm thấy lớp học phù hợp, hãy sử dụng chức năng hỗ trợ.'}
      </Paragraph>
      {showWarning && (
        <Alert type="warning" showIcon message="Không tìm thấy giữ chỗ hợp lệ. Vui lòng chọn lớp bên dưới." style={{ marginBottom: 16 }} />
      )}
      {/* Bộ lọc giống mobile */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {/* Thứ học */}
        <FilterButton
          icon={<CalendarOutlined />}
          label="Thứ"
          count={weekdayFilter.length}
          title="Chọn thứ học"
          isActive={weekdayFilter.length > 0}
          popoverContent={
            <div style={{ padding: '8px', minWidth: '240px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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
      <Divider />
      <Spin spinning={loading || tableLoading} tip="Đang tải danh sách lớp...">
        {/* Kiểm tra trạng thái trống dựa trên filteredClasses, nhưng vẫn hiển thị dữ liệu nhóm từ groupedClasses */}
        {filteredClasses.length === 0 ? (
          <Empty
            description={
              <div style={{ maxWidth: '80%', margin: '0 auto' }}>
                <Text style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                  {(weekdayFilter.length > 0 || timeFilter.length > 0 || selectedQuickDate) 
                    ? 'Không có lớp nào phù hợp với bộ lọc đã chọn!' 
                    : 'Không có lớp nào khả dụng!'}
                </Text>
                {(weekdayFilter.length > 0 || timeFilter.length > 0 || selectedQuickDate) && (
                  <Button 
                    size="small" 
                    type="primary"
                    onClick={resetAllFilters}
                    style={{ marginTop: 8 }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '48px 0' }}
          />
        ) : (
          <>
            <Table
              dataSource={groupedClasses}
              rowKey={record => record.key || record.maLop}
              pagination={false}
              bordered
              columns={[
              {
                title: 'Mã lớp',
                dataIndex: 'maLop',
                key: 'maLop',
                render: text => <Text strong>{text}</Text>
              },

              {
                title: 'Lịch học',
                dataIndex: 'allSchedules',
                key: 'allSchedules',
                render: allSchedules => {
                  if (!allSchedules || !allSchedules.length) return <Text type="secondary">Không có dữ liệu</Text>;
                  
                  const sorted = [...allSchedules].sort((a, b) => {
                    // Ưu tiên sort theo ngayHoc (thứ học), sau đó tới time
                    const dayA = a.ngayHoc || a.weekday || '';
                    const dayB = b.ngayHoc || b.weekday || '';
                    if (dayA !== dayB) return dayA.localeCompare(dayB, 'vi');
                    return getStartTime(a.time) - getStartTime(b.time);
                  });
                  
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {sorted.map((sch, idx) => (
                        <Tag key={idx} color="blue" icon={<CalendarOutlined />}>
                          <span style={{fontWeight: 600}}>{sch.ngayHoc || sch.weekday}</span> {sch.time}
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
                render: (_, record) => {
                  const date = record.ngayKhaiGiangDuKien;
                  if (!date) return <span>-</span>;
                  const d = new Date(date);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  // Lấy thứ trong tuần (vi-VN)
                  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
                  // Hiển thị: dd/mm/yyyy - Thứ
                  return <span>{`${day}/${month}/${year} - ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`}</span>;
                }
              },
              {
                title: 'Sĩ số',
                key: 'siSo',
                render: (_, record) => {
                  const toNumber = v => isNaN(Number(v)) ? 0 : Number(v);
                  const registered = toNumber(record.soSlotGiuCho) + toNumber(record.soSlotChuyenKhoa) + toNumber(record.soDaDangKy);
                  const total = toNumber(record.siSo);
                  return (
                    <span>{registered}/{total}</span>
                  );
                }
              },
              {
                title: 'Chọn lớp',
                key: 'action',
                render: (_, record) => (
                  <Button
                    type="primary"
                    disabled={record.soSlotConLai <= 0}
                    onClick={() => {
                      setClassToConfirm(record);
                      setIsModalVisible(true);
                    }}
                  >
                    Chọn lớp này
                  </Button>
                )
              }
            ]}
          />
          <div style={{textAlign: 'center', marginTop: 16}}>
            <Button type="default" danger onClick={() => onSwitchToCustomSchedule && onSwitchToCustomSchedule()}>
              Tôi không tìm thấy lớp học nào phù hợp
            </Button>
          </div>
        </>
      )}
      </Spin>
      <Modal
        visible={isModalVisible}
        title="Xác nhận chọn lớp"
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
        okText="Xác nhận"
        cancelText="Hủy"
        centered
        styles={{ body: { padding: '24px' } }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', marginBottom: 12, alignItems: 'center' }}>
            <Text strong style={{ width: 100 }}>Mã lớp:</Text> 
            <Tag color="magenta" style={{fontSize: 16, fontWeight: 600, padding: '4px 8px'}}>{classToConfirm?.maLop}</Tag>
          </div>
          
          <div style={{ display: 'flex', marginBottom: 12, alignItems: 'flex-start' }}>
            <Text strong style={{ width: 100 }}>Lịch học:</Text> 
            <div>{renderSortedSchedules(classToConfirm?.allSchedules || classToConfirm?.schedules || [])}</div>
          </div>
          
          <div style={{ display: 'flex', marginBottom: 12, alignItems: 'center' }}>
            <Text strong style={{ width: 100 }}>Khai giảng:</Text> 
            <Text>
              {classToConfirm?.ngayKhaiGiangDuKien ? 
                (() => {
                  const d = new Date(classToConfirm.ngayKhaiGiangDuKien);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
                  return `${day}/${month}/${year} - ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`;
                })() : '-'}
            </Text>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default ClassSelectionDesktop;
