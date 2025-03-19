import React from 'react';
import { Card, Typography, Button, Result } from 'antd';

const { Title, Text } = Typography;

const ClassRegistration = () => {
  return (
    <Card style={{ borderRadius: '8px', marginBottom: '20px' }}>
      <Result
        status="info"
        title="Đang phát triển"
        subTitle="Tính năng đặt lịch học đang được phát triển"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        }
      />
    </Card>
  );
};

export default ClassRegistration;