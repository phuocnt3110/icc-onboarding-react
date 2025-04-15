// Các hằng số được sử dụng trong scheduler

// Danh sách ngày trong tuần
export const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

// Thiết lập giờ
export const TIME_SETTINGS = {
  startHour: 7,    // 7 AM
  endHour: 22,     // 10 PM
  timeSlotHeight: 36, // chiều cao pixel của mỗi ô thời gian
  minutesPerSlot: 30,  // 30 phút mỗi slot
};

// Tính toán các giá trị từ thiết lập
export const slotsPerHour = 60 / TIME_SETTINGS.minutesPerSlot;
export const totalHours = TIME_SETTINGS.endHour - TIME_SETTINGS.startHour;
export const totalSlots = totalHours * slotsPerHour;

// Bộ lọc thời gian với nhãn rõ ràng hơn
export const TIME_FILTERS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Buổi sáng', value: 'morning' },
  { label: 'Buổi chiều', value: 'afternoon' },
  { label: 'Buổi tối', value: 'evening' },
];

// Phạm vi thời gian cho mỗi bộ lọc
export const TIME_FILTER_RANGES = {
  all: { start: 7, end: 22 },
  morning: { start: 7, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 22 },
};