import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Đã có lỗi xảy ra!</h2>
                        <p className="text-gray-600 mb-6">Trang web gặp sự cố không mong muốn. Vui lòng thử tải lại hoặc reset dữ liệu.</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
                            >
                                Tải lại trang
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                            >
                                Xóa Cache & Reset
                            </button>
                        </div>
                        {this.state.error && (
                            <div className="mt-8 p-4 bg-gray-100 rounded text-left overflow-auto max-h-40 text-xs font-mono text-red-800">
                                {this.state.error.toString()}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
