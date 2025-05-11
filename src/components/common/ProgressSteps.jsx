import React from 'react';
import { useProgressStep } from '../../contexts/ProgressStepContext';

/**
 * Component hiển thị thanh tiến trình (progress steps)
 * Sử dụng ProgressStepContext để xác định trạng thái các bước
 * @param {Object} props - Props của component
 * @param {Array} props.steps - Mảng các bước, mỗi bước là một object có label
 */
const ProgressSteps = ({ steps }) => {
  const { currentStep, completedSteps } = useProgressStep();

  return (
    <div className="progress-steps">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = completedSteps.includes(stepNumber);
        const isActive = currentStep === stepNumber;
        
        return (
          <React.Fragment key={stepNumber}>
            <div 
              className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className={`circle circle-${stepNumber}`}>{stepNumber}</div>
              <div>{step.label}</div>
            </div>
            
            {index < steps.length - 1 && <div className="divider"></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressSteps;
