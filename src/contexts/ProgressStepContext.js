import React, { createContext, useState, useContext } from 'react';

/**
 * Context để quản lý trạng thái của thanh tiến trình (progress steps)
 * Cung cấp API để các component con có thể tương tác với thanh tiến trình
 */
const ProgressStepContext = createContext();

export const ProgressStepProvider = ({ children }) => {
  // Bước hiện tại (1 = Xác nhận thông tin, 2 = Đặt lịch học)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Các bước đã hoàn thành (mảng chứa số thứ tự của các bước)
  const [completedSteps, setCompletedSteps] = useState([]);

  /**
   * Chuyển đến bước được chỉ định
   * @param {number} step - Số thứ tự của bước cần chuyển đến
   */
  const goToStep = (step) => {
    if (step >= 1 && step <= 2) { // Hiện tại chỉ có 2 bước
      setCurrentStep(step);
    }
  };

  /**
   * Đánh dấu một bước đã hoàn thành
   * @param {number} step - Số thứ tự của bước đã hoàn thành
   */
  const completeStep = (step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  /**
   * Xóa trạng thái hoàn thành của một bước
   * @param {number} step - Số thứ tự của bước cần xóa trạng thái hoàn thành
   */
  const uncompleteStep = (step) => {
    setCompletedSteps(completedSteps.filter(s => s !== step));
  };

  /**
   * Reset tất cả các bước về trạng thái ban đầu
   */
  const resetSteps = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  return (
    <ProgressStepContext.Provider 
      value={{ 
        currentStep, 
        completedSteps, 
        goToStep, 
        completeStep,
        uncompleteStep,
        resetSteps
      }}
    >
      {children}
    </ProgressStepContext.Provider>
  );
};

/**
 * Hook để sử dụng ProgressStepContext
 * @returns {Object} Các giá trị và hàm từ ProgressStepContext
 */
export const useProgressStep = () => useContext(ProgressStepContext);
