import React from 'react';
import { Modal, Button } from 'antd';

/**
 * Component hiển thị dialog xác nhận
 */
const ConfirmDialog = ({ 
  visible, 
  title, 
  content, 
  onConfirm, 
  onCancel, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy"
}) => {
  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button 
          key="confirm" 
          type="primary"
          onClick={onConfirm}
          style={{ backgroundColor: '#00509f', borderColor: '#00509f' }}
        >
          {confirmText}
        </Button>
      ]}
      centered
      maskClosable={false}
      closable={true}
    >
      {content}
    </Modal>
  );
};

export default ConfirmDialog;