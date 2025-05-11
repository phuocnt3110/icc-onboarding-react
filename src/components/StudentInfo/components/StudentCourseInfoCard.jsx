import React from 'react';
import { Card, Form, Row, Col } from 'antd';
import styles from '../StudentInfo.module.css';
import { formatCurrency } from '../utils/formatters';
import { SECTION_TITLES } from '../../../config';

// SectionTitle component
const SectionTitle = ({ letter, title }) => {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitleContainer}>
        <div className={styles.sectionLetter}>{letter}</div>
        <div className={styles.sectionTitle}>{title}</div>
      </div>
    </div>
  );
};

/**
 * Course Information Card component
 * Displays read-only course information
 */
const StudentCourseInfoCard = ({ student, form }) => {
  React.useEffect(() => {
    if (form) {
      console.log('[STEP] [StudentCourseInfoCard] mounted! Current values:', form.getFieldsValue(true));
    } else {
      console.log('[STEP] [StudentCourseInfoCard] mounted!');
    }
    return () => {
      console.log('[STEP] [StudentCourseInfoCard] unmounted!');
    };
  }, [form]);
  
  if (!student) return null;

  return (
    <Card className="card card-md card-primary">
      <div className="card-header">
        <SectionTitle 
          letter="A" 
          title={SECTION_TITLES.COURSE_INFO} 
        />
      </div>
      <div className="card-body">
        <Row gutter={[16, 16]} className="form-row">
          <Col xs={24} sm={12}>
            <Form.Item
              label="Khóa học đã đăng ký"
              className="form-item"
            >
              <div className={styles.displayValue}>
                {student.sanPham || '-'}
              </div>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              label="Trình độ bắt đầu"
              className="form-item"
            >
              <div className={styles.displayValue}>
                {student.trinhDo || '-'}
              </div>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              label="Loại lớp"
              className="form-item"
            >
              <div className={styles.displayValue}>
                {student.loaiLop || '-'}
              </div>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              label="Giáo viên"
              className="form-item"
            >
              <div className={styles.displayValue}>
                {student.loaiGV || '-'}
              </div>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              label="Số buổi"
              className="form-item"
            >
              <div className={styles.displayValue}>
                {student.soBuoi || '-'}
              </div>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              label="Học phí"
              className="form-item"
            >
              <div className={styles.displayValue}>
                {student.tongTien ? formatCurrency(student.tongTien) : '-'}
              </div>
            </Form.Item>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default StudentCourseInfoCard;
