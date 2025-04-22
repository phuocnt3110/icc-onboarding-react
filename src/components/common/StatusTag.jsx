import React from 'react';
import PropTypes from 'prop-types';
import { Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import styles from './StatusTag.module.css';

/**
 * Component Tag hiển thị trạng thái với các kiểu và màu sắc khác nhau
 * Mở rộng từ Tag của Ant Design với thêm các icon và kiểu mặc định phù hợp
 */
const StatusTag = ({
  status,
  text,
  icon,
  size = 'default',
  className = '',
  ...rest
}) => {
  // Xác định icon dựa trên status nếu không có icon được cung cấp
  const getIcon = () => {
    if (icon) return icon;
    
    switch (status) {
      case 'success':
        return <CheckCircleOutlined />;
      case 'error':
        return <CloseCircleOutlined />;
      case 'warning':
        return <ExclamationCircleOutlined />;
      case 'info':
        return <InfoCircleOutlined />;
      case 'pending':
        return <ClockCircleOutlined />;
      default:
        return null;
    }
  };
  
  // Xác định màu dựa trên status
  const getColor = () => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'processing';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Xác định các class dựa trên size
  const getClasses = () => {
    const classes = [styles.statusTag];
    
    // Thêm class cho size
    switch (size) {
      case 'small':
        classes.push(styles.small);
        break;
      case 'large':
        classes.push(styles.large);
        break;
      default:
        classes.push(styles.default);
    }
    
    // Thêm class cho status
    classes.push(styles[status]);
    
    // Thêm class bổ sung
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };
  
  return (
    <Tag
      icon={getIcon()}
      color={getColor()}
      className={getClasses()}
      {...rest}
    >
      {text}
    </Tag>
  );
};

StatusTag.propTypes = {
  status: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'pending', 'default']),
  text: PropTypes.string.isRequired,
  icon: PropTypes.node,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  className: PropTypes.string
};

export default StatusTag;
