import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL RUNTIME ERROR CAUGHT BY BOUNDARY:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 font-sans relative overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-rose/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />

          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6">
            <div className="w-16 h-16 bg-brand-rose/10 border border-brand-rose/20 text-brand-rose rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Oops! Render Crash Detected</h2>
              <p className="text-xs text-brand-dim leading-relaxed">
                App component reload failed or encountered a runtime error. Don't worry, your ledger data is completely safe.
              </p>
            </div>

            {/* Error Detail Log Box */}
            <div className="p-3 bg-[#0d1321] border border-brand-border/60 rounded-xl text-[10px] text-brand-rose font-mono text-left max-h-24 overflow-y-auto">
              {this.state.error?.toString() || 'Unknown Rendering Exception'}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-2.5 bg-brand-bg hover:bg-brand-border/40 border border-brand-border rounded-xl text-xs font-bold text-white transition flex items-center justify-center space-x-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>
              
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
