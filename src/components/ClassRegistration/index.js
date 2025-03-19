// Export main component and sub-components
import ClassRegistration from './index.jsx';
import ReservationConfirmation from './ReservationConfirmation';
import ClassSelection from './ClassSelection';
import CustomSchedule from './CustomSchedule';
import SuccessScreen from './SuccessScreen';
import * as utils from './utils';
import * as api from './api';

// Export main component as default
export default ClassRegistration;

// Export sub-components
export {
  ReservationConfirmation,
  ClassSelection,
  CustomSchedule,
  SuccessScreen,
  utils,
  api
};