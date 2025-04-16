import React, { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';

const QRCodeFloat = () => {
  const [expanded, setExpanded] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  // Tạo hiệu ứng pulse định kỳ
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 1500); // Hiệu ứng pulse kéo dài 1.5s
    }, 15000); // Pulse mỗi 15 giây
    
    return () => clearInterval(pulseInterval);
  }, []);

  const toggleExpanded = () => {
    setExpanded(!expanded);
    setShowPulse(false); // Tắt pulse khi user click
  };

  return (
    <div className="qr-code-float-container option1">
      <Tooltip title={expanded ? "Thu gọn" : "Cần hỗ trợ? Kết nối Zalo ngay"} placement="left">
        <div 
          className={`qr-code-float ${expanded ? 'expanded' : ''} ${showPulse ? 'pulse' : ''}`} 
          onClick={toggleExpanded}
        >
          <div className="qr-content">
            {!expanded && <div className="support-icon">?</div>}
            {expanded && <div className="qr-title">Hỗ trợ kỹ thuật</div>}
            <img src="/qr.jpg" alt="Zalo QR Code" className="qr-image" />
            {expanded && (
              <div className="qr-text">
                <p>Quét mã QR để được hỗ trợ</p>
                <p className="qr-subtext">Zalo là kênh giao tiếp chính của ICANCONNECT</p>
                <div className="qr-actions">
                  <a 
                    href="https://zalo.me/2469403091926207597" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="qr-button zalo"
                  >
                    Mở Zalo
                  </a>
                  <a 
                    href="tel:19009399,2" 
                    onClick={(e) => e.stopPropagation()}
                    className="qr-button phone"
                  >
                    <PhoneOutlined /> 1900 9399 (2)
                  </a>
                </div>
                <p className="qr-hotline-text">Gọi hotline để được hỗ trợ</p>
              </div>
            )}
          </div>
        </div>
      </Tooltip>
    </div>
  );
};

export default QRCodeFloat;
