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
 * Update class registration
 * @param {string} classCode - Class code to update
 * @returns {Object} - Updated class data
 */
export const updateClassRegistration = async (classCode) => {
  try {
    const response = await apiClient.patch(
      `/tables/${CLASS}/records/${classCode}`,
      {
        [CLASS_FIELDS.REGISTERED]: true
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating class registration:', error);
    throw new Error(MESSAGES.ERROR.UPDATE_REGISTRATION);
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
    
    // Sử dụng v2 thay vì v1 theo yêu cầu
    const url = `/tables/${CLASS}/records/${classCode}`;
    console.log('DEBUG - checkClassAvailability - API request URL:', url);
    
    const response = await apiClient.get(url);
    const classData = response.data;
    
    console.log('DEBUG - checkClassAvailability - Class data received:', {
      classCode,
      status: classData[CLASS_FIELDS.STATUS],
      registered: classData[CLASS_FIELDS.REGISTERED],
      data: classData
    });
    
    const isAvailable = classData[CLASS_FIELDS.STATUS] === 'active' && 
                      !classData[CLASS_FIELDS.REGISTERED];
                      
    console.log('DEBUG - checkClassAvailability - Class is available:', isAvailable);
    
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