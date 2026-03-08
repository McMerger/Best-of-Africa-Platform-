import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
                    <div className="text-6xl">⚠️</div>
                    <h2 className="text-2xl font-serif font-bold text-foreground">
                        Something went wrong
                    </h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        An unexpected error occurred. This has been logged for review.
                    </p>
                    <Button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.href = '/';
                        }}
                        className="font-bold"
                    >
                        Return to Homepage
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
