'use client'

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { Button } from '@/components/ui/button'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">
            The app ran into an unexpected error.
          </p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      )
    }

    return this.props.children
  }
}
