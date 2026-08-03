import { Component } from 'react'
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react'
import { Button } from '@/components/ui'

export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info) }
  handleReset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-danger/5 via-transparent to-danger/3 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-danger/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="relative mb-6 inline-flex">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-danger/15 to-danger/5 ring-1 ring-inset ring-white/5 animate-[shake_0.5s_ease-in-out]">
                <AlertTriangle className="h-10 w-10 text-danger" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-bg-card">
                <Zap className="h-3 w-3 text-amber-400" />
              </div>
            </div>

            <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-text-secondary mb-8 max-w-md leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred. Our team has been notified.'}
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button variant="primary" onClick={this.handleReset} className="rounded-xl px-6">
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
            </div>

            <p className="mt-6 text-[11px] text-text-tertiary">
              If this keeps happening, please contact support
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
