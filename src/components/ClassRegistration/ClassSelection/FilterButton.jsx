import React from 'react';
import { Button, Popover } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

/**
 * Component nút lọc tái sử dụng cho cả desktop và mobile
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon hiển thị trên nút
 * @param {string} props.label - Nhãn hiển thị trên nút
 * @param {number} props.count - Số lượng lựa chọn đã chọn
 * @param {string} props.title - Tiêu đề của popover
 * @param {ReactNode} props.popoverContent - Nội dung của popover
 * @param {boolean} props.isActive - Trạng thái active của nút
 * @param {function} props.onClick - Hàm xử lý khi click vào nút
 * @param {boolean} props.showPopover - Có hiển thị popover hay không (true cho desktop, false cho mobile)
 */
const FilterButton = ({
  icon,
  label,
  count,
  title,
  popoverContent,
  isActive,
  onClick,
  showPopover = true,
  style = {}
}) => {
  const buttonProps = {
    icon,
    type: isActive ? 'primary' : 'default',
    size: 'small',
    onClick: showPopover ? undefined : onClick,
    style: { minWidth: '80px', ...style }
  };

  const displayLabel = (
    <>
      {label} {count > 0 && `(${count})`}
    </>
  );

  // Nếu không hiển thị popover (ví dụ: trên mobile), chỉ render nút
  if (!showPopover) {
    return <Button {...buttonProps}>{displayLabel}</Button>;
  }

  // Trên desktop, render nút với popover
  return (
    <Popover
      content={popoverContent}
      title={title}
      trigger="click"
      placement="bottomLeft"
      overlayClassName="filter-popover"
      destroyTooltipOnHide
    >
      <Button {...buttonProps}>{displayLabel}</Button>
    </Popover>
  );
};

/**
 * Component nút reset lọc
 */
export const ResetFilterButton = ({ onClick, disabled, style = {} }) => (
  <Button
    size="small"
    type="text"
    icon={<ReloadOutlined />}
    onClick={onClick}
    disabled={disabled}
    title="Đặt lại bộ lọc"
    style={{ minWidth: '32px', width: '32px', padding: '0 4px', ...style }}
  />
);

export default FilterButton;
