import React from 'react';
import { Form, Input, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import styles from './FormField.module.css';

/**
 * Component FormField tái sử dụng với khả năng tùy chỉnh cao
 * Hỗ trợ các tính năng:
 * - Label với/không có dấu *
 * - Tooltip giải thích
 * - Hiển thị lỗi validation
 * - Khả năng tùy chỉnh kiểu input (text, password, textarea, number, etc.)
 */
const FormField = ({
  name,
  label,
  required = false,
  tooltip,
  type = 'text',
  placeholder,
  rules = [],
  className = '',
  children,
  extra,
  ...rest
}) => {
  // Tạo rules validation
  const fieldRules = [...rules];
  
  // Nếu field là required, thêm rule validate
  if (required && !fieldRules.some(rule => rule.required)) {
    fieldRules.push({
      required: true,
      message: `Vui lòng nhập ${label}`
    });
  }
  
  // Render input tùy theo type
  const renderInput = () => {
    if (children) return children;
    
    switch (type) {
      case 'textarea':
        return <Input.TextArea placeholder={placeholder} {...rest} />;
      case 'password':
        return <Input.Password placeholder={placeholder} {...rest} />;
      case 'number':
        return <Input type="number" placeholder={placeholder} {...rest} />;
      default:
        return <Input placeholder={placeholder} {...rest} />;
    }
  };
  
  // Render label với tooltip nếu có
  const renderLabel = () => {
    if (!label) return null;
    
    return (
      <span className={required ? styles.requiredLabel : ''}>
        {label}
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined className={styles.tooltipIcon} />
          </Tooltip>
        )}
      </span>
    );
  };
  
  return (
    <Form.Item
      name={name}
      label={renderLabel()}
      rules={fieldRules}
      className={`${styles.formItem} ${className}`}
      extra={extra}
    >
      {renderInput()}
    </Form.Item>
  );
};

FormField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  type: PropTypes.oneOf(['text', 'textarea', 'password', 'number', 'email']),
  placeholder: PropTypes.string,
  rules: PropTypes.array,
  className: PropTypes.string,
  children: PropTypes.node,
  extra: PropTypes.node
};

export default FormField;
