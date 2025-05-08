import React from 'react';
import { Card, Form, Input, Select, Radio, Row, Col } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { GUARDIAN_RELATIONS, SECTION_TITLES } from '../../../config';
import { PhoneInput } from '../utils/components';
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
 * Student Guardian Information Card component
 * Displays and allows editing of guardian information
 */
const StudentGuardianInfoCard = ({ form, readOnly = false }) => {
  React.useEffect(() => {
    console.log('[STEP] [StudentGuardianInfoCard] mounted! Current values:', form.getFieldsValue(true));
    return () => {
      console.log('[STEP] [StudentGuardianInfoCard] unmounted!');
    };
  }, []);
  const {
    formValues,
    isFieldEditing,
    handleEditField,
    cancelEditField,
    saveField,
    handleKeyDown,
    confirmGuardianInfo,
    setConfirmGuardianInfo
  } = useStudentInfo();

  // Helper function to handle save with form instance
  const handleSaveField = (field) => {
    saveField(field, form);
  };

  // Helper function to handle key down with form instance
  const handleFieldKeyDown = (e, field) => {
    handleKeyDown(e, field, form);
  };

  return (
    <Card className={`info-card ${styles.card}`}>
      <SectionTitle 
        letter="C" 
        title={SECTION_TITLES.GUARDIAN_INFO}
      />
      
      <Row gutter={[16, 16]} className="form-row">
        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="hoTenDaiDien"
            label={<RequiredLabel text="Họ tên người đại diện" />}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên người đại diện' }]}
            className="form-item editable-field"
            data-field="hoTenDaiDien"
          >
            {isFieldEditing('hoTenDaiDien') ? (
              <div className="edit-field-container">
                <Input 
                  autoFocus
                  defaultValue={formValues.hoTenDaiDien || ''}
                  onKeyDown={(e) => handleFieldKeyDown(e, 'hoTenDaiDien')}
                  onBlur={() => handleSaveField('hoTenDaiDien')}
                  disabled={readOnly}
                />
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('hoTenDaiDien')}
              >
                {form.getFieldValue('hoTenDaiDien') || '-'}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="moiQuanHe"
            label={<RequiredLabel text="Mối quan hệ với học viên" />}
            rules={[{ required: true, message: 'Vui lòng chọn mối quan hệ' }]}
            className="form-item editable-field"
            data-field="moiQuanHe"
          >
            {isFieldEditing('moiQuanHe') ? (
              <div className="edit-field-container">
                <Select
                  style={{ width: '100%' }}
                  autoFocus
                  defaultValue={formValues.moiQuanHe || ''}
                  options={GUARDIAN_RELATIONS.map(item => ({ 
                    value: item.name, 
                    label: item.name 
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      cancelEditField('moiQuanHe');
                    }
                  }}
                  onChange={(value) => {
                    // Kiểm tra giá trị có trong danh sách cho phép
                    if (value && GUARDIAN_RELATIONS.some(item => item.name === value)) {
                      form.setFieldsValue({ moiQuanHe: value });
                      // Auto-save when value changes
                      handleSaveField('moiQuanHe');
                    } else {
                      console.log('[DEBUG] Mối quan hệ không hợp lệ:', value);
                    }
                  }}
                  onBlur={() => {
                    // Khi blur, kiểm tra lại giá trị hiện tại
                    const currentValue = form.getFieldValue('moiQuanHe');
                    if (currentValue && !GUARDIAN_RELATIONS.some(item => item.name === currentValue)) {
                      // Nếu không hợp lệ, đặt lại giá trị ban đầu hoặc xóa
                      form.setFieldsValue({ moiQuanHe: formValues.moiQuanHe || '' });
                    } else {
                      handleSaveField('moiQuanHe');
                    }
                    // Luôn thoát chế độ chỉnh sửa
                    cancelEditField('moiQuanHe');
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
                onClick={() => !readOnly && handleEditField('moiQuanHe')}
              >
                {form.getFieldValue('moiQuanHe') || (formValues.moiQuanHe || '')}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="sdtDaiDien"
            label={<RequiredLabel text="Số điện thoại người đại diện" />}
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại người đại diện' },
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
            data-field="sdtDaiDien"
          >
            {isFieldEditing('sdtDaiDien') ? (
              <div className="edit-field-container">
                <PhoneInput
                  value={form.getFieldValue('sdtDaiDien') || ''}
                  onChange={(value) => form.setFieldsValue({ sdtDaiDien: value })}
                  autoFocus
                  disabled={readOnly}
                  placeholder="Số điện thoại người đại diện"
                  onBlur={() => handleSaveField('sdtDaiDien')}
                />
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('sdtDaiDien')}
              >
                {form.getFieldValue('sdtDaiDien') || '-'}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item preserve={true}
            name="emailDaiDien"
            label="Email người đại diện"
            rules={[
              { 
                type: 'email',
                message: 'Email không hợp lệ!'
              }
            ]}
            className="form-item editable-field"
            data-field="emailDaiDien"
          >
            {isFieldEditing('emailDaiDien') ? (
              <div className="edit-field-container">
                <Input 
                  autoFocus
                  defaultValue={formValues.emailDaiDien || ''}
                  onKeyDown={(e) => handleFieldKeyDown(e, 'emailDaiDien')}
                  onBlur={() => handleSaveField('emailDaiDien')}
                  disabled={readOnly}
                />
              </div>
            ) : (
              <div 
                className="display-value" 
                onClick={() => !readOnly && handleEditField('emailDaiDien')}
              >
                {form.getFieldValue('emailDaiDien') || '-'}
                {!readOnly && <span className="edit-icon"><EditOutlined /></span>}
              </div>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} sm={24}>
          <div className="confirmation-text required">
            Xác nhận sử dụng Số điện thoại người đại diện cho Zalo
          </div>
          <Form.Item preserve={true}
            name="confirmGuardianInfo"
            className="confirmation-select-item"
            rules={[{ required: true, message: 'Vui lòng chọn xác nhận' }]}
          >
            <Select
              onChange={(value) => {
                const stringValue = String(value || '');
                setConfirmGuardianInfo(stringValue || undefined);
              }}
              disabled={readOnly}
              placeholder="Chọn xác nhận"
            >
              <Select.Option value="1">Có</Select.Option>
              <Select.Option value="0">Không</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        {confirmGuardianInfo === '0' && (
          <Col xs={24} sm={12}>
            <Form.Item preserve={true}
              name="newGuardianPhone"
              label={<RequiredLabel text="SĐT đăng ký Zalo" />}
              rules={[
                { required: true, message: 'Vui lòng nhập SĐT đăng ký Zalo' },
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
              data-field="newGuardianPhone"
            >
              {isFieldEditing('newGuardianPhone') ? (
                <div className="edit-field-container">
                  <PhoneInput
                    value={form.getFieldValue('newGuardianPhone') || ''}
                    onChange={(value) => form.setFieldsValue({ newGuardianPhone: value })}
                    autoFocus
                    disabled={readOnly}
                    placeholder="SĐT đăng ký Zalo"
                    onBlur={() => handleSaveField('newGuardianPhone')}
                  />
                </div>
              ) : (
                <div 
                  className="display-value" 
                  onClick={() => !readOnly && handleEditField('newGuardianPhone')}
                >
                  {formValues.newGuardianPhone || '-'}
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

export default StudentGuardianInfoCard;
