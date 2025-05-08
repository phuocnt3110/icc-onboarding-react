import React, { useState, useEffect, useRef } from 'react';
import { Tooltip, Button, Badge, Drawer } from 'antd';
import { CustomerServiceOutlined, PhoneOutlined, ZoomInOutlined, MessageOutlined } from '@ant-design/icons';

const QRCodeFloat = () => {
  const [expanded, setExpanded] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const dragRef = useRef(null);
  
  // Kiểm tra thiết bị
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  // Xử lý kéo thả trên mobile
  useEffect(() => {
    if (!isMobile || !dragRef.current) return;
    
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e) => {
      if (!expanded) { // Chỉ cho phép kéo khi chưa mở rộng
        const touch = e.touches[0];
        startX = touch.clientX - position.x;
        startY = touch.clientY - position.y;
        setIsDragging(true);
      }
    };
    
    const handleTouchMove = (e) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const newX = touch.clientX - startX;
      const newY = touch.clientY - startY;
      
      // Giới hạn trong viewport
      const maxX = window.innerWidth - dragRef.current.offsetWidth;
      const maxY = window.innerHeight - dragRef.current.offsetHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
      
      e.preventDefault(); // Ngăn scroll trang
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      
      // Snap vào cạnh màn hình
      if (dragRef.current) {
        const element = dragRef.current;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Tính toán khoảng cách đến các cạnh
        const distToLeft = centerX;
        const distToRight = window.innerWidth - centerX;
        const distToTop = centerY;
        const distToBottom = window.innerHeight - centerY;
        
        // Tìm cạnh gần nhất
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        // Tính toán vị trí mới (để có khoảng cách 15px từ cạnh)
        let newX = position.x;
        let newY = position.y;
        
        if (minDist === distToRight) {
          // Snap vào bên phải
          newX = window.innerWidth - rect.width - 15;
        } else if (minDist === distToLeft) {
          // Snap vào bên trái
          newX = 15;
        }
        
        if (minDist === distToBottom) {
          // Snap vào bên dưới
          newY = window.innerHeight - rect.height - 15;
        } else if (minDist === distToTop) {
          // Snap vào bên trên
          newY = 15;
        }
        
        setPosition({ x: newX, y: newY });
      }
    };
    
    const element = dragRef.current;
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isDragging, position, expanded]);

  // Tạo hiệu ứng pulse định kỳ
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 1500); // Hiệu ứng pulse kéo dài 1.5s
    }, 30000); // Pulse mỗi 30 giây (giảm tần suất)
    
    return () => clearInterval(pulseInterval);
  }, []);
  
  // Hiển thị tooltip khi component mount và ẩn sau 5 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleExpanded = () => {
    setExpanded(!expanded);
    setShowPulse(false); // Tắt pulse khi user click
  };

  // Nội dung chung của cả drawer và tooltip
  const supportContent = (
    <div className="qr-text" style={{ padding: isMobile ? '0' : '10px' }}>
      <div style={{ textAlign: 'center', margin: '5px 0 15px 0' }}>
        <img 
          src="/qr.jpg" 
          alt="Zalo QR Code" 
          style={{ 
            width: isMobile ? '130px' : '150px', 
            borderRadius: '8px',
            border: '1px solid #eee'
          }} 
        />
        <p style={{ margin: '10px 0 5px 0', fontWeight: '500', fontSize: isMobile ? '14px' : '15px' }}>Quét mã QR để được hỗ trợ</p>
        <p style={{ margin: '0 0 10px 0', fontSize: isMobile ? '12px' : '13px', color: '#666' }}>Zalo là kênh hỗ trợ chính của ICA</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a 
          href="https://zalo.me/2469403091926207597" 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#0180c7',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            fontSize: isMobile ? '13px' : '14px'
          }}
        >
          <MessageOutlined /> Mở Zalo Chat
        </a>
        <a 
          href="tel:19009399,2" 
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            fontSize: isMobile ? '13px' : '14px'
          }}
        >
          <PhoneOutlined /> Hotline: 1900 9399 (2)
        </a>
      </div>
    </div>
  );

  // Tính toán style cho nút trên mobile (draggable)
  const getMobileButtonStyle = () => {
    const defaultStyle = {
      position: 'fixed',
      zIndex: 999,
      touchAction: 'none', // Ngăn chặn scroll khi kéo thả
    };
    
    // Nếu không có position (lần đầu render), dùng vị trí mặc định
    if (position.x === 0 && position.y === 0) {
      return {
        ...defaultStyle,
        right: '15px',
        bottom: '20px'
      };
    }
    
    // Nếu đã có position (đã kéo thả), sử dụng position
    return {
      ...defaultStyle,
      left: `${position.x}px`,
      top: `${position.y}px`,
      transition: isDragging ? 'none' : 'all 0.2s ease-out'
    };
  };
  
  // Hiển thị dạng nút tròn với tooltip trên desktop
  if (!isMobile) {
    return (
      <div className="qr-code-float-container" style={{ 
        position: 'fixed', 
        right: '20px', 
        bottom: '70px',
        zIndex: 999
      }}>
        <Tooltip 
          title={expanded ? null : "Cần hỗ trợ kỹ thuật?"} 
          placement="left"
          mouseEnterDelay={0.5}
        >
          <Badge dot={showPulse} color="#f5222d" offset={[-3, 3]}>
            <Button 
              type={expanded ? "primary" : "default"}
              shape="circle" 
              icon={<CustomerServiceOutlined />} 
              size="large" 
              onClick={toggleExpanded}
              style={{ 
                boxShadow: '0 3px 6px rgba(0,0,0,0.16)', 
                border: expanded ? 'none' : '1px solid #ebedf0'
              }}
            />
          </Badge>
        </Tooltip>

        {expanded && (
          <div style={{
            position: 'absolute',
            bottom: '50px',
            right: '0',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '15px',
            width: '230px',
            zIndex: 1000,
            border: '1px solid #ebedf0'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#1890ff' }}>
                <CustomerServiceOutlined /> Hỗ trợ kỹ thuật
              </h4>
              <Button type="text" size="small" onClick={toggleExpanded} icon={<ZoomInOutlined rotate={180} />} />
            </div>
            {supportContent}
          </div>
        )}
      </div>
    );
  }

  // Hiển thị dạng nút với drawer trên mobile
  return (
    <div 
      ref={dragRef}
      style={getMobileButtonStyle()}
      className={`qr-float-container ${isDragging ? 'dragging' : ''} ${expanded ? 'expanded' : ''}`}
    >
      {!expanded && !isDragging && showTooltip && (
        <Tooltip 
          title={
            <div>
              <div>Cần hỗ trợ? Click vào đây!</div>
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Chạm giữ để di chuyển</div>
            </div>
          }
          visible={true}
          placement="left"
          color="#1a1b1c"
        >
          <div style={{ width: 0, height: 0 }}></div>
        </Tooltip>
      )}
      <Badge dot={showPulse} color="#f5222d" offset={[-3, 3]}>
        <div 
          onClick={toggleExpanded}
          style={{ 
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#00509f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer'
          }}
        >
          <CustomerServiceOutlined style={{ fontSize: '22px', color: '#ffffff' }} />
        </div>
      </Badge>

      <Drawer
        title="Hỗ trợ kỹ thuật"
        placement="bottom"
        closable={true}
        onClose={toggleExpanded}
        open={expanded}
        height="auto"
        bodyStyle={{ padding: '15px' }}
        contentWrapperStyle={{ maxHeight: '70vh' }}
      >
        {supportContent}
      </Drawer>
    </div>
  );
};

export default QRCodeFloat;
