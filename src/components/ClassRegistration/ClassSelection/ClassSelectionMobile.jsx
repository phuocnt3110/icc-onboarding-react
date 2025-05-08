import React, { useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Divider,
  Tag,
  Alert,
  Empty,
  Input,
  Modal,
  Spin,
  Select,
  DatePicker,
  Row,
  Col
} from 'antd';
import {
  CalendarOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  LeftOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Checkbox, Drawer, Button as AntButton } from 'antd';
import { FIELD_MAPPINGS } from '../../../config';
import '../../../styles/class-selection.css';
import '../../../styles/index.css';
import useClassSelectionLogic from './useClassSelectionLogic';
import FilterButton, { ResetFilterButton } from './FilterButton';

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { STUDENT: STUDENT_FIELDS } = FIELD_MAPPINGS;

const ClassSelectionMobile = ({
  student,
  classList = [],
  showWarning = false,
  onClassSelect,
  onSwitchToCustomSchedule,
  loading = false,
  onRefresh
}) => {
  // Hàm sắp xếp lịch học theo thứ và giờ bắt đầu
  function getStartTime(timeStr) {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  
  // Hàm sort và render lịch học
  function renderSortedSchedules(schedules = []) {
    if (!schedules || !schedules.length) return <Text type="secondary">Không có dữ liệu</Text>;
    
    const sorted = [...schedules].sort((a, b) => {
      // Ưu tiên sort theo ngày học (thứ), sau đó tới giờ
      const dayA = a.ngayHoc || a.weekday || '';
      const dayB = b.ngayHoc || b.weekday || '';
      if (dayA !== dayB) return dayA.localeCompare(dayB, 'vi');
      return getStartTime(a.time) - getStartTime(b.time);
    });
    
    // Trên mobile, hiển thị theo cột để tránh xộc xệch
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map((sch, idx) => (
          <Tag key={idx} color="blue" style={{ margin: 0, width: 'fit-content' }}>
            <span style={{fontWeight: 600}}>{sch.ngayHoc || sch.weekday}</span> {sch.time}
          </Tag>
        ))}
      </div>
    );
  }
  // State cho Drawer filter
  const [openFilter, setOpenFilter] = useState(null); // 'weekday' | 'time' | 'date' | null
  // State cho chọn nhanh ngày
  const [selectedQuickDate, setSelectedQuickDate] = useState(null);

  // Hàm chọn nhanh ngày khai giảng
  const handleQuickDateSelect = (key) => {
    const now = new Date();
    let start = null, end = null;
    if (key === 'today') {
      start = end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (key === 'tomorrow') {
      start = end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (key === 'thisWeek') {
      const day = now.getDay() || 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 7);
    } else if (key === 'nextWeek') {
      const day = now.getDay() || 7;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 8);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 14);
    } else if (key === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (key === 'nextMonth') {
      start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    }
    setSelectedQuickDate(key);
    setStartDateRange(start && end ? [start, end] : null);
  };
  // Lấy logic filter, group, state từ hook
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardListRef = React.useRef(null);

  // Cập nhật currentIndex khi scroll ngang
  const handleScroll = () => {
    const container = cardListRef.current;
    if (!container) return;
    const children = Array.from(container.children);
    const scrollLeft = container.scrollLeft;
    let minDiff = Infinity;
    let idx = 0;
    children.forEach((child, i) => {
      const diff = Math.abs(child.offsetLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        idx = i;
      }
    });
    setCurrentIndex(idx);
  };

  const {
    selectedClass, setSelectedClass,
    selectedSchedule, setSelectedSchedule,
    filteredClasses,
    groupedClasses,
    weekdayFilter, setWeekdayFilter,
    timeFilter, setTimeFilter,
    startDateRange, setStartDateRange
  } = useClassSelectionLogic({ student, classList });

  // State modal xác nhận
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [classToConfirm, setClassToConfirm] = useState(null);

  return (
    <Card className="class-selection-mobile" bodyStyle={{ padding: 8, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
      <Button
        icon={<LeftOutlined style={{fontSize: 20, color: '#3874cb', verticalAlign: 'middle'}} />}
        type="text"
        style={{
          position: 'absolute', left: 8, top: 8, zIndex: 10,
          padding: 4,
          background: 'none',
          border: 'none',
          boxShadow: 'none',
          minWidth: 32,
          minHeight: 32,
          borderRadius: '50%',
          color: '#3874cb',
          transition: 'background 0.2s, color 0.2s',
        }}
        onClick={() => window.history.back()}
        onMouseOver={e => e.currentTarget.style.background = '#f0f7ff'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
        aria-label="Quay lại"
      />
      <Title level={4} style={{ textAlign: 'center', marginBottom: 8 }}>Chọn lớp học</Title>
      {/* Ghi chú mặc định hoặc từ window */}
      <Text type="secondary" style={{display: 'block', marginBottom: 8, fontSize: 13}}>
        {typeof window !== 'undefined' && window.classSelectionNote
          ? window.classSelectionNote
          : 'Vui lòng chọn lớp học phù hợp nhất với nhu cầu của bạn. Nếu không tìm thấy lớp học phù hợp, hãy sử dụng chức năng hỗ trợ.'}
      </Text>
      {showWarning && (
        <Alert type="warning" showIcon message="Không tìm thấy giữ chỗ hợp lệ. Vui lòng chọn lớp bên dưới." style={{ marginBottom: 12 }} />
      )}
      
  

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {/* Thứ học */}
        <FilterButton
          icon={<CalendarOutlined />}
          label="Thứ"
          count={weekdayFilter.length}
          isActive={weekdayFilter.length > 0}
          onClick={() => setOpenFilter('weekday')}
          showPopover={false}
          style={{ minWidth: 44 }}
        />
        {/* Ca học */}
        <FilterButton
          icon={<ClockCircleOutlined />}
          label="Ca"
          count={timeFilter.length}
          isActive={timeFilter.length > 0}
          onClick={() => setOpenFilter('time')}
          showPopover={false}
          style={{ minWidth: 44 }}
        />
        {/* Ngày khai giảng */}
        <FilterButton
          icon={<CalendarOutlined />}
          label="Ngày KG"
          isActive={!!startDateRange}
          onClick={() => setOpenFilter('date')}
          showPopover={false}
          style={{ minWidth: 44 }}
        />
        {/* Reset filter */}
        <ResetFilterButton
          onClick={() => { setWeekdayFilter([]); setTimeFilter([]); setStartDateRange(null); }}
          disabled={!(weekdayFilter.length > 0 || timeFilter.length > 0 || startDateRange)}
        />
      </div>

      {/* Drawer filter - Bottom sheet cho từng filter */}
      <Drawer
        placement="bottom"
        open={!!openFilter}
        onClose={() => setOpenFilter(null)}
        closable={false}
        bodyStyle={{ padding: 0, borderRadius: '16px 16px 0 0', background: '#fff', minHeight: 120, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        style={{ borderRadius: '16px 16px 0 0', maxHeight: '90vh' }}
        maskStyle={{ background: 'rgba(0,0,0,0.25)' }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, paddingBottom: 0 }}>
          {openFilter === 'weekday' && (
            <>
              <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 18 }}>Chọn Thứ học</div>
              <Checkbox.Group
                options={['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']}
                value={weekdayFilter}
                onChange={setWeekdayFilter}
                style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16 }}
              />
            </>
          )}
          {openFilter === 'time' && (
            <>
              <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 18 }}>Chọn Ca học</div>
              <Checkbox.Group
                options={[
                  { label: 'Sáng (6h-12h)', value: 'sáng' },
                  { label: 'Chiều (12h-18h)', value: 'chiều' },
                  { label: 'Tối (18h-6h)', value: 'tối' }
                ]}
                value={timeFilter}
                onChange={setTimeFilter}
                style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16 }}
              />
            </>
          )}
          {openFilter === 'date' && (
            <>
              <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 18 }}>Chọn ngày khai giảng</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Hôm nay', key: 'today' },
                  { label: 'Ngày mai', key: 'tomorrow' },
                  { label: 'Tuần này', key: 'thisWeek' },
                  { label: 'Tuần sau', key: 'nextWeek' },
                  { label: 'Tháng này', key: 'thisMonth' },
                  { label: 'Tháng sau', key: 'nextMonth' }
                ].map(opt => (
                  <AntButton
                    key={opt.key}
                    block
                    type={selectedQuickDate === opt.key ? 'primary' : 'default'}
                    style={{ fontWeight: 600, fontSize: 15, padding: '13px 0' }}
                    onClick={() => {
                      console.log('Date preset mobile clicked:', opt.key, 'current:', selectedQuickDate);
                      // Toggle logic ở level UI
                      if (selectedQuickDate === opt.key) {
                        // Nếu đã chọn, bỏ chọn
                        handleQuickDateSelect(null);
                      } else {
                        // Nếu chưa chọn, chọn mới
                        handleQuickDateSelect(opt.key);
                      }
                    }}
                  >
                    {opt.label}
                  </AntButton>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ padding: '16px 20px 12px 20px', borderTop: '1px solid #eee', background: '#fff', display: 'flex', gap: 12 }}>
          <AntButton block onClick={() => setOpenFilter(null)}>Đóng</AntButton>
          <AntButton type="primary" block onClick={() => setOpenFilter(null)}>Xác nhận</AntButton>
        </div>
      </Drawer>


      <Divider style={{ margin: '8px 0' }} />
      <Spin spinning={loading} tip="Đang tải danh sách lớp...">
        {filteredClasses.length === 0 ? (
          <div style={{textAlign:'center', margin:'32px 0 8px 0'}}>
            <Empty 
              description={
                <div style={{ maxWidth: '90%', margin: '0 auto' }}>
                  <Text style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
                    {(weekdayFilter.length > 0 || timeFilter.length > 0 || startDateRange) 
                      ? 'Không có lớp nào phù hợp với bộ lọc đã chọn!' 
                      : 'Không có lớp nào khả dụng!'}
                  </Text>
                  {(weekdayFilter.length > 0 || timeFilter.length > 0 || startDateRange) && (
                    <Button 
                      size="small" 
                      type="primary"
                      onClick={() => { setWeekdayFilter([]); setTimeFilter([]); setStartDateRange(null); }}
                      style={{ marginTop: 8 }}
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: '0' }}
            />
            <div
              style={{
                color: '#3874cb',
                fontWeight: 600,
                textDecoration: 'underline',
                fontSize: 14,
                marginTop: 4,
                marginBottom: 2,
                cursor: 'pointer',
                display: 'inline-block',
                letterSpacing: 0.1,
              }}
              onClick={onSwitchToCustomSchedule}
            >
              Tôi không thấy lớp học nào phù hợp
            </div>
          </div>
        ) : (
          <div>
            <div
              className="card-list-horizontal"
              ref={cardListRef}
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                gap: 0,
                paddingBottom: 8,
                paddingLeft: 0,
                paddingRight: 0,
                scrollPaddingLeft: 0,
                scrollPaddingRight: 0,
                width: '100%',
                minHeight: 220
              }}
              onScroll={handleScroll}
            >
              {(weekdayFilter.length > 0 || timeFilter.length > 0 || startDateRange ? filteredClasses : groupedClasses).map((classItem, idx) => {
  // Sĩ số: tử số/mẫu số
  const toNumber = v => isNaN(Number(v)) ? 0 : Number(v);
  const registered = toNumber(classItem.soSlotGiuCho) + toNumber(classItem.soSlotChuyenKhoa) + toNumber(classItem.soDaDangKy);
  const total = toNumber(classItem.siSo);
  // Ngày khai giảng
  let ngayKhaiGiang = '-';
  if (classItem.ngayDuKienKhaiGiang || classItem.ngayKhaiGiang) {
    const d = new Date(classItem.ngayDuKienKhaiGiang || classItem.ngayKhaiGiang);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
    ngayKhaiGiang = `${day}/${month}/${year} - ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`;
  }
  // PHƯƠNG ÁN 3: Block phân vùng rõ ràng
  return (
    <div
      key={classItem.maLop || idx}
      style={{
        flex: '0 0 100%',
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        minHeight: 220,
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 6px'
      }}
    >
      <Card
        size="small"
        bodyStyle={{ padding: 14, minHeight: 170, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        hoverable
        style={{ width: '100%', maxWidth: 420, borderRadius: 16, margin: '0 auto' }}
        onClick={() => { setClassToConfirm(classItem); /* Không mở modal ở đây */ }}
      >
        <div style={{marginBottom: 8}}>
          <Tag color="magenta" style={{fontSize: 20, fontWeight: 700}}>{classItem.maLop}</Tag>
        </div>
        <div style={{border:'1px solid #eee', borderRadius:6, padding:6, marginBottom:4}}><b>Ngày khai giảng:</b> {ngayKhaiGiang}</div>
        <div style={{border:'1px solid #eee', borderRadius:6, padding:6, marginBottom:4}}><b>Sĩ số:</b> <span style={{fontWeight:600, color: registered / (total || 1) > 0.85 ? '#fa541c' : '#1890ff'}}>{registered}/{total}</span></div>
        <div style={{border:'1px solid #eee', borderRadius:6, padding:6, marginBottom:4}}><b>Lịch học:</b>
          <ul style={{margin:0, paddingLeft:14, listStyle:'none'}}>
          {(() => {
            // Helper để convert weekday về số (2-7, CN=8)
            const weekdayToNum = w => {
              if (typeof w === 'number') {
                if (w === 8) return 8;
                if (w >= 2 && w <= 7) return w;
              }
              if (typeof w === 'string') {
                const s = w.trim();
                if (s === 'CN' || s === 'Chủ Nhật') return 8;
                // Nhận diện "Thứ 2", "Thứ 3", ..., "Thứ 7"
                const thuMatch = s.match(/^Thứ\s*([2-7])$/);
                if (thuMatch) return parseInt(thuMatch[1], 10);
                // Nhận diện "Hai", "Ba", ...
                const map = { 'Hai':2, 'Ba':3, 'Tư':4, 'Năm':5, 'Sáu':6, 'Bảy':7 };
                for (const k in map) if (s.includes(k)) return map[k];
              }
              return 99;
            };
            // Sắp xếp lịch học
            let schedules = (classItem.allSchedules || classItem.schedules || []).slice();
            schedules = schedules.map(sch => ({
              ...sch,
              _weekdayNum: weekdayToNum(sch.ngayHoc || sch.weekday || ''),
              _timeParts: (() => {
                if (!sch.time) return [99,99];
                const parts = sch.time.split(':').map(x => parseInt(x.trim(), 10));
                return [parts[0] || 0, parts[1] || 0];
              })()
            }));
            schedules.sort((a, b) => {
              if (a._weekdayNum !== b._weekdayNum) return a._weekdayNum - b._weekdayNum;
              if (a._timeParts[0] !== b._timeParts[0]) return a._timeParts[0] - b._timeParts[0];
              return a._timeParts[1] - b._timeParts[1];
            });

            return schedules.map((sch, i) => {
              let thu = sch.ngayHoc || sch.weekday || '';
              if (/^[2-7]$/.test(thu)) {
                const thuMap = { '2': 'Thứ Hai', '3': 'Thứ Ba', '4': 'Thứ Tư', '5': 'Thứ Năm', '6': 'Thứ Sáu', '7': 'Thứ Bảy' };
                thu = thuMap[thu];
              } else if (thu === 'CN' || thu === 'Chủ Nhật') {
                thu = 'Chủ Nhật';
              }
              return (
                <li key={i} style={{
                  display:'flex', alignItems:'center', gap:8, marginBottom:3, padding:'4px 0',
                  fontSize:14, borderRadius:6, transition:'background 0.2s',
                }}>
                  <span style={{fontWeight:600, color:'#2d3a4a'}}>{thu}</span>
                  <span style={{fontWeight:500, color:'#3874cb', background:'#e6f0ff', borderRadius:5, padding:'2px 10px', fontSize:14, marginLeft:2}}>{sch.time}</span>
                </li>
              );
            });
          })()}
          </ul>
        </div>
        <Button
          type="primary"
          size="middle"
          style={{ width: '92%', margin: '18px auto 0 auto', fontWeight: 600, borderRadius: 12, padding: '9px 0', fontSize: 14, display: 'block', minHeight: 40, maxHeight: 48 }}
          disabled={classItem.soSlotConLai <= 0}
          onClick={e => { e.stopPropagation(); setClassToConfirm(classItem); setIsModalVisible(true); }}
        >
          Chọn lớp này
        </Button>
      </Card>
    </div>
  );
})}
            </div>
            {/* Indicator */}
            <div style={{ textAlign: 'center', marginTop: 18, marginBottom: 12 }}>
              {filteredClasses.length > 1 && (
                <div style={{ display: 'inline-flex', gap: 7 }}>
                  {filteredClasses.map((_, idx) => (
                    <span
                      key={idx}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: idx === currentIndex ? '#3874cb' : '#e0e7ef',
                        display: 'inline-block',
                        transition: 'background 0.2s',
                        boxShadow: idx === currentIndex ? '0 0 2px #3874cb' : 'none',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {filteredClasses.length > 0 && (
              <div style={{textAlign: 'center', marginTop: 8}}>
                <div
                  style={{
                    color: '#3874cb',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  onClick={() => onSwitchToCustomSchedule && onSwitchToCustomSchedule()}
                >
                  Tôi không tìm thấy lớp học nào phù hợp
                </div>
              </div>
            )}
          </div>
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
        styles={{ body: { padding: '20px 16px' } }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', marginBottom: 16, alignItems: 'center' }}>
            <Text strong style={{ width: 90, fontSize: 14 }}>Mã lớp:</Text> 
            <Tag color="magenta" style={{fontSize: 15, fontWeight: 600, padding: '4px 8px'}}>{classToConfirm?.maLop}</Tag>
          </div>
          
          <div style={{ display: 'flex', marginBottom: 16, alignItems: 'flex-start' }}>
            <Text strong style={{ width: 90, fontSize: 14 }}>Lịch học:</Text> 
            {renderSortedSchedules(classToConfirm?.allSchedules || classToConfirm?.schedules || [])}
          </div>
          
          <div style={{ display: 'flex', marginBottom: 16, alignItems: 'center' }}>
            <Text strong style={{ width: 90, fontSize: 14 }}>Khai giảng:</Text> 
            <Text style={{ fontSize: 14 }}>
              {(classToConfirm?.ngayDuKienKhaiGiang || classToConfirm?.ngayKhaiGiang) ? 
                (() => {
                  const d = new Date(classToConfirm?.ngayDuKienKhaiGiang || classToConfirm?.ngayKhaiGiang);
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

export default ClassSelectionMobile;
