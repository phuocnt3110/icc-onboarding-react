import React, { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import { PhoneOutlined, CustomerServiceOutlined } from '@ant-design/icons';

// Floating Support Card cho hỗ trợ kỹ thuật
const QRCodeCard = () => {
  const [expanded, setExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  
  // Hiển thị tooltip khi component mount và ẩn sau 5 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="qr-card-container">
      <div 
        className={`qr-card ${expanded ? 'expanded' : ''} ${showTooltip ? 'with-tooltip' : ''}`} 
        onClick={toggleExpanded}
        style={{ opacity: expanded ? 1 : 0.85 }}
      >
        {showTooltip && !expanded && (
          <div className="qr-card-tooltip">
            <div className="qr-tooltip-content">
              Cần hỗ trợ? Click vào đây!
              <div className="qr-tooltip-arrow"></div>
            </div>
          </div>
        )}
        {!expanded ? (
          <div className="qr-card-collapsed">
            <div className="qr-card-icon">
              <span>💬</span>
            </div>
            <div className="qr-card-label">
              <span>Hỗ trợ kỹ thuật</span>
            </div>
          </div>
        ) : (
          <div className="qr-card-expanded">
            <div className="qr-card-header">
              <h4><CustomerServiceOutlined /> Hỗ trợ kỹ thuật</h4>
              <span className="qr-card-close" onClick={(e) => {e.stopPropagation(); setExpanded(false);}}>×</span>
            </div>
            <div className="qr-card-body">
              <img src="/qr.jpg" alt="Zalo QR Code" className="qr-card-image" />
              <div className="qr-card-text">
                <p>Quét mã QR để được hỗ trợ ngay</p>
                <p className="qr-card-subtext">Đây là kênh hỗ trợ kỹ thuật chính của ICANCONNECT</p>
              </div>
            </div>
            <div className="qr-card-footer">
              <div className="qr-card-contact-options">
                <a 
                  href="https://zalo.me/2469403091926207597" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="qr-card-button zalo"
                >
                  Mở Zalo
                </a>
                <a 
                  href="tel:19009399,2" 
                  onClick={(e) => e.stopPropagation()}
                  className="qr-card-button phone"
                >
                  <PhoneOutlined /> 1900 9399 (phím 2)
                </a>
              </div>
              <p className="qr-card-contact-info">Gọi hotline hoặc kết nối Zalo để được hỗ trợ nhanh nhất</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeCard;
