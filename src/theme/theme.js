/**
 * Theme configuration cho toàn bộ ứng dụng
 * Sử dụng với Ant Design ConfigProvider
 */

const theme = {
  token: {
    // Colors
    colorPrimary: '#00509f', // ICC blue
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // Typography
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 18,
    fontSizeHeading1: 24,
    fontSizeHeading2: 20,
    fontSizeHeading3: 16,
    fontSizeHeading4: 14,
    fontSizeHeading5: 12,
    
    // Layout
    borderRadius: 4,
    borderRadiusLG: 8,
    borderRadiusSM: 2,
    
    // Spacing
    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,
    
    // Shadows
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  components: {
    Button: {
      borderRadius: 4,
      paddingInline: 16,
      controlHeight: 36,
    },
    Card: {
      borderRadius: 8,
      padding: 16,
    },
    Input: {
      borderRadius: 4,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 4,
      controlHeight: 36,
    },
    Modal: {
      borderRadius: 8,
      paddingMD: 20,
    },
    Table: {
      borderRadius: 8,
      padding: 16,
    },
    Tabs: {
      inkBarColor: '#00509f',
    },
    Tag: {
      borderRadius: 4,
    },
    Menu: {
      borderRadius: 4,
    },
  }
};

export default theme;
