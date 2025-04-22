import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import styles from './ActionButton.module.css';
import '../../styles/index.css';

/**
 * Component nút hành động tùy chỉnh sử dụng CSS Variables
 * Đảm bảo thống nhất giao diện và hiệu ứng trên toàn ứng dụng
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Loại nút (primary, secondary, success, danger, warning)
 * @param {string} props.size - Kích thước nút (small, medium, large)
 * @param {boolean} props.fullWidth - Nút sẽ lấp đầy chiều rộng container
 * @param {React.ReactNode} props.children - Nội dung nút
 * @param {Function} props.onClick - Hàm xử lý khi click vào nút
 */
const ActionButton = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  className = '',
  onClick,
  ...rest
}) => {
  // Xác định các class dựa trên props
  const getButtonClasses = () => {
    const classes = [styles.actionButton];
    
    // Thêm class cho variant
    switch (variant) {
      case 'primary':
        classes.push(styles.primary);
        break;
      case 'secondary':
        classes.push(styles.secondary);
        break;
      case 'success':
        classes.push(styles.success);
        break;
      case 'danger':
        classes.push(styles.danger);
        break;
      case 'warning':
        classes.push(styles.warning);
        break;
      default:
        classes.push(styles.primary);
    }
    
    // Thêm class cho size
    switch (size) {
      case 'small':
        classes.push(styles.small);
        break;
      case 'medium':
        classes.push(styles.medium);
        break;
      case 'large':
        classes.push(styles.large);
        break;
      default:
        classes.push(styles.medium);
    }
    
    // Thêm class cho fullWidth
    if (fullWidth) {
      classes.push('w-100');
    }
    
    // Thêm class cho animation từ animations.css
    classes.push('animate-fade-in');
    
    // Thêm các class bổ sung
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };
  
  // Xác định loại Button Ant Design tương ứng
  const getButtonType = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'default';
      case 'success':
        return 'primary'; // Sẽ tùy chỉnh màu xanh riêng
      case 'danger':
        return 'primary'; // Sẽ dùng danger prop
      case 'warning':
        return 'primary'; // Sẽ tùy chỉnh màu vàng riêng
      default:
        return 'default';
    }
  };
  
  // Xác định kích thước Button Ant Design tương ứng
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'medium':
        return 'middle';
      case 'large':
        return 'large';
      default:
        return 'middle';
    }
  };
  
  // Xác định props bổ sung
  const getExtraProps = () => {
    const extraProps = {};
    
    // Loading state class
    if (rest.loading) {
      extraProps.className = styles.loading;
    }
    
    return extraProps;
  };
  
  return (
    <Button
      type={getButtonType()}
      size={getButtonSize()}
      className={getButtonClasses()}
      onClick={onClick}
      {...getExtraProps()}
      {...rest}
    >
      {children}
    </Button>
  );
};

ActionButton.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default ActionButton;
