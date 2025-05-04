import React, { useState, useEffect, useRef } from 'react';
import { Input, Select } from 'antd';
import { COUNTRY_CODES } from '../../../config';

const { Option } = Select;

/**
 * PhoneInput component for phone numbers with country code selection
 * Improved version with better state persistence
 */
export const PhoneInput = ({ value = "", onChange, autoFocus, disabled, placeholder, hint, onBlur }) => {
  // Create a reference to track if component is mounted
  const isMounted = useRef(false);
  
  // Store if we're currently in edit mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Keep track of the last valid value
  const [lastValidValue, setLastValidValue] = useState(value);
  
  /**
   * Parse a phone value into country code and number parts
   */
  const parseValue = (phoneValue) => {
    // If empty, default to Vietnam code
    if (!phoneValue) return { countryCode: '+84', phoneNumber: '' };
    
    // Find matching country code
    const codeObj = COUNTRY_CODES.find(c => phoneValue.startsWith(c.code));
    if (codeObj) {
      return {
        countryCode: codeObj.code,
        phoneNumber: phoneValue.substring(codeObj.code.length).trim()
      };
    }
    
    // Default to Vietnam if no code matches
    return { countryCode: '+84', phoneNumber: phoneValue };
  };
  
  // Parse initial value
  const initialParsed = parseValue(value);
  
  // State for controlled components
  const [countryCode, setCountryCode] = useState(initialParsed.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialParsed.phoneNumber);
  
  // Update internal state when external value changes
  useEffect(() => {
    // Only update if value from parent changes significantly
    if (value !== `${countryCode}${phoneNumber}` && !isEditing) {
      const parsed = parseValue(value);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
      
      // Store this as the last valid value if it's not empty
      if (value) {
        setLastValidValue(value);
      }
    }
  }, [value, isEditing]);
  
  // Mark component as mounted after first render
  useEffect(() => {
    isMounted.current = true;
    
    // Save initial value if not empty
    if (value) {
      setLastValidValue(value);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Handle country code change
  const handleCountryCodeChange = (code) => {
    setCountryCode(code);
    setIsEditing(true);
    
    // Notify parent of combined value
    if (onChange) {
      onChange(`${code}${phoneNumber}`);
    }
  };
  
  // Handle phone number input change
  const handlePhoneNumberChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^\d+]/g, '');
    setPhoneNumber(sanitizedValue);
    setIsEditing(true);
    
    // Notify parent of combined value
    if (onChange) {
      onChange(`${countryCode}${sanitizedValue}`);
    }
  };
  
  // Handle container focus
  const handleContainerFocus = () => {
    setIsEditing(true);
  };
  
  // Handle container blur
  const handleContainerBlur = (e) => {
    // Only process blur if clicking outside container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      // Exit edit mode
      setIsEditing(false);
      
      // Get current combined value
      const currentValue = `${countryCode}${phoneNumber}`;
      
      // If field is empty but we had a previous valid value, restore it
      if (!phoneNumber && lastValidValue) {
        const parsed = parseValue(lastValidValue);
        setCountryCode(parsed.countryCode);
        setPhoneNumber(parsed.phoneNumber);
        
        // Notify parent of restored value
        if (onChange) {
          onChange(lastValidValue);
        }
      } 
      // If field has a value, save it as the last valid value
      else if (phoneNumber) {
        setLastValidValue(currentValue);
      }
      
      // Call onBlur callback if provided
      if (onBlur) {
        onBlur();
      }
    }
  };
  
  return (
    <div 
      className="phone-input-container" 
      onFocus={handleContainerFocus}
      onBlur={handleContainerBlur}
    >
      <div className="input-with-actions">
        <Select
          className="country-code-select"
          value={countryCode}
          onChange={handleCountryCodeChange}
          disabled={disabled}
          popupClassName="country-dropdown"
          popupMatchSelectWidth={false}
          showSearch
          optionFilterProp="label"
          filterOption={(input, option) => {
            const searchText = `${option.value} ${option.data?.country || ''}`.toLowerCase();
            return searchText.includes(input.toLowerCase());
          }}
        >
          {COUNTRY_CODES.map((item) => (
            <Option key={item.code} value={item.code} label={`${item.code} ${item.country}`} data={{ country: item.country }}>
              <div className="country-code-option">
                <span className="country-code">{item.code}</span>
                <span className="country-name">{item.country}</span>
              </div>
            </Option>
          ))}
        </Select>
        
        <Input
          className="phone-number-input"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder || "Số điện thoại"}
          autoFocus={autoFocus}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onBlur) {
              onBlur();
            }
          }}
        />
      </div>
      
      {hint && <div className="phone-input-hint">{hint}</div>}
    </div>
  );
};
