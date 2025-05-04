import StudentInfoMaster from './StudentInfoMaster';
import { StudentInfoProvider, useStudentInfo } from './context/StudentInfoContext';

// Export the main component as default
export default StudentInfoMaster;

// Export other components and hooks for direct access
export {
  StudentInfoProvider,
  useStudentInfo
};
