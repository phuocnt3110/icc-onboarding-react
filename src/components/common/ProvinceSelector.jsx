import React, { useState, useEffect, useMemo } from 'react';
import { Select, Spin, Divider, Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { VIETNAM_PROVINCES } from '../../config';
import { normalizeVietnamese, getProvincesByRegion } from '../../services/utils/province-utils';

const { Text } = Typography;
const { Option, OptGroup } = Select;

/**
 * Component chọn tỉnh/thành phố với tính năng tìm kiếm tiên tiến
 * 
 * @param {Object} props Props component
 * @param {string} props.value Giá trị đã chọn
 * @param {function} props.onChange Hàm callback khi giá trị thay đổi
 * @param {boolean} props.disabled Có disable component không
 * @param {boolean} props.autoFocus Có tự động focus không
 * @param {string} props.placeholder Placeholder text
 * @param {boolean} props.showRegionGroups Có hiển thị nhóm theo vùng miền không
 */
const ProvinceSelector = ({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  placeholder = "Chọn tỉnh/thành phố",
  showRegionGroups = true,
  style = {},
  ...rest
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [fetching, setFetching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Hiệu ứng mở dropdown khi focus
  useEffect(() => {
    if (autoFocus) {
      setDropdownOpen(true);
    }
  }, [autoFocus]);
  
  // Phân chia theo vùng miền
  const provincesByRegion = useMemo(() => {
    return getProvincesByRegion();
  }, []);
  
  // Danh sách tất cả tỉnh thành không phân nhóm
  const allProvinces = useMemo(() => VIETNAM_PROVINCES, []);
  
  // Hàm xử lý khi chọn một tỉnh thành
  const handleSelect = (val) => {
    console.log("ProvinceSelector selected value:", val);
    
    // Đảm bảo val không phải undefined hoặc null
    if (val !== undefined && val !== null && onChange) {
      // Gọi hàm callback với giá trị đã chọn
      onChange(val);
    }
    
    // Đóng dropdown sau khi chọn
    setDropdownOpen(false);
  };
  
  // Hiển thị nhóm theo vùng miền hoặc danh sách đầy đủ
  const renderProvinces = () => {
    if (!showRegionGroups) {
      return allProvinces.map(province => (
        <Option key={province.code} value={province.name} onClick={() => console.log("Option clicked:", province.name)}>
          <div className="d-flex align-items-center">
            <EnvironmentOutlined className="text-primary mr-2" />
            {province.name}
          </div>
        </Option>
      ));
    }
    console.log("Rendering ProvinceSelector with value:", value);
    return (
      <>
        <OptGroup label="Miền Bắc">
          {provincesByRegion.north.map(province => (
            <Option key={province.code} value={province.name} onClick={() => console.log("Option clicked:", province.name)}>
              <div className="d-flex align-items-center">
                <EnvironmentOutlined className="text-primary mr-2" />
                {province.name}
              </div>
            </Option>
          ))}
        </OptGroup>
        <OptGroup label="Miền Trung">
          {provincesByRegion.central.map(province => (
            <Option key={province.code} value={province.name} onClick={() => console.log("Option clicked:", province.name)}>
              <div className="d-flex align-items-center">
                <EnvironmentOutlined className="text-primary mr-2" />
                {province.name}
              </div>
            </Option>
          ))}
        </OptGroup>
        <OptGroup label="Miền Nam">
          {provincesByRegion.south.map(province => (
            <Option key={province.code} value={province.name} onClick={() => console.log("Option clicked:", province.name)}>
              <div className="d-flex align-items-center">
                <EnvironmentOutlined className="text-primary mr-2" />
                {province.name}
              </div>
            </Option>
          ))}
        </OptGroup>
      </>
    );
  };
  
  // Hàm tìm kiếm tỉnh thành nâng cao
  const handleSearch = (value) => {
    setSearchValue(value);
  };
  
  // Tùy chỉnh filter để hỗ trợ tìm kiếm tiếng Việt không dấu
  const filterOption = (input, option) => {
    if (!input || !option) return true;
    
    // Chuẩn hóa giá trị tìm kiếm và option để không phân biệt dấu tiếng Việt
    const normalizedInput = normalizeVietnamese(input.toLowerCase());
    const normalizedOption = normalizeVietnamese(option.children.props.children[1].toLowerCase());
    
    // Kiểm tra xem giá trị tìm kiếm có trong tên tỉnh thành không
    return normalizedOption.includes(normalizedInput);
  };
  
  // Custom dropdown header
  const dropdownRender = (menu) => (
    <div>
      {fetching ? (
        <div className="p-3 text-center">
          <Spin size="small" />
          <Text className="ml-2">Đang tải...</Text>
        </div>
      ) : null}
      {menu}
    </div>
  );
  console.log("Rendering ProvinceSelector with value:", value);
  return (
    <Select
      showSearch
      value={value}
      placeholder={placeholder}
      onChange={handleSelect}
      filterOption={filterOption}
      onSearch={handleSearch}
      className="w-100 province-selector"
      style={style}
      dropdownRender={dropdownRender}
      popupClassName="province-dropdown"
      autoFocus={autoFocus}
      disabled={disabled}
      open={dropdownOpen}
      onDropdownVisibleChange={setDropdownOpen}
      suffixIcon={<EnvironmentOutlined className={disabled ? 'text-light-gray' : 'text-primary'} />}
      {...rest}
    >
      {renderProvinces()}
    </Select>
  );
};

export default ProvinceSelector;