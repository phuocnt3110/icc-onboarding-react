import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'antd';
import styles from './CustomCard.module.css';

/**
 * Component Card tùy chỉnh với các kiểu thiết kế khác nhau
 * Mở rộng từ Card của Ant Design nhưng thêm các tùy chọn
 * styling phù hợp với thiết kế chung của ứng dụng
 */
const CustomCard = ({
  title,
  titleIcon,
  variant = 'default',
  children,
  className = '',
  bordered = true,
  hoverable = true,
  actions,
  header,
  footer,
  ...rest
}) => {
  // Tạo các class dựa trên variant
  const getCardClasses = () => {
    const classes = [styles.card];
    
    // Thêm class cho variant
    switch (variant) {
      case 'primary':
        classes.push(styles.primary);
        break;
      case 'info':
        classes.push(styles.info);
        break;
      case 'success':
        classes.push(styles.success);
        break;
      case 'warning':
        classes.push(styles.warning);
        break;
      case 'danger':
        classes.push(styles.danger);
        break;
      default:
        classes.push(styles.default);
    }
    
    // Thêm class cho hover effect
    if (hoverable) {
      classes.push(styles.hoverable);
    }
    
    // Thêm class bổ sung
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };
  
  // Render title với icon nếu có
  const renderTitle = () => {
    if (!title) return null;
    
    return (
      <div className={styles.cardTitle}>
        {titleIcon && <span className={styles.titleIcon}>{titleIcon}</span>}
        <span>{title}</span>
      </div>
    );
  };
  
  return (
    <Card
      title={renderTitle()}
      bordered={bordered}
      className={getCardClasses()}
      actions={actions}
      {...rest}
    >
      {header && <div className={styles.cardHeader}>{header}</div>}
      <div className={styles.cardBody}>{children}</div>
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </Card>
  );
};

CustomCard.propTypes = {
  title: PropTypes.string,
  titleIcon: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'info', 'success', 'warning', 'danger']),
  children: PropTypes.node,
  className: PropTypes.string,
  bordered: PropTypes.bool,
  hoverable: PropTypes.bool,
  actions: PropTypes.array,
  header: PropTypes.node,
  footer: PropTypes.node
};

export default CustomCard;
