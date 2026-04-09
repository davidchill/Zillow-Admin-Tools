// ── ErrorBoundary — catches React render errors and shows a fallback ──

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, fontFamily: 'sans-serif', color: '#333' }}>
          <strong>Something went wrong.</strong>
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
            {this.state.error.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
