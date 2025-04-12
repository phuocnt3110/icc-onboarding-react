import React from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Result, 
  Space, 
  Skeleton,
  Row,
  Col,
  Tag
} from 'antd';
import { 
  CheckCircleOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useStudent } from '../../contexts/StudentContext';
import { ROUTES } from '../../config';
import '../../styles/index.css';

const { Title, Text } = Typography;

const SuccessScreen = ({ 
  studentData, 
  onChooseAgain,
  onComplete,
  loading = false
}) => {
  // ... rest of the code ...
};

export default SuccessScreen; 