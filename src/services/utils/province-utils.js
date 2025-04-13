/**
 * Các hàm tiện ích để làm việc với dữ liệu tỉnh thành
 */

import { VIETNAM_PROVINCES } from '../../config';

/**
 * Tìm tỉnh/thành phố theo tên, hỗ trợ tìm kiếm mờ
 * @param {string} searchTerm - Chuỗi tìm kiếm
 * @param {boolean} useVietnameseTolerant - Có bỏ qua dấu tiếng Việt hay không
 * @returns {Array} Danh sách tỉnh thành phù hợp
 */
export const searchProvinces = (searchTerm, useVietnameseTolerant = true) => {
  if (!searchTerm) return VIETNAM_PROVINCES;
  
  const normalizedTerm = useVietnameseTolerant
    ? normalizeVietnamese(searchTerm.toLowerCase().trim())
    : searchTerm.toLowerCase().trim();
  
  return VIETNAM_PROVINCES.filter(province => {
    const provinceName = useVietnameseTolerant
      ? normalizeVietnamese(province.name.toLowerCase())
      : province.name.toLowerCase();
    
    return provinceName.includes(normalizedTerm);
  });
};

/**
 * Loại bỏ dấu tiếng Việt để hỗ trợ tìm kiếm không phân biệt dấu
 * @param {string} str - Chuỗi cần chuẩn hóa
 * @returns {string} Chuỗi đã loại bỏ dấu
 */
export const normalizeVietnamese = (str) => {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  return str;
};

/**
 * Tìm tỉnh/thành phố phù hợp nhất với chuỗi tìm kiếm
 * @param {string} searchTerm - Chuỗi tìm kiếm
 * @returns {Object|null} Tỉnh/thành phố phù hợp nhất, hoặc null nếu không tìm thấy
 */
export const findBestMatchProvince = (searchTerm) => {
  if (!searchTerm) return null;
  
  // Tìm kiếm chính xác trước
  const exactMatch = VIETNAM_PROVINCES.find(
    province => province.name.toLowerCase() === searchTerm.toLowerCase()
  );
  
  if (exactMatch) return exactMatch;
  
  // Tìm kiếm mờ (bao gồm cả phần)
  const partialMatches = VIETNAM_PROVINCES.filter(
    province => province.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (partialMatches.length > 0) {
    // Sắp xếp để lấy kết quả ngắn gọn nhất (giả định là phù hợp nhất)
    return partialMatches.sort((a, b) => a.name.length - b.name.length)[0];
  }
  
  // Tìm kiếm mờ không dấu
  const normalizedTerm = normalizeVietnamese(searchTerm.toLowerCase());
  const normalizedMatches = VIETNAM_PROVINCES.filter(province => 
    normalizeVietnamese(province.name.toLowerCase()).includes(normalizedTerm)
  );
  
  if (normalizedMatches.length > 0) {
    return normalizedMatches.sort((a, b) => a.name.length - b.name.length)[0];
  }
  
  return null;
};

/**
 * Kiểm tra xem một giá trị có phải là tên tỉnh/thành phố hợp lệ hay không
 * @param {string} provinceName - Tên tỉnh/thành phố cần kiểm tra
 * @returns {boolean} True nếu là tên hợp lệ, False nếu không
 */
export const isValidProvince = (provinceName) => {
  if (!provinceName) return false;
  
  return VIETNAM_PROVINCES.some(
    province => province.name.toLowerCase() === provinceName.toLowerCase()
  );
};

/**
 * Lấy danh sách tỉnh/thành phố gom nhóm theo vùng
 * @returns {Object} Danh sách tỉnh/thành phố theo vùng 
 */
export const getProvincesByRegion = () => {
  return {
    north: VIETNAM_PROVINCES.slice(0, 24), // Miền Bắc
    central: VIETNAM_PROVINCES.slice(24, 39), // Miền Trung
    south: VIETNAM_PROVINCES.slice(39) // Miền Nam
  };
};

export default {
  searchProvinces,
  normalizeVietnamese,
  findBestMatchProvince,
  isValidProvince,
  getProvincesByRegion
};