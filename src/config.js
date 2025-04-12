/**
 * Central configuration file for the application
 * Contains all API tokens, table IDs, and other configurations
 */

console.log('Environment variables:', {
  STUDENT: process.env.REACT_APP_TABLE_STUDENT,
  RESERVATION: process.env.REACT_APP_TABLE_RESERVATION, 
  CLASS: process.env.REACT_APP_TABLE_CLASS,
  STUDENT_INFO: process.env.REACT_APP_TABLE_STUDENT_INFO
});

// API configurations
export const API_CONFIG = {
    // Sử dụng biến môi trường, với fallback nếu không tìm thấy
    TOKEN: process.env.REACT_APP_API_TOKEN,
    BASE_URL: process.env.REACT_APP_API_BASE_URL,
    TIMEOUT: 10000,
    MAX_RETRIES: 2
  };
  
  // Table IDs
  export const TABLE_IDS = {
    STUDENT: process.env.REACT_APP_TABLE_STUDENT,
    RESERVATION: process.env.REACT_APP_TABLE_RESERVATION,
    CLASS: process.env.REACT_APP_TABLE_CLASS,
    STUDENT_INFO: process.env.REACT_APP_TABLE_STUDENT_INFO
  };
  
  // Field mappings between tables
  export const FIELD_MAPPINGS = {
    // Student table field mappings
    STUDENT: {
      ID: "Id",
      NAME: "tenHocVien",           // không thay đổi
      PHONE: "soDienThoaiHocVien",  // không thay đổi
      EMAIL: "emailHocVien",        // không thay đổi
      GUARDIAN_NAME: "tenNguoiDaiDien", // không thay đổi
      GUARDIAN_PHONE: "sdtNguoiDaiDien", // không thay đổi
      GUARDIAN_EMAIL: "mailNguoiDaiDien", // không thay đổi
      PRODUCT: "sanPham",           // không thay đổi
      LEVEL: "trinhDo",           // thay đổi từ PACKAGE - goiMua
      CLASS_SIZE: "loaiLop",        // thay đổi từ sizeLop
      TEACHER_TYPE: "loaiGV",       // thay đổi từ loaiGv (chỉ thay đổi chữ cái hoa)
      CURRICULUM: "loTrinh",             // thay đổi từ LEVEL - trinhDO
      BILL_ITEM_ID: "billItemId",   // không thay đổi
      SESSIONS: "soBuoi",           // không thay đổi
      PRICE: "tongTien",            // không thay đổi
      CLASS_CODE: "maLopChot",      // thay đổi từ maLop
      SCHEDULE: "lichHoc",          // không thay đổi
      START_DATE: "ngayKhaiGiangDuKien", // không thay đổi
      STATUS: "trangThaiChonLop",   // không thay đổi
      LOCATION: "diaChi",           // không thay đổi
      ZALO_PHONE: "soDienThoaiDangKyZalo", // không thay đổi
      MA_THEO_DOI: "maTheoDoiHV",   // thay đổi từ maTheoDoi
    },
    
    // Class table field mappings
    CLASS: {
      ID: "Id",
      CODE: "maLop",             // thay đổi từ classCode
      PRODUCT: "sanPham",        // thay đổi từ product
      SIZE: "loaiLop",           // thay đổi từ size
      TEACHER_TYPE: "loaiGV",    // thay đổi từ teacherType
      LEVEL: "trinhDo",          // không thay đổi
      STATUS: "trangThaiLop",    // sửa lại về đúng tên trangThaiLop
      START_DATE: "ngayKhaiGiangDuKien", // không thay đổi
      SLOTS_LEFT: "soSlotConLai", // không thay đổi
      TOTAL_SLOTS: "siSo",       // không thay đổi
      REGISTERED: "soDaDangKy",  // không thay đổi
      WEEKDAY: "ngayHoc",        // không thay đổi
      START_TIME: "gioBatDau",   // không thay đổi
      END_TIME: "gioKetThuc",    // không thay đổi
    },
    
    // Reservation table field mappings
    RESERVATION: {
      ID: "Id",
      ORDER_CODE: "maGiuCho",    // thay đổi từ ma_order
      CLASS_CODE: "maLop",       // thay đổi từ ma_lop
      IS_VALID: "checkHopLe"     // không thay đổi
    },
    
    // Student Info table field mappings
    STUDENT_INFO: {
      ID: "Id",
      STUDENT_ID: "maHocVien",
      SCHEDULE_BITMAP: "scheduleBitmap"
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

  console.log('Config loaded:', {
    API_CONFIG,
    TABLE_IDS,
    FIELD_MAPPINGS
  });