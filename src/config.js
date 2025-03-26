/**
 * Central configuration file for the application
 * Contains all API tokens, table IDs, and other configurations
 */

// API configurations
export const API_CONFIG = {
    TOKEN: "wAGe0JmrHKwn7KcOFn8TLrYFW7scyHhAwMiin4Qx",
    BASE_URL: "https://noco-erp.com/api/v2",
    TIMEOUT: 10000,
    MAX_RETRIES: 2
  };
  
  // Table IDs
  export const TABLE_IDS = {
    STUDENT: "muavbrdc7f1epco",  // Bảng data_main
    RESERVATION: "mbzjxhps0pfgw75",  // Bảng form_giu_cho
    CLASS: "mdtxnu17rxx23iq"  // Bảng data_class_total
  };
  
  // Field mappings between tables
  export const FIELD_MAPPINGS = {
    // Student table field mappings
    STUDENT: {
      ID: "Id",
      NAME: "tenHocVien",
      PHONE: "soDienThoaiHocVien",
      EMAIL: "emailHocVien",
      GUARDIAN_NAME: "tenNguoiDaiDien",
      GUARDIAN_PHONE: "sdtNguoiDaiDien",
      GUARDIAN_EMAIL: "mailNguoiDaiDien",
      PRODUCT: "sanPham",
      PACKAGE: "goiMua",
      CLASS_SIZE: "sizeLop",
      TEACHER_TYPE: "loaiGv",
      LEVEL: "trinhDo",
      BILL_ITEM_ID: "billItemId",
      SESSIONS: "soBuoi",
      PRICE: "TongTien",
      CLASS_CODE: "maLop",
      SCHEDULE: "lichHoc",
      START_DATE: "ngayKhaiGiangDuKien",
      STATUS: "trangThaiChonLop",
      LOCATION: "diaChi",
    },
    
    // Class table field mappings
    CLASS: {
      ID: "Id",
      CODE: "classCode",
      PRODUCT: "product",
      SIZE: "size",
      TEACHER_TYPE: "teacherType",
      LEVEL: "trinhDo",
      STATUS: "status",
      START_DATE: "ngayKhaiGiangDuKien",
      SLOTS_LEFT: "soSlotConLai",
      TOTAL_SLOTS: "siSo",
      REGISTERED: "soDaDangKy",
      WEEKDAY: "ngayHoc",
      START_TIME: "gioBatDau",
      END_TIME: "gioKetThuc",
    },
    
    // Reservation table field mappings
    RESERVATION: {
      ID: "Id",
      ORDER_CODE: "ma_order",
      CLASS_CODE: "ma_lop",
      IS_VALID: "checkHopLe"
    }
  };
  
  // App routes
  export const ROUTES = {
    STEP_ONE: "/step-one",
    STEP_TWO: "/step-two",
    HOME: "/"
  };
  
  // Custom time slots and weekdays
  export const TIME_SLOTS = [
    '08:00-09:30',
    '09:45-11:15',
    '14:00-15:30',
    '15:45-17:15',
    '17:30-19:00',
    '19:15-20:45'
  ];
  
  export const WEEKDAYS = [
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
    'Chủ nhật'
  ];
  
  // Message configurations
  export const MESSAGES = {
    // Common messages
    NO_ID_IN_URL: 'Không tìm thấy mã học viên trong URL. Vui lòng kiểm tra lại đường dẫn.',
    MISSING_ID: 'Mã học viên không được bỏ trống',
    MISSING_STUDENT_INFO: 'Thiếu thông tin học viên',
    MISSING_COURSE_INFO: 'Thiếu thông tin khóa học cần thiết để tìm lớp phù hợp',
    
    // Students and info related
    STUDENT_NOT_FOUND: 'Không tìm thấy thông tin học viên',
    STUDENT_DATA_LOAD_ERROR: 'Lỗi khi tải dữ liệu học viên',
    UPDATE_SUCCESS: 'Cập nhật thông tin thành công',
    UPDATE_FAILED: 'Lỗi khi cập nhật thông tin: {error}',
    PERMISSION_ERROR: 'Bạn không có quyền thực hiện thao tác này',
    
    // Class selection related
    NO_CLASSES_FOUND: 'Không tìm thấy lớp học phù hợp. Bạn có thể chọn lịch học theo ý muốn.',
    CLASSES_FOUND: 'Đã tìm thấy {count} lớp học phù hợp.',
    CLASS_FETCH_ERROR: 'Lỗi khi tải danh sách lớp học',
    SELECT_CLASS: 'Vui lòng chọn một lớp học',
    CLASS_CODE: 'mã lớp',
    
    // Schedule related
    INVALID_SCHEDULE: 'Lịch học không hợp lệ',
    MIN_SCHEDULE_REQUIRED: 'Vui lòng chọn ít nhất một lịch học',
    
    // Reservation related
    MISSING_RESERVATION_INFO: 'Thiếu thông tin để xác nhận giữ chỗ',
    RESERVATION_NOT_FOUND: 'Bạn đã giữ chỗ trước đó, nhưng chúng tôi không tìm thấy {code} của bạn. Vui lòng liên hệ với tư vấn viên của bạn, hoặc tiếp tục chọn lịch học theo danh sách dưới đây.',
    
    // Success messages
    CLASS_REGISTRATION_SUCCESS: 'Đăng ký lớp học thành công!',
    CLASS_REGISTRATION_FAILED: 'Lỗi khi đăng ký lớp học: {error}',
    RESERVATION_CONFIRMATION_SUCCESS: 'Xác nhận lịch học thành công!',
    RESERVATION_CONFIRMATION_FAILED: 'Lỗi khi xác nhận lịch học: {error}',
    CUSTOM_SCHEDULE_SUCCESS: 'Đăng ký lịch học tùy chỉnh thành công!',
    CUSTOM_SCHEDULE_FAILED: 'Lỗi khi đăng ký lịch học tùy chỉnh: {error}'
  };
  
  // Theme configurations
  export const THEME = {
    PRIMARY_COLOR: '#00509f',
    HEADER_HEIGHT: '64px',
    FOOTER_HEIGHT: '50px'
  };
  
  export default {
    API_CONFIG,
    TABLE_IDS,
    FIELD_MAPPINGS,
    ROUTES,
    TIME_SLOTS,
    WEEKDAYS,
    MESSAGES,
    THEME
  };