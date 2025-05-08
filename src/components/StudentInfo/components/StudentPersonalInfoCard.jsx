import React from 'react';
import { Card, Form, Input, Select, Radio, Row, Col } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { VIETNAM_PROVINCES, SECTION_TITLES } from '../../../config';
import { PhoneInput } from '../utils/components';
import { mapGender, getValidYears } from '../utils/formatters';
import { useStudentInfo } from '../context/StudentInfoContext';
import styles from '../StudentInfo.module.css';

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

// Custom required label
const RequiredLabel = ({ text }) => {
  return <span className={styles.required}>{text}</span>;
};

/**
 * Student Personal Information Card component
 * Displays and allows editing of student personal information
 */
const StudentPersonalInfoCard = ({ form, readOnly = false }) => {
  React.useEffect(() => {
    console.log('[STEP] [StudentPersonalInfoCard] mounted! Current values:', form.getFieldsValue(true));
    return () => {
      console.log('[STEP] [StudentPersonalInfoCard] unmounted!');
    };
  }, []);
  const {
    formValues,
    isFieldEditing,
    isFieldSaving,
    handleEditField,
    cancelEditField,
    saveField,
    handleKeyDown,
    dateValues,
    dateError,
    setDateValues,
    setDateError,
    setEditingFields,
    confirmStudentInfo,
    setConfirmStudentInfo
  } = useStudentInfo();

  // Helper function to handle save with form instance
  const handleSaveField = (field) => {
    saveField(field, form);
  };

  // Helper function to handle key down with form instance
  const handleFieldKeyDown = (e, field) => {
    handleKeyDown(e, field, form);
  };
  
  // Hàm kiểm tra tính hợp lệ của date values và cập nhật form
  const validateDateValues = (values) => {
    const { day, month, year } = values;
    
    // Chỉ kiểm tra nếu đủ ngày/tháng/năm
    if (day && month && year) {
      try {
        // Kiểm tra ngày hợp lệ
        const newDate = new Date(year, month - 1, day);
        if (newDate.getDate() !== day || newDate.getMonth() !== month - 1 || newDate.getFullYear() !== year) {
          setDateError('Ngày không hợp lệ');
          return false;
        }
        
        // Format ngày
        const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        
        // Cập nhật form
        form.setFieldsValue({ ngaySinh: formattedDate });
        setDateError(null);
        return true;
      } catch (error) {
        console.error('[DEBUG] Error validating date:', error);
        setDateError('Ngày không hợp lệ');
        return false;
      }
    }
    return false;
  };

  return (
    <Card className={`info-card ${styles.card}`}>
      <SectionTitle 
        letter="B" 
        title={SECTION_TITLES.STUDENT_INFO}
      />
      
      <Row gutter={[16, 16]} className="form-row">
        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="hoTenHocVien"
            label={<RequiredLabel text="Họ và tên học viên" />}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên học viên' }]}
            className="form-item editable-field"
            data-field="hoTenHocVien"
          >
            {isFieldEditing('hoTenHocVien') ? (
              <div className="edit-field-container">
                <Input 
                  autoFocus
                  defaultValue={formValues.hoTenHocVien || ''}
                  onKeyDown={(e) => handleFieldKeyDown(e, 'hoTenHocVien')}
                  onBlur={() => handleSaveField('hoTenHocVien')}
                  disabled={readOnly}
                />
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('hoTenHocVien')}
              >
                {form.getFieldValue('hoTenHocVien') || '-'}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="gioiTinh"
            label={<RequiredLabel text="Giới tính" />}
            rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
            className="form-item editable-field"
            data-field="gioiTinh"
          >
            {isFieldEditing('gioiTinh') ? (
              <div className="edit-field-container">
                <Select
                  style={{ width: '100%' }}
                  autoFocus
                  defaultValue={formValues.gioiTinh || ''}
                  options={[
                    { value: 'Nam', label: 'Nam' },
                    { value: 'Nữ', label: 'Nữ' },
                  ]}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      cancelEditField('gioiTinh');
                    }
                  }}
                  onChange={(value) => {
                    form.setFieldsValue({ gioiTinh: value });
                    // Auto-save when value changes
                    handleSaveField('gioiTinh');
                  }}
                  onBlur={() => handleSaveField('gioiTinh')}
                  disabled={readOnly}
                  open={true} // Auto-open dropdown
                />
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('gioiTinh')}
              >
                {form.getFieldValue('gioiTinh') || '-'}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="ngaySinh"
            label={<RequiredLabel text="Ngày sinh" />}
            rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
            className="form-item editable-field"
            data-field="ngaySinh"
          >
            {isFieldEditing('ngaySinh') ? (
              <div 
                className="edit-field-container date-select-container"
                onBlur={(e) => {
                  console.log('[DEBUG] Date container onBlur triggered', e);
                  // Xử lý trực tiếp tại component thay vì phụ thuộc vào hàm từ context
                  // Chỉ thoát chế độ edit khi click ra ngoài date container
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    console.log('[DEBUG] Click detected outside date selector');
                    if (dateValues.day && dateValues.month && dateValues.year && !dateError) {
                      // Nếu ngày hợp lệ, format và lưu vào form
                      const formattedDate = `${dateValues.day.toString().padStart(2, '0')}/${dateValues.month.toString().padStart(2, '0')}/${dateValues.year}`;
                      console.log('[DEBUG] Saving formatted date:', formattedDate);
                      form.setFieldsValue({ ngaySinh: formattedDate });
                    } 
                    // Luôn thoát chế độ chỉnh sửa khi click ra ngoài, bất kể có thay đổi hợp lệ hay không
                    console.log('[DEBUG] Exiting date edit mode');
                    setEditingFields(prev => prev.filter(f => f !== 'ngaySinh'));
                  }
                }}
              >
                <div className="date-select-group">
                  {/* Select for day */}
                  <Select
                    autoFocus
                    style={{ width: '32%' }}
                    placeholder="Ngày"
                    onChange={(value) => {
                      // Xử lý ngày thay đổi trực tiếp trong component
                      const newDateValues = { ...dateValues, day: value };
                      setDateValues(newDateValues);
                      
                      // Kiểm tra tính hợp lệ nếu đủ ngày/tháng/năm
                      validateDateValues(newDateValues);
                    }}
                    value={dateValues.day}
                    popupMatchSelectWidth={false}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <Select.Option key={`day-${day}`} value={day}>
                        {day}
                      </Select.Option>
                    ))}
                  </Select>
                  
                  {/* Select for month */}
                  <Select
                    style={{ width: '36%' }}
                    placeholder="Tháng"
                    onChange={(value) => {
                      // Xử lý tháng thay đổi trực tiếp trong component
                      const newDateValues = { ...dateValues, month: value };
                      setDateValues(newDateValues);
                      
                      // Kiểm tra tính hợp lệ nếu đủ ngày/tháng/năm
                      validateDateValues(newDateValues);
                    }}
                    value={dateValues.month}
                    popupMatchSelectWidth={false}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <Select.Option key={`month-${month}`} value={month}>
                        {month}
                      </Select.Option>
                    ))}
                  </Select>
                  
                  {/* Select for year */}
                  <Select
                    style={{ width: '32%' }}
                    placeholder="Năm"
                    onChange={(value) => {
                      // Xử lý năm thay đổi trực tiếp trong component
                      const newDateValues = { ...dateValues, year: value };
                      setDateValues(newDateValues);
                      
                      // Kiểm tra tính hợp lệ nếu đủ ngày/tháng/năm
                      validateDateValues(newDateValues);
                    }}
                    value={dateValues.year}
                    popupMatchSelectWidth={false}
                  >
                    {getValidYears().map(year => (
                      <Select.Option key={`year-${year}`} value={year}>
                        {year}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                
                {dateError && <div className="date-error">{dateError}</div>}
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('ngaySinh')}
              >
                {form.getFieldValue('ngaySinh') || '-'}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="tinhThanh"
            label={<RequiredLabel text="Tỉnh/Thành" />}
            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành' }]}
            className="form-item editable-field"
            data-field="tinhThanh"
          >
            {isFieldEditing('tinhThanh') ? (
              <div className="edit-field-container">
                <Select
                  style={{ width: '100%' }}
                  autoFocus
                  defaultValue={formValues.tinhThanh || ''}
                  options={VIETNAM_PROVINCES.map(p => ({ 
                    value: p.name, 
                    label: p.name 
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      cancelEditField('tinhThanh');
                    }
                  }}
                  onChange={(value) => {
                    // Kiểm tra giá trị có trong danh sách cho phép
                    if (value && VIETNAM_PROVINCES.some(p => p.name === value)) {
                      form.setFieldsValue({ tinhThanh: value });
                      // Auto-save when value changes
                      handleSaveField('tinhThanh');
                    } else {
                      console.log('[DEBUG] Tỉnh thành không hợp lệ:', value);
                    }
                  }}
                  onBlur={() => {
                    // Khi blur, kiểm tra lại giá trị hiện tại
                    const currentValue = form.getFieldValue('tinhThanh');
                    if (currentValue && !VIETNAM_PROVINCES.some(p => p.name === currentValue)) {
                      // Nếu không hợp lệ, đặt lại giá trị ban đầu hoặc xóa
                      form.setFieldsValue({ tinhThanh: formValues.tinhThanh || '' });
                    } else {
                      handleSaveField('tinhThanh');
                    }
                    // Luôn thoát chế độ chỉnh sửa
                    cancelEditField('tinhThanh');
                  }}
                  disabled={readOnly}
                  showSearch
                  filterOption={(input, option) =>
                    option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  open={true} // Auto-open dropdown
                />
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('tinhThanh')}
              >
                {form.getFieldValue('tinhThanh') || (formValues.tinhThanh || '')}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="sdtHocVien"
            label={<RequiredLabel text="Số điện thoại học viên" />}
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại học viên' },
              { 
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  
                  // Đếm số chữ số trong chuỗi số điện thoại
                  const digitCount = (value.match(/\d/g) || []).length;
                  
                  // Kiểm tra đơn giản - số điện thoại cần ít nhất 9 chữ số
                  // Không cần phân biệt mã quốc gia hay định dạng
                  if (digitCount < 9) {
                    return Promise.reject(new Error('Số điện thoại phải có ít nhất 9 chữ số'));
                  }
                  
                  return Promise.resolve();
                }
              }
            ]}
            className="form-item editable-field"
            data-field="sdtHocVien"
          >
            {isFieldEditing('sdtHocVien') ? (
              <div className="edit-field-container">
                <PhoneInput
                  value={form.getFieldValue('sdtHocVien') || ''}
                  onChange={(value) => form.setFieldsValue({ sdtHocVien: value })}
                  autoFocus
                  disabled={readOnly}
                  placeholder="Số điện thoại học viên"
                  onBlur={() => handleSaveField('sdtHocVien')}
                />
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('sdtHocVien')}
              >
                {form.getFieldValue('sdtHocVien') || '-'}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="emailHocVien"
            label="Email học viên"
            rules={[
              { 
                type: 'email', 
                message: 'Email không hợp lệ!' 
              }
            ]}
            className="form-item editable-field"
            data-field="emailHocVien"
          >
            {isFieldEditing('emailHocVien') ? (
              <div className="edit-field-container">
                <Input 
                  autoFocus
                  defaultValue={formValues.emailHocVien || ''}
                  onKeyDown={(e) => handleFieldKeyDown(e, 'emailHocVien')}
                  onBlur={() => handleSaveField('emailHocVien')}
                  disabled={readOnly}
                />
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('emailHocVien')}
              >
                {form.getFieldValue('emailHocVien') || '-'}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={24}>
          <div className="confirmation-text required">
            Xác nhận sử dụng Số điện thoại học viên để mở tài khoản học trực tuyến
          </div>
          <Form.Item preserve={true}
            name="confirmStudentInfo"
            className="confirmation-select-item"
            rules={[{ required: true, message: 'Vui lòng chọn xác nhận' }]}
          >
            <Select
              value={form.getFieldValue('confirmStudentInfo')}
              onChange={(value) => {
                const stringValue = String(value || '');
                setConfirmStudentInfo(stringValue || undefined);
                form.setFieldsValue({ confirmStudentInfo: stringValue });
              }}
              disabled={readOnly}
              placeholder="Chọn xác nhận"
            >
              <Select.Option value="1">Có</Select.Option>
              <Select.Option value="0">Không</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        {form.getFieldValue('confirmStudentInfo') === '0' && (
          <Col xs={24} sm={12}>
            <Form.Item preserve={true}
              name="sdtHocVienMoi"
              label={<RequiredLabel text="SĐT đăng ký ClassIn" />}
              rules={[
                { required: true, message: 'Vui lòng nhập SĐT đăng ký ClassIn' },
                { 
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    
                    // Đếm số chữ số trong chuỗi số điện thoại
                    const digitCount = (value.match(/\d/g) || []).length;
                    
                    // Kiểm tra đơn giản - số điện thoại cần ít nhất 9 chữ số
                    // Không cần phân biệt mã quốc gia hay định dạng
                    if (digitCount < 9) {
                      return Promise.reject(new Error('Số điện thoại phải có ít nhất 9 chữ số'));
                    }
                    
                    return Promise.resolve();
                  }
                }
              ]}
              className="form-item editable-field"
              data-field="sdtHocVienMoi"
            >
              {isFieldEditing('sdtHocVienMoi') ? (
                <div className="edit-field-container">
                  <PhoneInput
                    value={form.getFieldValue('sdtHocVienMoi') || ''}
                    onChange={(value) => form.setFieldsValue({ sdtHocVienMoi: value })}
                    autoFocus
                    disabled={readOnly}
                    placeholder="SĐT đăng ký ClassIn"
                    onBlur={() => handleSaveField('sdtHocVienMoi')}
                  />
                </div>
              ) : (
                <div 
                  className="display-value" 
                  onClick={() => !readOnly && handleEditField('sdtHocVienMoi')}
                >
                  {formValues.sdtHocVienMoi || '-'}
                  {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
                </div>
              )}
            </Form.Item>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default StudentPersonalInfoCard;
