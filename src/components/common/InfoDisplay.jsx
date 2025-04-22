import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import styles from './InfoDisplay.module.css';

/**
 * Component hiển thị thông tin theo cặp label-value
 * Hỗ trợ nhiều kiểu định dạng value khác nhau như text, tag, number, custom
 */
const InfoDisplay = ({
  label,
  value,
  type = 'text',
  icon,
  tooltip,
  tagColor,
  prefix,
  suffix,
  valueClassName = '',
  labelClassName = '',
  layout = 'horizontal',
  size = 'default',
  required = false,
  loading = false,
  emptyText = 'Không có thông tin',
  ...rest
}) => {
  // Kiểm tra giá trị rỗng
  const isEmpty = value === undefined || value === null || value === '';
  
  // Xác định class cho container dựa trên layout và size
  const getContainerClassName = () => {
    const classes = [styles.container];
    
    if (layout === 'horizontal') {
      classes.push(styles.horizontal);
    } else {
      classes.push(styles.vertical);
    }
    
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
    
    return classes.join(' ');
  };
  
  // Xử lý hiển thị giá trị theo type
  const renderValue = () => {
    // Nếu đang loading, hiển thị skeleton
    if (loading) {
      return <div className={styles.skeleton}></div>;
    }
    
    // Nếu giá trị rỗng, hiển thị text rỗng
    if (isEmpty) {
      return <span className={styles.emptyValue}>{emptyText}</span>;
    }
    
    // Xử lý hiển thị theo type
    switch (type) {
      case 'tag':
        return (
          <Tag color={tagColor || 'blue'} className={styles.tag}>
            {value}
          </Tag>
        );
      
      case 'number':
        return (
          <span className={`${styles.value} ${styles.number} ${valueClassName}`}>
            {prefix && <span className={styles.prefix}>{prefix}</span>}
            {value.toLocaleString('vi-VN')}
            {suffix && <span className={styles.suffix}>{suffix}</span>}
          </span>
        );
      
      case 'money':
        return (
          <span className={`${styles.value} ${styles.money} ${valueClassName}`}>
            {value.toLocaleString('vi-VN')}
            <span className={styles.currency}> VNĐ</span>
          </span>
        );
      
      case 'date':
        return (
          <span className={`${styles.value} ${styles.date} ${valueClassName}`}>
            {value instanceof Date 
              ? value.toLocaleDateString('vi-VN') 
              : value}
          </span>
        );
      
      case 'email':
        return (
          <a href={`mailto:${value}`} className={`${styles.value} ${styles.email} ${valueClassName}`}>
            {value}
          </a>
        );
        
      case 'phone':
        return (
          <a href={`tel:${value}`} className={`${styles.value} ${styles.phone} ${valueClassName}`}>
            {value}
          </a>
        );
      
      default:
        return (
          <span className={`${styles.value} ${valueClassName}`}>
            {prefix && <span className={styles.prefix}>{prefix}</span>}
            {value}
            {suffix && <span className={styles.suffix}>{suffix}</span>}
          </span>
        );
    }
  };
  
  // Xác định cấu trúc layout dựa trên prop layout
  const renderContent = () => {
    const labelContent = (
      <div className={`${styles.label} ${required ? styles.required : ''} ${labelClassName}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {label}
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined className={styles.tooltipIcon} />
          </Tooltip>
        )}
      </div>
    );
    
    const valueContent = (
      <div className={styles.valueContainer}>
        {renderValue()}
      </div>
    );
    
    if (layout === 'horizontal') {
      return (
        <Row className={styles.row} {...rest}>
          <Col span={24} sm={8} className={styles.labelCol}>
            {labelContent}
          </Col>
          <Col span={24} sm={16} className={styles.valueCol}>
            {valueContent}
          </Col>
        </Row>
      );
    }
    
    return (
      <div className={styles.column} {...rest}>
        {labelContent}
        {valueContent}
      </div>
    );
  };
  
  return (
    <div className={getContainerClassName()}>
      {renderContent()}
    </div>
  );
};

InfoDisplay.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  type: PropTypes.oneOf(['text', 'tag', 'number', 'money', 'date', 'email', 'phone']),
  icon: PropTypes.node,
  tooltip: PropTypes.string,
  tagColor: PropTypes.string,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  valueClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  size: PropTypes.oneOf(['small', 'default', 'large']),
  required: PropTypes.bool,
  loading: PropTypes.bool,
  emptyText: PropTypes.string
};

export default InfoDisplay;
