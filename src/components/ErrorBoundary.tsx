"use client";

import React from "react";
import { logClientError } from "@/lib/errorLogger";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the error but don't block rendering
    void logClientError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4">Something went wrong.</div>;
    }

    return this.props.children;
  }
}
