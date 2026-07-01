'use client'

import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-margin-mobile md:p-margin-desktop">
          <div className="glass-card rounded-xl p-24 max-w-md w-full text-center flex flex-col items-center gap-16 ambient-shadow">
            <span className="material-symbols-outlined text-[48px] text-error">error</span>
            <h2 className="font-headline text-headline-lg text-on-surface font-bold">Something went wrong</h2>
            {this.state.error && (
              <p className="font-body text-body-md text-on-surface-variant bg-surface-container-low p-16 rounded-lg w-full text-left overflow-auto">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="px-24 py-8 bg-primary text-on-primary rounded-full font-label text-label-caps hover:bg-primary/90 transition-colors ambient-shadow focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
