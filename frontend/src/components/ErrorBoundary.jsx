import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Production telemetry logging
    console.error('[ErrorBoundary caught UI glitch]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070913] text-slate-100 flex items-center justify-center p-6 selection:bg-rose-500/30">
          <div className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-rose-500/20 bg-slate-950/80 shadow-2xl shadow-rose-950/30 text-center relative overflow-hidden">
            {/* Glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mt-16"></div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600/30 to-amber-500/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-950/40">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>

            <span className="inline-block py-1 px-3 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono mb-3">
              Zero-Crash UI Protection Active
            </span>

            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              Temporary Glitch Intercepted
            </h2>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Our high-stability error boundary isolated an unexpected rendering state and kept the rest of your session secure.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 text-left p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-rose-300 max-h-32 overflow-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload View
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
