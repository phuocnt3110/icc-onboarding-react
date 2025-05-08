// useClassSelectionLogic.js
// Custom hook tách toàn bộ logic xử lý dữ liệu, filter, group, chọn lớp cho ClassSelection

import { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';

export default function useClassSelectionLogic({ student, classList }) {
  // State tách biệt cho filter, group, selection
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [groupedClasses, setGroupedClasses] = useState([]);
  const [weekdayFilter, setWeekdayFilter] = useState([]);
  const [timeFilter, setTimeFilter] = useState([]);
  const [startDateRange, setStartDateRange] = useState(null);
  // State cho chọn nhanh ngày
  const [selectedQuickDate, setSelectedQuickDate] = useState(null);
  // Lưu trữ classList và groupedClasses ban đầu để có thể khôi phục
  const [originalClassList] = useState(classList);
  const [originalGroupedData, setOriginalGroupedData] = useState([]);
  
  // Hàm xử lý chọn nhanh ngày khai giảng
  const handleQuickDateSelect = useCallback((key) => {
    console.log('[DEBUG] Quick date select:', key);
    
    // Nếu click vào cùng một preset đã chọn, hủy bỏ lựa chọn
    if (key === selectedQuickDate) {
      console.log('[DEBUG] Toggling off selected date preset:', key);
      setSelectedQuickDate(null);
      setStartDateRange(null);
      return;
    }
    
    const now = new Date();
    let start = null, end = null;
    
    if (key === 'today') {
      start = end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (key === 'tomorrow') {
      start = end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (key === 'thisWeek') {
      // Lấy ngày đầu tuần (thứ 2) đến cuối tuần (chủ nhật)
      const day = now.getDay() || 7; // 0 = CN, 1 = Thứ 2, ...
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
    } else if (key === null) {
      // Reset date filter
      setSelectedQuickDate(null);
      setStartDateRange(null);
      return;
    }
    
    // Set giờ để đảm bảo so sánh chính xác
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    
    console.log('[DEBUG] Setting date range:', { start, end });
    setSelectedQuickDate(key);
    setStartDateRange(start && end ? [start, end] : null);
  }, []);

  // Group và filter classList khi thay đổi
  useEffect(() => {
    if (!classList || !classList.length) {
      setFilteredClasses([]);
      setGroupedClasses([]);
      return;
    }
    // Ensure all classes have schedules property
    const classesWithSchedules = classList.map(classItem => {
      console.log('[DEBUG] Raw classItem:', classItem);
      if (!classItem.schedules || classItem.schedules.length === 0) {
        // Lấy trực tiếp từ ngayHoc thay vì thuộc tính thu (không tồn tại)
        return {
          ...classItem,
          schedules: [{
            weekday: classItem.ngayHoc || '',
            time: `${classItem.gioBatDau || ''} - ${classItem.gioKetThuc || ''}`
          }]
        };
      }
      return classItem;
    });
    setFilteredClasses(classesWithSchedules);
    // Group by class code
    const grouped = _.groupBy(classesWithSchedules, 'maLop');
    const transformedData = Object.keys(grouped).map(classCode => {
      const classGroup = grouped[classCode];
      const firstClass = classGroup[0];
      // Collect all schedules
      const allSchedules = [];
      classGroup.forEach(cls => {
        if (cls.schedules && cls.schedules.length) {
          cls.schedules.forEach(schedule => {
            allSchedules.push({
              ...schedule,
              ngayHoc: schedule.ngayHoc || cls.ngayHoc || schedule.weekday || cls.weekday || '',
              originalClass: cls
            });
          });
        }
      });
      // Đảm bảo object lớp có ngayDuKienKhaiGiang nếu có trong lớp gốc
      return {
        ...firstClass,
        ngayDuKienKhaiGiang: firstClass.ngayKhaiGiangDuKien || '',
        key: classCode,
        allSchedules,
        originalClasses: classGroup
      };
    });
    // Pre-sort theo ngày khai giảng tăng dần
    // Helper: weekday (0=CN, 1=Hai, ..., 6=Bay)
    function getWeekdayNumber(dateStr) {
      const d = new Date(dateStr);
      // JS: 0=CN, 1=Hai, ...
      return isNaN(d) ? 8 : d.getDay();
    }
    // Helper: số lượng học sinh đã đăng ký (tử số cột Sĩ Số)
    function getRegisteredCount(cls) {
      return (
        Number(cls.soSlotGiuCho || 0) +
        Number(cls.soSlotChuyenKhoa || 0) +
        Number(cls.soDaDangKy || 0)
      );
    }
    const sortedData = transformedData.sort((a, b) => {
      // 1. Ngày khai giảng tăng dần
      const dateA = new Date(a.ngayKhaiGiangDuKien);
      const dateB = new Date(b.ngayKhaiGiangDuKien);
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      if (dateA - dateB !== 0) return dateA - dateB;
      // 2. Weekday của ngày khai giảng tăng dần
      const weekdayA = getWeekdayNumber(a.ngayKhaiGiangDuKien);
      const weekdayB = getWeekdayNumber(b.ngayKhaiGiangDuKien);
      if (weekdayA !== weekdayB) return weekdayA - weekdayB;
      // 3. Số lượng học sinh đăng ký tăng dần
      const regA = getRegisteredCount(a);
      const regB = getRegisteredCount(b);
      if (regA !== regB) return regA - regB;
      // 4. Mã lớp alphabet tăng dần
      return (a.maLop || '').localeCompare(b.maLop || '', 'vi', { sensitivity: 'base' });
    });
    setGroupedClasses(sortedData);
    // Cập nhật originalGroupedData khi groupedClasses được tạo lần đầu
    setOriginalGroupedData(sortedData);
  }, [classList]);

  // Filter logic (cơ bản, có thể mở rộng)
  useEffect(() => {
    if (!originalGroupedData.length) return;
    
    // Bắt đầu lọc với dữ liệu gốc để đảm bảo khi reset filter có đủ dữ liệu
    let result = [...originalGroupedData];
    
    console.log('[DEBUG] Starting filter with', result.length, 'classes from original data');
    
    // Filter weekday
    if (weekdayFilter.length > 0) {
      console.log('[DEBUG] Weekday filter values:', weekdayFilter);
      
      // Log tất cả các lớp và các ngày học của chúng trước khi lọc
      console.log('[DEBUG] All classes before filtering:');
      result.forEach(classItem => {
        const scheduleWeekdays = (classItem.allSchedules || []).map(sch => sch.weekday).filter(Boolean);
        console.log(`[DEBUG] Class ${classItem.maLop} weekdays:`, scheduleWeekdays);
      });
      
      // Thực hiện lọc và tạo mảng kết quả mới
      const filteredResult = [];
      
      for (const classItem of result) {
        const scheduleWeekdays = (classItem.allSchedules || []).map(sch => sch.weekday).filter(Boolean);
        console.log('[DEBUG] Class', classItem.maLop, 'all schedule weekdays:', scheduleWeekdays);
        
        const match = weekdayFilter.every(day => scheduleWeekdays.includes(day));
        
        if (match) {
          console.log('[DEBUG] Class', classItem.maLop, 'MATCHED weekday filter');
          filteredResult.push(classItem);
        } else {
          console.log('[DEBUG] Class', classItem.maLop, 'filtered out by weekday. Needed:', weekdayFilter, 'but had:', scheduleWeekdays);
        }
      }
      
      // Cập nhật result với mảng lọc mới
      result = filteredResult;
      console.log('[DEBUG] After weekday filter:', result.length, 'classes remain');
    }
    // Filter time
    if (timeFilter.length > 0) {
      result = result.filter(classItem =>
        classItem.allSchedules?.some(schedule => {
          if (!schedule.time || typeof schedule.time !== 'string') return false;
          try {
            const timeParts = schedule.time.split(' - ');
            if (!timeParts || timeParts.length < 1) return false;
            const startTimePart = timeParts[0].trim();
            if (!startTimePart) return false;
            const hourMinParts = startTimePart.split(':');
            if (!hourMinParts || hourMinParts.length < 1) return false;
            const startHour = parseInt(hourMinParts[0]);
            if (isNaN(startHour)) return false;
            if (timeFilter.includes('sáng') && startHour >= 6 && startHour < 12) return true;
            if (timeFilter.includes('chiều') && startHour >= 12 && startHour < 18) return true;
            if (timeFilter.includes('tối') && (startHour >= 18 || startHour < 6)) return true;
          } catch {
            return false;
          }
          return false;
        })
      );
    }
    // Filter start date range
    if (startDateRange && startDateRange[0] && startDateRange[1]) {
      console.log('[DEBUG] Date range filter:', startDateRange);
      const startDate = new Date(startDateRange[0]);
      const endDate = new Date(startDateRange[1]);
      
      // Đặt giờ về 0 để so sánh chỉ theo ngày
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      console.log('[DEBUG] Converted date range:', { start: startDate, end: endDate });
      
      // Kiểm tra tất cả các trường ngày có thể có (nhất quán hóa)
      const filteredByDate = [];
      
      for (const classItem of result) {
        // Log các giá trị ngày trong class để debug
        console.log('[DEBUG] Class', classItem.maLop, 'dates:', {
          ngayKhaiGiang: classItem.ngayKhaiGiang,
          ngayKhaiGiangDuKien: classItem.ngayKhaiGiangDuKien,
          ngayDuKienKhaiGiang: classItem.ngayDuKienKhaiGiang
        });
        
        // Lấy ngày từ nhiều trường có thể có
        const dateString = classItem.ngayKhaiGiangDuKien || classItem.ngayDuKienKhaiGiang || classItem.ngayKhaiGiang;
        
        if (!dateString) {
          console.log('[DEBUG] Class', classItem.maLop, 'skipped due to missing date value');
          continue;
        }
        
        // Tạo đối tượng Date và thiết lập giờ về 0
        const classStartDate = new Date(dateString);
        classStartDate.setHours(0, 0, 0, 0);
        
        // Check nếu ngày hợp lệ
        if (isNaN(classStartDate.getTime())) {
          console.log('[DEBUG] Class', classItem.maLop, 'skipped due to invalid date:', dateString);
          continue;
        }
        
        console.log('[DEBUG] Class', classItem.maLop, 'start date:', classStartDate);
        
        if (classStartDate >= startDate && classStartDate <= endDate) {
          console.log('[DEBUG] Class', classItem.maLop, 'MATCHED date range filter');
          filteredByDate.push(classItem);
        } else {
          console.log('[DEBUG] Class', classItem.maLop, 'filtered out by date range');
        }
      }
      
      result = filteredByDate;
      console.log('[DEBUG] After date range filter:', result.length, 'classes remain');
    }
    // Filter search text
    if (searchText) {
      result = result.filter(classItem => {
        return (
          (classItem.tenLop && classItem.tenLop.toLowerCase().includes(searchText.toLowerCase())) ||
          (classItem.maLop && classItem.maLop.toLowerCase().includes(searchText.toLowerCase()))
        );
      });
    }
    // Cập nhật filteredClasses với kết quả lọc
    setFilteredClasses(result);
    
    // Cập nhật groupedClasses dựa trên kết quả lọc
    if (weekdayFilter.length > 0 || timeFilter.length > 0 || (startDateRange && startDateRange[0] && startDateRange[1]) || searchText) {
      // Lọc groupedClasses dựa trên các mã lớp đã được lọc
      const filteredClassCodes = result.map(cls => cls.maLop);
      console.log('[DEBUG] Filtered class codes:', filteredClassCodes.length, 'classes');
      
      // Áp dụng kết quả lọc vào groupedClasses
      const groupedAndFiltered = originalGroupedData.filter(cls => filteredClassCodes.includes(cls.maLop));
      console.log('[DEBUG] Filtered AND grouped classes:', groupedAndFiltered.length, 'classes');
      
      // Cập nhật groupedClasses với kết quả sau khi lọc
      setGroupedClasses(groupedAndFiltered);
    } else {
      // Không có bộ lọc nào được áp dụng, khôi phục groupedClasses về trạng thái gốc
      console.log('[DEBUG] No filters applied, restoring original data with', originalGroupedData.length, 'classes');
      setGroupedClasses(originalGroupedData);
    }
  }, [originalGroupedData, weekdayFilter, timeFilter, startDateRange, searchText]);

  // Reset tất cả các bộ lọc
  const resetAllFilters = useCallback(() => {
    setWeekdayFilter([]);
    setTimeFilter([]);
    setStartDateRange(null);
    setSelectedQuickDate(null);
    setSearchText('');
    console.log('[DEBUG] All filters reset');
  }, []);

  // API cho UI sử dụng
  return {
    // States
    selectedClass, setSelectedClass,
    selectedSchedule, setSelectedSchedule,
    searchText, setSearchText,
    filteredClasses, groupedClasses,
    weekdayFilter, setWeekdayFilter,
    timeFilter, setTimeFilter,
    startDateRange, setStartDateRange,
    selectedQuickDate, setSelectedQuickDate,
    
    // Functions
    handleQuickDateSelect,
    resetAllFilters
  };
}
