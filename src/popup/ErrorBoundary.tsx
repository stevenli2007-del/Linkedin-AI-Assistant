import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    console.error(
      "[LinkedIn AI Assistant] Unhandled error in popup:",
      error,
      errorInfo
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-[360px] min-h-[400px] bg-white p-5 font-sans flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-xs text-gray-500 mb-4 max-w-[280px]">
            {this.state.errorMessage ||
              "An unexpected error occurred. Please reload the extension."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-medium text-white bg-brand-600 rounded-apple hover:bg-brand-700 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
