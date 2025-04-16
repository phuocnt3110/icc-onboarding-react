import { TABLE_IDS, FIELD_MAPPINGS, MESSAGES } from '../../config';
import apiClient from './client';

// Extract values from config
const { CLASS } = TABLE_IDS;
const { CLASS: CLASS_FIELDS } = FIELD_MAPPINGS;

// Không cần các log debug trước đây nữa

/**
 * Fetch available classes based on filters
 * @param {Object} filters - Filter criteria
 * @returns {Array} - List of available classes
 */
export const fetchAvailableClasses = async (filters) => {
  try {
    // Log thông tin về các điều kiện lọc
    console.log('FILTER - Tìm lớp học với các điều kiện:', {
      trạngThái: 'Dự kiến khai giảng',
      sảnPhẩm: filters?.sanPham || 'Không có thông tin',
      loạiLớp: filters?.loaiLop || 'Không có thông tin',
      loạiGV: filters?.loaiGV || 'Không có thông tin',
      trìnhDo: filters?.trinhDo || 'Không có thông tin'
    });
    
    // Đảm bảo đường dẫn API đúng với NocoDB v2
    const url = `/tables/${CLASS}/records`;
    
    // Xây dựng câu lệnh where kết hợp tất cả các điều kiện với AND
    let whereConditions = [`(${CLASS_FIELDS.STATUS},eq,Dự kiến khai giảng)`];
    
    // Thêm các điều kiện lọc theo các trường
    if (filters?.sanPham) {
      whereConditions.push(`(sanPham,eq,${filters.sanPham})`);
    }
    
    if (filters?.loaiLop) {
      whereConditions.push(`(loaiLop,eq,${filters.loaiLop})`);
    }
    
    if (filters?.loaiGV) {
      whereConditions.push(`(loaiGV,eq,${filters.loaiGV})`);
    }
    
    if (filters?.trinhDo) {
      whereConditions.push(`(trinhDo,eq,${filters.trinhDo})`);
    }
    
    // Kết hợp các điều kiện với AND
    const whereClause = whereConditions.join('~and');
    
    const params = {
      where: whereClause
    };
    
    console.log('FILTER - Query gửi đến API với điều kiện AND:', params);
    
    // Gọi API
    const response = await apiClient.get(url, { params });
    
    // Log kết quả thành công
    // Log kết quả từ API
    const result = response.data.list || [];
    
    if (result.length === 0) {
      console.log('FILTER - KHÔNG tìm thấy lớp học nào phù hợp với điều kiện lọc!');
    } else {
      console.log(`FILTER - Tìm thấy ${result.length} lớp học phù hợp với điều kiện lọc`);
      
      // Hiển thị ngắn gọn các lớp đã tìm thấy
      const classDetails = result.map(cls => ({
        mãLớp: cls[CLASS_FIELDS.CODE],
        trạngThái: cls[CLASS_FIELDS.STATUS],
        ngàyKhaiGiảng: cls[CLASS_FIELDS.START_DATE],
        sảnPhẩm: cls.sanPham,
        loạiLớp: cls.loaiLop,
        loạiGV: cls.loaiGV,
        trìnhDo: cls.trinhDo
      }));
      
      console.log('FILTER - Danh sách lớp học:', classDetails);
    }
    
    return result;
  } catch (error) {
    // Xử lý lỗi gọn gàng hơn
    console.error('FILTER - Lỗi khi tìm lớp học:', error.message);
    
    throw new Error(MESSAGES.CLASS_FETCH_ERROR);
  }
};

/**
 * Update class registration - tăng số lượng đăng ký (soDaDangKy) lên 1 cho tất cả các bản ghi có cùng mã lớp
 * @param {string} classCode - Class code (maLop) của lớp cần cập nhật
 * @returns {Object} - Updated class data
 */
export const updateClassRegistration = async (classCode) => {
  try {
    console.log('Cập nhật số đăng ký cho lớp:', classCode);
    
    // 1. Tìm tất cả các bản ghi lớp học dựa trên mã lớp
    const searchResponse = await apiClient.get(`/tables/${CLASS}/records`, {
      params: {
        where: `(${CLASS_FIELDS.CODE},eq,${classCode})`
      }
    });
    
    if (!searchResponse.data?.list?.length) {
      console.error(`Không tìm thấy lớp học với mã: ${classCode}`);
      throw new Error(`Không tìm thấy lớp học với mã: ${classCode}`);
    }
    
    const classRecords = searchResponse.data.list;
    console.log(`Tìm thấy ${classRecords.length} bản ghi cho lớp ${classCode}`);
    
    // Sử dụng bản ghi đầu tiên để lấy thông tin chung
    const firstRecord = classRecords[0];
    console.log('Thông tin lớp học hiện tại:', {
      maLop: firstRecord[CLASS_FIELDS.CODE],
      soDaDangKy: firstRecord[CLASS_FIELDS.REGISTERED],
      soSlotConLai: firstRecord[CLASS_FIELDS.SLOTS_LEFT],
      siSo: firstRecord[CLASS_FIELDS.TOTAL_SLOTS]
    });
    
    // 2. Tính toán số đăng ký mới - xử lý trường hợp soDaDangKy là text
    let currentRegistrations = firstRecord[CLASS_FIELDS.REGISTERED] || "0";
    let currentSlotsLeft = firstRecord[CLASS_FIELDS.SLOTS_LEFT] || "0";
    let newRegistrations;
    let newSlotsLeft;
    
    // Xử lý trường hợp soDaDangKy là chuỗi
    if (typeof currentRegistrations === 'string') {
      // Chuyển thành số, cộng 1, rồi chuyển lại thành chuỗi
      newRegistrations = (parseInt(currentRegistrations, 10) + 1).toString();
    } else {
      // Trường hợp đã là số
      newRegistrations = currentRegistrations + 1;
    }
    
    // Xử lý trường hợp soSlotConLai là chuỗi
    if (typeof currentSlotsLeft === 'string') {
      // Chuyển thành số, trừ 1, rồi chuyển lại thành chuỗi
      newSlotsLeft = Math.max(0, parseInt(currentSlotsLeft, 10) - 1).toString();
    } else {
      // Trường hợp đã là số
      newSlotsLeft = Math.max(0, currentSlotsLeft - 1);
    }
    
    console.log(`Cập nhật số đăng ký: ${currentRegistrations} -> ${newRegistrations}`);
    console.log(`Cập nhật số slot còn lại: ${currentSlotsLeft} -> ${newSlotsLeft}`);
    
    // 3. Cập nhật cho tất cả các bản ghi của lớp học
    const updatePromises = classRecords.map(async (record) => {
      const updateData = {
        Id: record.Id,
        [CLASS_FIELDS.REGISTERED]: newRegistrations,
        [CLASS_FIELDS.SLOTS_LEFT]: newSlotsLeft
      };
      
      console.log(`Cập nhật bản ghi ${record.Id} cho lớp ${classCode}:`, updateData);
      
      return apiClient.patch(
        `/tables/${CLASS}/records`, 
        updateData
      );
    });
    
    // Thực hiện tất cả các cập nhật cùng lúc
    const updateResults = await Promise.all(updatePromises);
    
    console.log(`Đã cập nhật thành công ${updateResults.length} bản ghi cho lớp ${classCode}`);
    return { success: true, updatedRecords: updateResults.length };
  } catch (error) {
    console.error('Lỗi khi cập nhật số đăng ký lớp học:', error);
    if (error.response) {
      console.error('Response error:', error.response.data);
    }
    throw new Error(MESSAGES.ERROR_UPDATE_REGISTRATION || 'Lỗi khi cập nhật số đăng ký lớp học');
  }
};

/**
 * Check if a class is available for registration
 * @param {string} classCode - Class code to check
 * @returns {boolean} - Whether the class is available
 */
export const checkClassAvailability = async (classCode) => {
  try {
    console.log('DEBUG - checkClassAvailability - Checking availability for class:', classCode);
    
    // Tìm lớp học theo mã lớp thay vì ID (giống updateClassRegistration)
    const searchResponse = await apiClient.get(`/tables/${CLASS}/records`, {
      params: {
        where: `(${CLASS_FIELDS.CODE},eq,${classCode})`
      }
    });
    
    console.log('DEBUG - checkClassAvailability - Search response:', searchResponse.data);
    
    if (!searchResponse.data?.list?.length) {
      console.log(`DEBUG - checkClassAvailability - Không tìm thấy lớp học với mã: ${classCode}`);
      return false;
    }
    
    const classData = searchResponse.data.list[0];
    
    console.log('DEBUG - checkClassAvailability - Class data received:', {
      classCode,
      status: classData[CLASS_FIELDS.STATUS],
      registered: classData[CLASS_FIELDS.REGISTERED],
      data: classData
    });
    
    // Kiểm tra tính khả dụng của lớp học
    // Chấp nhận lớp có trạng thái "Dự kiến khai giảng" và kiểm tra đúng trường hợp số đăng ký
    const status = classData[CLASS_FIELDS.STATUS];
    const registered = classData[CLASS_FIELDS.REGISTERED];
    
    // Kiểm tra số slot còn lại (nếu có) và số tổng slot
    const slotsLeft = classData[CLASS_FIELDS.SLOTS_LEFT];
    const totalSlots = classData[CLASS_FIELDS.TOTAL_SLOTS];
    
    // Lớp khả dụng nếu:
    // 1. Trạng thái là 'active' HOẶC 'Dự kiến khai giảng'
    // 2. Và không phụ thuộc vào số đăng ký (registered) của lớp, chỉ cần có slot trống
    const isStatusValid = status === 'active' || status === 'Dự kiến khai giảng';
    
    // Cho phép đăng ký nếu:
    // - Không có thông tin về số slot còn lại, hoặc
    // - Số slot còn lại > 0
    let hasSlotsAvailable = true;
    if (slotsLeft !== undefined && slotsLeft !== null) {
      const slotsLeftNum = parseInt(slotsLeft, 10);
      hasSlotsAvailable = isNaN(slotsLeftNum) ? true : (slotsLeftNum > 0);
    }
    
    const isAvailable = isStatusValid && hasSlotsAvailable;
    
    console.log('DEBUG - checkClassAvailability - Status check:', {
      status, 
      isStatusValid,
      registered,
      slotsLeft,
      totalSlots,
      hasSlotsAvailable,
      isAvailable
    });
    
    return isAvailable;
  } catch (error) {
    console.error('DEBUG - checkClassAvailability - Error checking class availability:', {
      classCode,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
}; 