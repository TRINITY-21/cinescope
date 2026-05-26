import { Component } from 'react';
import ErrorFallbackScene from './ErrorFallbackScene';

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
      <ErrorFallbackScene
        error={this.state.error}
        onTryAgain={this.handleReset}
        onReload={this.handleReload}
      />
    );
  }
}
