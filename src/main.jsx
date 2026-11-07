import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DanceJudge Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '440px',
            backgroundColor: '#180606',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px', color: '#fff' }}>
              Portal Display Notice
            </h2>
            <p style={{ fontSize: '13px', color: '#a3a3a3', margin: '0 0 16px', lineHeight: 1.5 }}>
              A display refresh is needed. Tap below to refresh the judging portal:
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#f87171',
              fontFamily: 'monospace',
              marginBottom: '20px',
              textAlign: 'left',
              wordBreak: 'break-word',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {this.state.error?.message || 'Display render issue'}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload(true);
              }}
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(220,38,38,0.5)',
                width: '100%'
              }}
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
