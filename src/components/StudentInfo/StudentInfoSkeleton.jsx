import React from 'react';
import { Skeleton, Card } from 'antd';
import './styles/LazyLoadAnimations.css';

const StudentInfoSkeleton = () => {
  return (
    <div className="white-container">
      {/* Course Info Card - Animation with delay */}
      <Card className="card-fade-in delay-1" style={{ marginBottom: '20px', borderRadius: '12px' }}>
        <Skeleton active paragraph={{ rows: 3 }} title={{ width: '40%' }} />
      </Card>
      
      {/* Personal Info Card - Animation with delay */}
      <Card className="card-fade-in delay-2" style={{ marginBottom: '20px', borderRadius: '12px' }}>
        <Skeleton active paragraph={{ rows: 5 }} title={{ width: '50%' }} />
      </Card>
      
      {/* Guardian Info Card - Animation with delay */}
      <Card className="card-fade-in delay-3" style={{ marginBottom: '20px', borderRadius: '12px' }}>
        <Skeleton active paragraph={{ rows: 4 }} title={{ width: '45%' }} />
      </Card>
      
      {/* Button Placeholder */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '20px',
        marginBottom: '20px' 
      }}>
        <Skeleton.Button active size="large" shape="round" style={{ width: '180px' }} />
      </div>
    </div>
  );
};

export default StudentInfoSkeleton;