import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-red-200 dark:border-red-900">
                        <h2 className="text-xl font-bold text-red-600 mb-2">Une erreur est survenue</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Impossible d'afficher cette page.</p>
                        <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs font-mono mb-4 text-red-500 overflow-auto">
                            {this.state.error?.toString()}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                        >
                            Recharger la page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
