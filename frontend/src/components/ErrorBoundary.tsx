import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-card flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-card border border-accent/30 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <ShieldAlert size={32} className="text-accent" />
            </div>
            
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-4">
              Something went wrong
            </h1>
            
            <p className="text-white/60 mb-8 leading-relaxed">
              We encountered an unexpected structural anomaly while rendering this vector. Our engineering nodes have been notified.
            </p>
            
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="w-full bg-accent text-card py-3 rounded-lg font-semibold hover:bg-white transition-colors uppercase tracking-wider text-sm mb-4"
            >
              Return to Core Hub
            </button>
            <p className="text-accent/40 text-xs">
              {this.state.error?.message || 'Unknown render parameter'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
