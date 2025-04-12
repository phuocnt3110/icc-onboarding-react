import React from 'react';
import { Card, Skeleton, Row, Col } from 'antd';
import '../../styles/student-info.css';

const StudentInfoSkeleton = () => {
  return (
    <div className="student-info-container">
      {/* Course Information Skeleton */}
      <Card className="info-card">
        <div className="section-title">
          <span className="section-letter">A</span> Thông tin khóa học
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Skeleton.Input active block />
          </Col>
          <Col xs={24} sm={12}>
            <Skeleton.Input active block />
          </Col>
        </Row>
      </Card>

      {/* Student Information Skeleton */}
      <Card className="info-card">
        <div className="section-title">
          <span className="section-letter">B</span> Thông tin học viên
        </div>
        <Row gutter={[16, 16]}>
          {[...Array(6)].map((_, index) => (
            <Col xs={24} sm={12} key={index}>
              <Skeleton.Input active block />
            </Col>
          ))}
        </Row>
      </Card>

      {/* Guardian Information Skeleton */}
      <Card className="info-card">
        <div className="section-title">
          <span className="section-letter">C</span> Thông tin người đại diện
        </div>
        <Row gutter={[16, 16]}>
          {[...Array(4)].map((_, index) => (
            <Col xs={24} sm={12} key={index}>
              <Skeleton.Input active block />
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default StudentInfoSkeleton; 