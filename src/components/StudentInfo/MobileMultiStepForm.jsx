import React, { useState } from 'react';
import StudentCourseInfoCard from './components/StudentCourseInfoCard';
import StudentPersonalInfoCard from './components/StudentPersonalInfoCard';
import StudentGuardianInfoCard from './components/StudentGuardianInfoCard';
import { Button } from 'antd';

const steps = [
  { label: 'Thông tin khóa học', component: StudentCourseInfoCard },
  { label: 'Thông tin học viên', component: StudentPersonalInfoCard },
  { label: 'Thông tin người đại diện', component: StudentGuardianInfoCard },
];

export default function MobileMultiStepForm({ form, ...props }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Các field cần validate ở bước 2 (Thông tin học viên)
  const [isValidating, setIsValidating] = useState(false);

  const handleNext = () => {
    if (currentStep === 1) {
      const values = form.getFieldsValue();
      let fields = [
        'hoTenHocVien',
        'ngaySinh',
        'gioiTinh',
        'sdtHocVien',
        'emailHocVien',
        'tinhThanh',
        'confirmStudentInfo',
      ];
      // Nếu chọn 'Không' thì bắt buộc SĐT đăng ký ClassIn
      if (values.confirmStudentInfo === '0') {
        fields.push('sdtHocVienMoi');
      }
      setIsValidating(true);
      form.validateFields(fields)
        .then(() => {
          setCurrentStep(currentStep + 1);
        })
        .catch(() => {
          // Không làm gì, AntD sẽ highlight lỗi và không cho chuyển bước
        })
        .finally(() => {
          setIsValidating(false);
        });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Render all steps, only show the active one */}
      {steps.map((step, idx) => {
        const StepComponent = step.component;
        return (
          <div
            key={step.label}
            style={{ display: idx === currentStep ? 'block' : 'none' }}
          >
            <StepComponent form={form} {...props} />
          </div>
        );
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <div>
          {currentStep > 0 && (
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Quay lại</Button>
          )}
        </div>
        <div>
          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={handleNext} loading={isValidating} disabled={isValidating}>
              Tiếp tục
            </Button>
          ) : (
            <Button type="primary" htmlType="submit">
              Xác nhận thông tin
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

