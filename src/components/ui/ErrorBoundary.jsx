import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof window !== 'undefined' && window.console) {
      console.error('App error boundary caught:', error, info?.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-elevated p-8 shadow-elevation-3 text-center">
          <div className="text-4xl mb-3">😵</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Something broke</h1>
          <p className="text-sm text-text-secondary mb-6">
            The app hit an unexpected error. You can try again or reload the page.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-text-primary hover:bg-white/10 transition-colors"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-accent-peach text-white text-sm font-medium hover:bg-accent-peach/90 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
