import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Alert, Space, Button, Collapse } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styles from './ConfirmationBox.module.css';

/**
 * Component hộp xác nhận với checkbox
 * Được thiết kế để hiển thị thông tin quan trọng cần xác nhận từ người dùng
 * Hỗ trợ các loại xác nhận khác nhau như đồng ý/không đồng ý, và tùy chọn đầu vào mới
 */
const ConfirmationBox = ({
  title,
  description,
  confirmationText,
  checkboxLabel = 'Tôi xác nhận thông tin trên là chính xác',
  type = 'info',
  required = true,
  value,
  onChange,
  onConfirm,
  onDecline,
  confirmText = 'Xác nhận',
  declineText = 'Không xác nhận',
  showActions = true,
  additionalContent,
  showAdditionalContent = false,
  expandable = false,
  expandableHeader = 'Xem thêm thông tin',
}) => {
  const [isChecked, setIsChecked] = useState(value === '1' || value === true);
  const [showAdditional, setShowAdditional] = useState(showAdditionalContent);
  
  // Xác định icon và type của Alert dựa trên prop type
  const getAlertProps = () => {
    switch (type) {
      case 'success':
        return {
          type: 'success',
          icon: <CheckCircleOutlined />,
          className: styles.successAlert
        };
      case 'error':
        return {
          type: 'error',
          icon: <CloseCircleOutlined />,
          className: styles.errorAlert
        };
      case 'warning':
        return {
          type: 'warning',
          icon: <ExclamationCircleOutlined />,
          className: styles.warningAlert
        };
      case 'info':
      default:
        return {
          type: 'info',
          icon: <InfoCircleOutlined />,
          className: styles.infoAlert
        };
    }
  };
  
  // Xử lý khi checkbox thay đổi
  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    
    if (onChange) {
      onChange(checked ? '1' : '0');
    }
  };
  
  // Xác nhận hành động
  const handleConfirm = () => {
    if (required && !isChecked) {
      return;
    }
    
    if (onConfirm) {
      onConfirm();
    }
  };
  
  // Từ chối hành động
  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
  };
  
  // Toggle hiển thị nội dung bổ sung
  const toggleAdditionalContent = () => {
    setShowAdditional(!showAdditional);
  };
  
  const alertProps = getAlertProps();
  
  return (
    <div className={styles.container}>
      <Alert
        message={title}
        description={
          <div className={styles.alertContent}>
            <p className={styles.description}>{description}</p>
            
            {confirmationText && (
              <div className={styles.confirmationText}>
                <strong>{confirmationText}</strong>
              </div>
            )}
            
            {expandable && additionalContent && (
              <Collapse 
                ghost 
                className={styles.collapsePanel}
              >
                <Collapse.Panel 
                  header={expandableHeader} 
                  key="1"
                  className={styles.collapseHeader}
                >
                  <div className={styles.additionalContent}>
                    {additionalContent}
                  </div>
                </Collapse.Panel>
              </Collapse>
            )}
            
            {!expandable && additionalContent && showAdditional && (
              <div className={styles.additionalContent}>
                {additionalContent}
              </div>
            )}
            
            {!expandable && additionalContent && !showAdditional && (
              <Button 
                type="link" 
                onClick={toggleAdditionalContent}
                className={styles.showMoreButton}
              >
                {expandableHeader}
              </Button>
            )}
            
            <div className={styles.checkboxContainer}>
              <Checkbox
                checked={isChecked}
                onChange={handleCheckboxChange}
                className={styles.checkbox}
              >
                <span className={`${styles.checkboxLabel} ${required ? styles.required : ''}`}>
                  {checkboxLabel}
                </span>
              </Checkbox>
            </div>
            
            {showActions && (
              <div className={styles.actions}>
                <Space>
                  {onDecline && (
                    <Button onClick={handleDecline} className={styles.declineButton}>
                      {declineText}
                    </Button>
                  )}
                  <Button
                    type="primary"
                    onClick={handleConfirm}
                    disabled={required && !isChecked}
                    className={styles.confirmButton}
                  >
                    {confirmText}
                  </Button>
                </Space>
              </div>
            )}
          </div>
        }
        type={alertProps.type}
        icon={alertProps.icon}
        className={`${styles.alert} ${alertProps.className}`}
        showIcon
      />
    </div>
  );
};

ConfirmationBox.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmationText: PropTypes.string,
  checkboxLabel: PropTypes.string,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  required: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  onChange: PropTypes.func,
  onConfirm: PropTypes.func,
  onDecline: PropTypes.func,
  confirmText: PropTypes.string,
  declineText: PropTypes.string,
  showActions: PropTypes.bool,
  additionalContent: PropTypes.node,
  showAdditionalContent: PropTypes.bool,
  expandable: PropTypes.bool,
  expandableHeader: PropTypes.string
};

export default ConfirmationBox;
