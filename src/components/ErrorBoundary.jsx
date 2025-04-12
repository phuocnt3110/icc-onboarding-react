import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <Result
            status="error"
            title="Đã xảy ra lỗi"
            subTitle="Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
            extra={[
              <Button type="primary" key="retry" onClick={this.handleRetry}>
                Thử lại
              </Button>,
              <Button key="home" onClick={() => window.location.href = '/'}>
                Về trang chủ
              </Button>
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 