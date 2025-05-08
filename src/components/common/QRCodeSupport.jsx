import React, { useState, useEffect } from 'react';
import QRCodeCard from './QRCodeCard';
import QRCodeFloat from './QRCodeFloat';
import '../../styles/qr-support.css';

/**
 * Component kết hợp hiển thị QRCodeCard trên desktop và QRCodeFloat trên mobile
 */
const QRCodeSupport = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  // Kiểm tra thiết bị
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Render component theo thiết bị
  return isMobile ? <QRCodeFloat /> : <QRCodeCard />;
};

export default QRCodeSupport;
