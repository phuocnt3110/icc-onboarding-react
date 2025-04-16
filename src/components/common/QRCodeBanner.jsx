import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';

// Phương án A: Banner Hỗ Trợ Thu Gọn
const QRCodeBanner = () => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="qr-banner-container">
      <div 
        className={`qr-banner ${expanded ? 'expanded' : ''}`} 
        onClick={toggleExpanded}
      >
        <div className="qr-banner-tab">
          <i className="qr-icon">?</i>
          <span className="qr-banner-text">Cần hỗ trợ?</span>
        </div>
        
        <div className="qr-banner-content">
          <div className="qr-banner-header">
            <h4>Kết nối Zalo hỗ trợ kỹ thuật</h4>
          </div>
          <img src="/qr.jpg" alt="Zalo QR Code" className="qr-banner-image" />
          <div className="qr-banner-footer">
            <p>Quét mã để được hỗ trợ</p>
            <p className="qr-banner-subtitle">Zalo là kênh giao tiếp chính của ICANCONNECT</p>
            <div className="qr-banner-actions">
              <a 
                href="https://zalo.me/2469403091926207597" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="qr-banner-button zalo"
              >
                Mở Zalo
              </a>
              <a 
                href="tel:19009399,2" 
                onClick={(e) => e.stopPropagation()}
                className="qr-banner-button phone"
              >
                <PhoneOutlined /> 1900 9399 (phím 2)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeBanner;
