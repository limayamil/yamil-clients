'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error monitoring service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Algo salió mal
          </h2>

          <p className="mb-6 max-w-md text-gray-600">
            Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
          </p>

          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
            <Button onClick={this.handleGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </div>

          {this.props.showDetails && this.state.error && process.env.NODE_ENV === 'development' && (
            <details className="mt-8 w-full max-w-2xl">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Detalles del error (solo en desarrollo)
              </summary>
              <div className="mt-4 rounded-lg bg-gray-100 p-4 text-left">
                <h4 className="font-medium text-red-600">Error:</h4>
                <pre className="mt-2 overflow-x-auto text-xs text-gray-800">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <>
                    <h4 className="mt-4 font-medium text-red-600">Stack trace:</h4>
                    <pre className="mt-2 overflow-x-auto text-xs text-gray-800">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Simplified error boundary for specific components
interface SimpleErrorBoundaryProps {
  children: ReactNode;
  message?: string;
}

export function SimpleErrorBoundary({ children, message = "Error al cargar este componente" }: SimpleErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-4 text-center">
          <div className="text-gray-500">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
            <p className="text-sm">{message}</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for manually triggering error boundaries in functional components
export function useErrorHandler() {
  const [, setState] = React.useState();

  return React.useCallback((error: Error) => {
    setState(() => {
      throw error;
    });
  }, []);
}