// Application entry point
// Initializes React app with error boundary and accessibility support

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
    
    // In production, send error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('Production error:', { error, errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-500 text-6xl mb-4">⚠</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              アプリケーションエラーが発生しました
            </h1>
            <p className="text-gray-600 mb-6">
              申し訳ありません。予期しないエラーが発生しました。
              ページを再読み込みしてください。
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                再読み込み
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                再試行
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  エラー詳細を表示
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto text-red-600">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Accessibility improvements
document.addEventListener('DOMContentLoaded', () => {
  // Add focus-visible polyfill class if needed
  if (!CSS.supports('selector(:focus-visible)')) {
    document.documentElement.classList.add('js-focus-visible');
  }
  
  // Skip link focus fix for WebKit
  const skipLinks = document.querySelectorAll('a[href^="#"]');
  skipLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href') as string);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.addEventListener('blur', () => {
          target.removeAttribute('tabindex');
        }, { once: true });
      }
    });
  });
});

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  // Monitor performance in development
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'measure') {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
      }
    });
  });
  
  observer.observe({ entryTypes: ['measure'] });
}

// Constitutional compliance check on load
if (process.env.NODE_ENV === 'development') {
  import('./utils').then(({ ConstitutionalComplianceChecker }) => {
    setTimeout(async () => {
      const compliance = await ConstitutionalComplianceChecker.checkAllCompliance();
      if (!compliance.overall) {
        console.warn('Constitutional compliance violations detected:', compliance.violations);
      } else {
        console.log('✓ All constitutional requirements met');
      }
    }, 2000);
  });
}