import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import StudentInfo from './components/StudentInfo/StudentInfo';
import ClassRegistration from './components/ClassRegistration/ClassRegistration';
import { StudentProvider } from './contexts/StudentContext';
import { ClassProvider } from './contexts/ClassContext';
import { ProgressStepProvider } from './contexts/ProgressStepContext';
import ProgressSteps from './components/common/ProgressSteps.jsx';
import { ROUTES } from './config';
import './index.css';

const { Header, Content, Footer } = Layout;

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#00509f', // Primary color matching ICANCONNECT blue
    borderRadius: 4,
    fontFamily: "'Montserrat', sans-serif",
  },
};

// Background component with physical path to background.png
const BackgroundImage = () => {
  // In React, files in the public folder are referenced from the root URL
  // So public/background.png becomes just /background.png in the URL
  const backgroundPath = '/background.png';
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 1,
        pointerEvents: 'none',
      }}
    >
      <img
        src={backgroundPath}
        alt=""
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.25,
        }}
        onError={(e) => {
          console.error('Failed to load background image');
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
};

const App = () => {
  // Định nghĩa các bước trong quy trình
  const steps = [
    { label: 'Xác nhận thông tin' },
    { label: 'Đặt lịch học' }
  ];
  
  return (
    <>
      {/* Add background component with physical path */}
      <BackgroundImage />
      
      <ConfigProvider theme={theme} locale={viVN}>
        {/* Wrap entire app with context providers */}
        <StudentProvider>
          <ClassProvider>
            <ProgressStepProvider>
              <Router>
                <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
                  {/* Fixed Header */}
                  <Header style={{ 
                    background: '#fff', 
                    height: '64px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0',
                  }}>
                    <img 
                      src="https://www.icanconnect.vn/_next/image?url=https%3A%2F%2Fs3.icankid.io%2Fmedia%2Fweb%2Fican-connect%2FICanConnect-logo.png&w=256&q=75" 
                      alt="ICANCONNECT Logo" 
                      style={{ height: '45px' }}
                    />
                  </Header>
                  
                  {/* Content with added top padding to prevent overlap with fixed header */}
                  <Content style={{ 
                    padding: '20px 20px', // Tăng padding ngang để có khoảng cách mềm hơn với rìa màn hình
                    background: 'transparent',
                    marginTop: '64px',
                    marginBottom: '50px',
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '100%', // Đảm bảo sử dụng toàn bộ không gian ngang
                  }}>
                    {/* Horizontal Progress Steps */}
                    <ProgressSteps steps={steps} />
                    
                    <Routes>
                      <Route path="/step-one" element={<StudentInfo />} />
                      <Route path="/step-two" element={<ClassRegistration />} />
                      <Route path="/" element={<Navigate to="/step-one" />} />
                      <Route path="*" element={<Navigate to="/step-one" />} />
                    </Routes>
                  </Content>
                  
                  {/* Fixed Footer */}
                  <Footer style={{ 
                    textAlign: 'center',
                    background: '#001529',
                    color: 'rgba(255, 255, 255, 0.7)',
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    padding: '15px 0',
                    height: '50px',
                  }}>
                    <span>ICANCONNECT 2023. All rights reserved.</span>
                  </Footer>
                </Layout>
              </Router>
            </ProgressStepProvider>
          </ClassProvider>
        </StudentProvider>
      </ConfigProvider>
    </>
  );
};

export default App;