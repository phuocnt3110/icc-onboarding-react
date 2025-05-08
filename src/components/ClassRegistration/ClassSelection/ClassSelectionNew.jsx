import React from 'react';
import ClassSelectionDesktop from './ClassSelectionDesktop';
import ClassSelectionMobile from './ClassSelectionMobile';

// Simple platform detection (có thể cải tiến sau)
const isMobile = () => window.innerWidth <= 768;

/**
 * Container detect platform và render UI phù hợp
 */
const ClassSelectionNew = (props) => {
  if (isMobile()) {
    return <ClassSelectionMobile {...props} />;
  }
  return <ClassSelectionDesktop {...props} />;
};

export default ClassSelectionNew;
