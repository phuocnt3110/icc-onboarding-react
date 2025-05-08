import React from 'react';
import { Card, Form } from 'antd';
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
    <Card className={`info-card ${styles.card}`}>
      <SectionTitle 
        letter="A" 
        title={SECTION_TITLES.COURSE_INFO} 
      />
      <div className={styles.courseInfoGrid}>
        <div className="course-info-item">
          <div className="course-info-label">Khóa học đã đăng ký:</div>
          <div className="course-info-value">{student.sanPham || '-'}</div>
        </div>
        <div className="course-info-item">
          <div className="course-info-label">Trình độ bắt đầu:</div>
          <div className="course-info-value">{student.trinhDo || '-'}</div>
        </div>
        <div className="course-info-item">
          <div className="course-info-label">Loại lớp:</div>
          <div className="course-info-value">{student.loaiLop || '-'}</div>
        </div>
        <div className="course-info-item">
          <div className="course-info-label">Giáo viên:</div>
          <div className="course-info-value">{student.loaiGV || '-'}</div>
        </div>
        <div className="course-info-item">
          <div className="course-info-label">Số buổi:</div>
          <div className="course-info-value">{student.soBuoi || '-'}</div>
        </div>
        <div className="course-info-item">
          <div className="course-info-label">Học phí:</div>
          <div className="course-info-value">
            {student.tongTien ? formatCurrency(student.tongTien) : '-'}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StudentCourseInfoCard;
