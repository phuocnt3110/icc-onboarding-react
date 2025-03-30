import { 
    TIME_SETTINGS, 
    slotsPerHour, 
    totalSlots, 
    WEEKDAYS, 
    TIME_FILTER_RANGES 
  } from './constants';
  
  /**
   * Tạo bitmap trống với các ngày trong tuần và các slot thời gian
   */
  export const createEmptySchedule = () => {
    const schedule = {};
    WEEKDAYS.forEach((_, dayIndex) => {
      schedule[dayIndex] = Array(totalSlots).fill(0);
    });
    return schedule;
  };
  
  /**
   * Chuyển đổi chỉ số slot thành chuỗi thời gian (HH:MM)
   */
  export const slotToTime = (slotIndex) => {
    const totalMinutes = slotIndex * TIME_SETTINGS.minutesPerSlot;
    const hours = Math.floor(totalMinutes / 60) + TIME_SETTINGS.startHour;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  /**
   * Kiểm tra xem một slot có nằm trong phạm vi bộ lọc không
   */
  export const isSlotVisible = (slotIndex, timeFilter) => {
    if (timeFilter === 'all') return true;
    
    const timeString = slotToTime(slotIndex);
    const hour = parseInt(timeString.split(':')[0]);
    const range = TIME_FILTER_RANGES[timeFilter];
    
    return hour >= range.start && hour < range.end;
  };
  
  /**
   * Lấy chỉ số slot bắt đầu của bộ lọc
   */
  export const getFilterStartSlot = (timeFilter) => {
    if (timeFilter === 'all') return 0;
    
    const range = TIME_FILTER_RANGES[timeFilter];
    return (range.start - TIME_SETTINGS.startHour) * slotsPerHour;
  };
  
  /**
   * Lấy chỉ số slot kết thúc của bộ lọc
   */
  export const getFilterEndSlot = (timeFilter) => {
    if (timeFilter === 'all') return totalSlots - 1;
    
    const range = TIME_FILTER_RANGES[timeFilter];
    return (range.end - TIME_SETTINGS.startHour) * slotsPerHour - 1;
  };
  
  /**
   * Tạo nhãn thời gian
   */
  export const generateTimeLabels = () => {
    const timeLabels = [];
    for (let hour = TIME_SETTINGS.startHour; hour <= TIME_SETTINGS.endHour; hour++) {
      timeLabels.push(`${hour}:00`);
      if (hour < TIME_SETTINGS.endHour) {
        timeLabels.push(`${hour}:30`);
      }
    }
    return timeLabels;
  };
  
  /**
   * Lọc nhãn thời gian theo bộ lọc
   */
  export const filterTimeLabels = (labels, timeFilter) => {
    if (timeFilter === 'all') return labels;
    
    return labels.filter(label => {
      const hour = parseInt(label.split(':')[0]);
      const range = TIME_FILTER_RANGES[timeFilter];
      return hour >= range.start && hour < range.end;
    });
  };
  
  /**
   * Chuyển đổi vị trí Y thành chỉ số slot
   * @param {Number} yPosition Vị trí Y (pixel)
   * @param {Number} containerTop Vị trí top của container 
   * @param {String} timeFilter Bộ lọc thời gian hiện tại
   * @returns {Number} Chỉ số slot tương ứng
   */
  export const positionToSlot = (yPosition, containerTop, timeFilter) => {
    const relativePosition = yPosition - containerTop;
    const relativeSlot = Math.floor(relativePosition / TIME_SETTINGS.timeSlotHeight);
    
    // Lấy slot bắt đầu của bộ lọc
    const filterStartSlot = getFilterStartSlot(timeFilter);
    
    // Trả về slot tuyệt đối
    return filterStartSlot + relativeSlot;
  };
  
  /**
   * Tính vị trí top cho slot
   * @param {Number} slotIndex Chỉ số slot tuyệt đối
   * @param {String} timeFilter Bộ lọc thời gian hiện tại
   * @returns {Number} Vị trí top (pixel)
   */
  export const calculateSlotPosition = (slotIndex, timeFilter) => {
    // Lấy slot bắt đầu của bộ lọc
    const filterStartSlot = getFilterStartSlot(timeFilter);
    
    // Tính vị trí tương đối
    const relativeSlot = slotIndex - filterStartSlot;
    
    // Trả về vị trí top
    return relativeSlot * TIME_SETTINGS.timeSlotHeight;
  };
  
  /**
   * Chuyển đổi từ schedule bitmap sang danh sách khung giờ
   */
  export const getScheduleList = (schedule) => {
    const result = [];
    
    WEEKDAYS.forEach((day, dayIndex) => {
      const daySchedule = schedule[dayIndex] || [];
      let currentGroup = null;
      
      for (let i = 0; i < daySchedule.length; i++) {
        if (daySchedule[i] === 1) {
          // Bắt đầu một nhóm mới hoặc mở rộng nhóm hiện tại
          if (currentGroup === null) {
            currentGroup = {
              id: `${dayIndex}-${i}`,
              day,
              dayIndex,
              start: i,
              end: i,
              startTime: slotToTime(i),
              endTime: slotToTime(i + 1)
            };
          } else {
            currentGroup.end = i;
            currentGroup.endTime = slotToTime(i + 1);
          }
        } else if (currentGroup !== null) {
          // Kết thúc một nhóm, thêm vào kết quả
          result.push(currentGroup);
          currentGroup = null;
        }
      }
      
      // Xử lý nhóm cuối cùng nếu nó kéo dài đến cuối
      if (currentGroup !== null) {
        result.push(currentGroup);
      }
    });
    
    return result;
  };
  
  /**
   * Nhóm lịch theo ngày
   */
  export const getGroupedSchedule = (schedule) => {
    const grouped = {};
    const scheduleList = getScheduleList(schedule);
    
    WEEKDAYS.forEach(day => {
      grouped[day] = scheduleList
        .filter(item => item.day === day)
        .sort((a, b) => a.start - b.start);
    });
    
    return grouped;
  };
  
  /**
   * Tìm các ô đã chọn cho một ngày theo bộ lọc hiện tại
   */
  export const findVisibleSlotsForDay = (schedule, dayIndex, timeFilter) => {
    // Lấy bitmap cho ngày
    const daySchedule = schedule[dayIndex] || Array(totalSlots).fill(0);
    
    // Mảng kết quả để lưu các nhóm slot
    const visibleSlots = [];
    
    // Duyệt qua các slot trong ngày
    let i = 0;
    while (i < daySchedule.length) {
      // Bỏ qua nếu slot không hiển thị trong bộ lọc hiện tại
      if (!isSlotVisible(i, timeFilter)) {
        i++;
        continue;
      }
      
      // Tìm các ô liên tiếp đã chọn
      if (daySchedule[i] === 1) {
        const startSlot = i;
        
        // Tìm ô kết thúc của nhóm
        while (i < daySchedule.length && daySchedule[i] === 1 && isSlotVisible(i, timeFilter)) {
          i++;
        }
        
        // Thêm nhóm mới vào kết quả
        visibleSlots.push({
          start: startSlot,
          end: i - 1,
          startTime: slotToTime(startSlot),
          endTime: slotToTime(i)
        });
      } else {
        // Bỏ qua ô chưa chọn
        i++;
      }
    }
    
    return visibleSlots.sort((a, b) => a.start - b.start);
  };
  
  /**
   * Kiểm tra nếu có khung giờ đã chọn
   */
  export const hasSelectedSlots = (schedule) => {
    return Object.values(schedule).some(day => day.some(slot => slot === 1));
  };
  
  /**
   * Chuyển đổi từ schedule list sang format cho API
   */
  export const formatSchedulesForSubmit = (scheduleList) => {
    return scheduleList.map(item => ({
      weekday: item.day,
      time: `${item.startTime}-${item.endTime}`
    }));
  };
  
  /**
   * Merge adjacent time slots within the same day to reduce the total number of slots
   * This is particularly useful when there are many individual slot selections
   * 
   * @param {Object} schedule - Schedule bitmap object
   * @returns {Object} - Optimized schedule bitmap
   */
  export const optimizeBitmap = (schedule) => {
    if (!schedule) return schedule;
    
    const optimized = {};
    
    // Process each day
    Object.keys(schedule).forEach(dayIndex => {
      const dayBitmap = schedule[dayIndex];
      const optimizedDay = [...dayBitmap];
      
      // Find consecutive 1s and merge them (fill gaps of up to 1 slot)
      let inSequence = false;
      let sequenceStart = -1;
      
      for (let i = 0; i < dayBitmap.length; i++) {
        if (dayBitmap[i] === 1) {
          if (!inSequence) {
            // Start new sequence
            inSequence = true;
            sequenceStart = i;
          }
          // Continue sequence
        } else {
          if (inSequence) {
            // Check if the gap is just 1 slot and there's another 1 after it
            if (i < dayBitmap.length - 1 && dayBitmap[i + 1] === 1) {
              // Fill the gap
              optimizedDay[i] = 1;
            } else {
              // End sequence
              inSequence = false;
            }
          }
        }
      }
      
      optimized[dayIndex] = optimizedDay;
    });
    
    return optimized;
  };
  
  /**
   * Prioritize schedules by importance when we need to truncate
   * This ensures the most important slots are kept when truncating
   * 
   * @param {Array} scheduleList - Array of schedule objects from getScheduleList()
   * @param {Number} maxSlots - Maximum number of slots to keep
   * @returns {Array} - Prioritized schedule list
   */
  export const prioritizeSchedules = (scheduleList, maxSlots = 8) => {
    if (!scheduleList || !Array.isArray(scheduleList)) return [];
    if (scheduleList.length <= maxSlots) return scheduleList;
    
    // Clone to avoid modifying original
    const slots = [...scheduleList];
    
    // Sort by priority criteria
    const prioritized = slots.sort((a, b) => {
      // Priority 1: Weekdays (Mon-Fri) over weekend
      const aIsWeekend = a.dayIndex > 4;
      const bIsWeekend = b.dayIndex > 4;
      if (aIsWeekend !== bIsWeekend) return aIsWeekend ? 1 : -1;
      
      // Priority 2: Earlier days in week
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      
      // Priority 3: Morning/afternoon slots over evening
      const aIsEvening = a.start >= 20; // After ~5pm
      const bIsEvening = b.start >= 20;
      if (aIsEvening !== bIsEvening) return aIsEvening ? 1 : -1;
      
      // Priority 4: Longer duration slots
      const aDuration = a.end - a.start + 1;
      const bDuration = b.end - b.start + 1;
      return bDuration - aDuration;
    });
    
    // Return only the top slots
    return prioritized.slice(0, maxSlots);
  };
  
  /**
   * Create a compact string representation of the schedule
   * Useful when we need to minimize the string length for API calls
   * 
   * @param {Array} scheduleList - Array of schedule objects
   * @returns {String} - Compact schedule string
   */
  export const createCompactScheduleString = (scheduleList) => {
    if (!scheduleList || !Array.isArray(scheduleList) || scheduleList.length === 0) {
      return '';
    }
    
    // Use short day names and compact time format
    const dayMap = {
      'Thứ 2': 'T2',
      'Thứ 3': 'T3',
      'Thứ 4': 'T4',
      'Thứ 5': 'T5',
      'Thứ 6': 'T6',
      'Thứ 7': 'T7',
      'Chủ nhật': 'CN'
    };
    
    // Format each entry in the shortest possible way
    return scheduleList.map(slot => {
      const day = dayMap[slot.day] || slot.day;
      
      // Simplify time format (remove leading zeros and trailing zeros in minutes)
      let startTime = slot.startTime.replace(/^0/, '');
      if (startTime.endsWith(':00')) startTime = startTime.replace(':00', '');
      
      let endTime = slot.endTime.replace(/^0/, '');
      if (endTime.endsWith(':00')) endTime = endTime.replace(':00', '');
      
      return `${day}:${startTime}-${endTime}`;
    }).join('/');
  };
  
  /**
   * Calculate the estimated string length for a schedule list
   * Useful for determining if we need to truncate before formatting
   * 
   * @param {Array} scheduleList - Array of schedule objects
   * @returns {Number} - Estimated string length
   */
  export const estimateScheduleStringLength = (scheduleList) => {
    if (!scheduleList || !Array.isArray(scheduleList)) return 0;
    
    // Average length per entry: "Thu X - XX:XX : XX:XX / "
    const avgEntryLength = 25;
    return scheduleList.length * avgEntryLength;
  };