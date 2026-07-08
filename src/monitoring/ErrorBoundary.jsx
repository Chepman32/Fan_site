import { Component } from 'react'
import { logCriticalClientError } from './errorLogger'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    logCriticalClientError(error, {
      source: 'react-error-boundary',
      componentStack: errorInfo?.componentStack || '',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="route-loading" role="alert">
          Something went wrong. Refresh the page to continue.
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
