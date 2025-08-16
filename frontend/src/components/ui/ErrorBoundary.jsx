import React from 'react';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-grass-900 via-green-900 to-emerald-900 p-4">
          <div className="max-w-md w-full">
            <div className="glass p-8 rounded-2xl border border-white/20 text-center">
              <div className="mb-6">
                <FaExclamationTriangle className="text-6xl text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h1>
                <p className="text-white/70">
                  We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={this.handleReload}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <FaRedo />
                  <span>Refresh Page</span>
                </button>

                <Link
                  to="/"
                  className="w-full glass border border-white/20 hover:border-grass-400/50 text-white px-4 py-3 rounded-xl transition-all duration-300 hover:bg-grass-500/10 flex items-center justify-center space-x-2"
                >
                  <FaHome />
                  <span>Go Home</span>
                </Link>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-white/60 hover:text-white text-sm mb-2">
                    Technical Details (Development)
                  </summary>
                  <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/20 text-sm">
                    <div className="text-red-400 font-mono mb-2">
                      {this.state.error && this.state.error.toString()}
                    </div>
                    <div className="text-white/70 font-mono text-xs whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;
