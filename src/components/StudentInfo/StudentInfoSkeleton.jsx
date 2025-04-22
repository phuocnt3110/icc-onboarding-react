import React from 'react';
import { Card } from 'antd';
import styles from './StudentInfoSkeleton.module.css';

const StudentInfoSkeleton = () => {
  return (
    <div className={styles.skeletonContainer}>
      {/* Course Information Skeleton */}
      <Card className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.headerRow}>
            <div className={styles.sectionTitle}></div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <div className={styles.label}></div>
              <div className={styles.input}></div>
            </div>
            <div className={styles.formItem}>
              <div className={styles.label}></div>
              <div className={styles.input}></div>
            </div>
            <div className={styles.formItem}>
              <div className={styles.label}></div>
              <div className={styles.input}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Student Information Skeleton */}
      <Card className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.headerRow}>
            <div className={styles.sectionTitle}></div>
          </div>
          <div className={styles.formRow}>
            {[...Array(6)].map((_, index) => (
              <div className={styles.formItem} key={index}>
                <div className={styles.label}></div>
                <div className={styles.input}></div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Guardian Information Skeleton */}
      <Card className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.headerRow}>
            <div className={styles.sectionTitle}></div>
          </div>
          <div className={styles.formRow}>
            {[...Array(4)].map((_, index) => (
              <div className={styles.formItem} key={index}>
                <div className={styles.label}></div>
                <div className={styles.input}></div>
              </div>
            ))}
          </div>
          <div className={styles.buttonRow}>
            <div className={styles.button}></div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StudentInfoSkeleton;