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
      LEVEL: "trinhDo",             // thay đổi từ PACKAGE - goiMua
      CLASS_SIZE: "loaiLop",        // thay đổi từ sizeLop
      TEACHER_TYPE: "loaiGV",       // thay đổi từ loaiGv (chỉ thay đổi chữ cái hoa)
      CURRICULUM: "loTrinh",        // thay đổi từ LEVEL - trinhDO
      BILL_ITEM_ID: "billItemId",   // không thay đổi
      SESSIONS: "soBuoi",           // không thay đổi
      PRICE: "tongTien",            // không thay đổi
      CLASS_CODE: "maLop",      // thay đổi từ maLop
      ASSIGNED_CLASS: "maLopBanGiao", // Thêm mapping cho mã lớp bàn giao
      SCHEDULE: "lichHoc",          // không thay đổi
      START_DATE: "ngayKhaiGiangDuKien", // không thay đổi
      STATUS: "trangThaiChonLop",   // không thay đổi
      ZALO_PHONE: "soDienThoaiDangKyZalo", // không thay đổi
      MA_THEO_DOI: "maTheoDoiHV",   // thay đổi từ maTheoDoi
      GENDER: "gioiTinh",           // không thay đổi
      DOB: "ngaySinh",              // không thay đổi
      LOCATION: "tinhThanh",        // không thay đổi
      GUARDIAN_RELATION: "moiQuanHe", // không thay đổi
      
      // Thêm các trường mới
      CLASSIN_CONFIRM: "classinConfirm",       // Xác nhận sử dụng SĐT học viên cho Classin
      CLASSIN_PHONE: "soDienThoaiDangKyClassin", // SĐT đăng ký Classin
      ZALO_CONFIRM: "zaloConfirm",              // Xác nhận sử dụng SĐT người đại diện cho Zalo
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
      IS_VALID: "checkHopLe",
      SCHEDULE: "lichHoc",
      START_DATE: "ngayKhaiGiangDuKien",
    },
    
    // Student Info table field mappings
    STUDENT_INFO: {
      ID: "Id",
      STUDENT_ID: "maTheoDoiHV",
      SCHEDULE_BITMAP: "scheduleBitmap",
      
      // Thêm các trường mới
      STUDENT_NAME: "tenHocVien",
      GENDER: "gioiTinh",
      DOB: "DOB",
      STUDENT_PHONE: "soDienThoaiHocVien",
      STUDENT_EMAIL: "emailHocVien",
      LOCATION: "tinhThanh",
      GUARDIAN_NAME: "tenNguoiDaiDien",
      GUARDIAN_RELATION: "moiQuanHe",
      GUARDIAN_EMAIL: "emailNguoiDaiDien",
      GUARDIAN_PHONE: "soDienThoaiNguoiDaiDien",
      CLASSIN_PHONE: "soDienThoaiDangKyClassin",
      ZALO_PHONE: "soDienThoaiDangKyZalo"
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
  
  // Country codes for phone input
  export const COUNTRY_CODES = [
    { code: '+84', country: 'Việt Nam' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+82', country: 'South Korea' },
    { code: '+61', country: 'Australia' },
    { code: '+33', country: 'France' },
    { code: '+49', country: 'Germany' },
    { code: '+65', country: 'Singapore' },
    { code: '+66', country: 'Thailand' },
    { code: '+60', country: 'Malaysia' },
    { code: '+62', country: 'Indonesia' },
    { code: '+63', country: 'Philippines' },
    { code: '+7', country: 'Russia' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' },
    { code: '+55', country: 'Brazil' },
    { code: '+91', country: 'India' },
    { code: '+52', country: 'Mexico' },
    { code: '+31', country: 'Netherlands' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+358', country: 'Finland' },
    { code: '+48', country: 'Poland' },
    { code: '+351', country: 'Portugal' },
    { code: '+43', country: 'Austria' },
    { code: '+41', country: 'Switzerland' },
    { code: '+36', country: 'Hungary' },
    { code: '+30', country: 'Greece' }
  ];

  // Danh sách tỉnh thành Việt Nam cập nhật 2025
  export const VIETNAM_PROVINCES = [
    // Miền Bắc
    { code: "HNI", name: "Hà Nội" },
    { code: "HPG", name: "Hải Phòng" },
    { code: "VPC", name: "Vĩnh Phúc" },
    { code: "BNH", name: "Bắc Ninh" },
    { code: "HYN", name: "Hưng Yên" },
    { code: "HBH", name: "Hòa Bình" },
    { code: "HDG", name: "Hải Dương" },
    { code: "QNH", name: "Quảng Ninh" },
    { code: "HGG", name: "Hà Giang" },
    { code: "CBG", name: "Cao Bằng" },
    { code: "BKN", name: "Bắc Kạn" },
    { code: "LCI", name: "Lào Cai" },
    { code: "LSN", name: "Lạng Sơn" },
    { code: "TQG", name: "Tuyên Quang" },
    { code: "YBI", name: "Yên Bái" },
    { code: "TNN", name: "Thái Nguyên" },
    { code: "PTO", name: "Phú Thọ" },
    { code: "DBN", name: "Điện Biên" },
    { code: "LCU", name: "Lai Châu" },
    { code: "SLA", name: "Sơn La" },
    { code: "BGG", name: "Bắc Giang" },
    { code: "THH", name: "Thanh Hóa" },
    { code: "NAN", name: "Nghệ An" },
    { code: "HTH", name: "Hà Tĩnh" },
    
    // Miền Trung
    { code: "QBH", name: "Quảng Bình" },
    { code: "QTI", name: "Quảng Trị" },
    { code: "HUE", name: "Thừa Thiên Huế" },
    { code: "DNG", name: "Đà Nẵng" },
    { code: "QNM", name: "Quảng Nam" },
    { code: "QNI", name: "Quảng Ngãi" },
    { code: "BDH", name: "Bình Định" },
    { code: "PYN", name: "Phú Yên" },
    { code: "KHA", name: "Khánh Hòa" },
    { code: "NTN", name: "Ninh Thuận" },
    { code: "BTN", name: "Bình Thuận" },
    { code: "KTM", name: "Kon Tum" },
    { code: "GLI", name: "Gia Lai" },
    { code: "DLK", name: "Đắk Lắk" },
    { code: "DNO", name: "Đắk Nông" },
    
    // Miền Nam
    { code: "HCM", name: "Hồ Chí Minh" },
    { code: "BDG", name: "Bình Dương" },
    { code: "DNI", name: "Đồng Nai" },
    { code: "TNH", name: "Tây Ninh" },
    { code: "VTU", name: "Bà Rịa - Vũng Tàu" },
    { code: "LDG", name: "Lâm Đồng" },
    { code: "BPC", name: "Bình Phước" },
    { code: "LAN", name: "Long An" },
    { code: "TGG", name: "Tiền Giang" },
    { code: "BTE", name: "Bến Tre" },
    { code: "TVH", name: "Trà Vinh" },
    { code: "VLG", name: "Vĩnh Long" },
    { code: "CTO", name: "Cần Thơ" },
    { code: "HGG", name: "Hậu Giang" },
    { code: "DTP", name: "Đồng Tháp" },
    { code: "AGG", name: "An Giang" },
    { code: "KGG", name: "Kiên Giang" },
    { code: "CMU", name: "Cà Mau" },
    { code: "BTR", name: "Bạc Liêu" },
    { code: "STG", name: "Sóc Trăng" }
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
    FOOTER_HEIGHT: '50px',
    // Thêm các màu và spacing
    TITLE_COLOR: '#00509f',
    TEXT_COLOR: '#333333',
    LABEL_COLOR: '#666666',
    BORDER_COLOR: '#d9d9d9',
    SPACING: {
      SMALL: '8px',
      MEDIUM: '16px',
      LARGE: '24px'
    },
    BORDER_RADIUS: '6px',
    SHADOW: '0 1px 2px rgba(0, 0, 0, 0.1)'
  };
  
  // Section titles
  export const SECTION_TITLES = {
    COURSE_INFO: "Thông tin khóa học",
    STUDENT_INFO: "Thông tin học viên",
    GUARDIAN_INFO: "Thông tin người đại diện",
    CLASS_SELECTION: "Chọn lớp học",
    SCHEDULE_SELECTION: "Chọn lịch học",
    CONFIRMATION: "Xác nhận đăng ký"
  };

  // Danh sách mối quan hệ với học viên
  export const GUARDIAN_RELATIONS = [
    { code: "CHA", name: "Cha" },
    { code: "ME", name: "Mẹ" },
    { code: "ANH_CHI", name: "Anh/Chị" },
    { code: "ONG_BA", name: "Ông/Bà" },
    { code: "BAC", name: "Bác" },
    { code: "CO_DI", name: "Cô/Dì" },
    { code: "CHU", name: "Chú" },
    { code: "CAU", name: "Cậu" },
    { code: "NGUOI_GIAM_HO", name: "Người giám hộ" },
    { code: "KHAC", name: "Khác" }
  ];
  
  export default {
    API_CONFIG,
    TABLE_IDS,
    FIELD_MAPPINGS,
    ROUTES,
    TIME_SLOTS,
    WEEKDAYS,
    COUNTRY_CODES,
    VIETNAM_PROVINCES,
    GUARDIAN_RELATIONS,
    MESSAGES,
    THEME,
    SECTION_TITLES
  };

  console.log('Config loaded:', {
    API_CONFIG,
    TABLE_IDS,
    FIELD_MAPPINGS
  });