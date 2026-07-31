import React from 'react';

const DYNAMIC_IMPORT_RETRY_KEY = "mali_dynamic_import_retry_v1";
const MAX_DYNAMIC_IMPORT_RETRIES = 2;

const isDynamicImportFetchError = (error) =>
    /dynamically imported module|importing a module script failed/i.test(
        error?.message || "",
    );

const extractSameOriginAssetUrl = (error) => {
    const candidate = error?.message?.match(/https?:\/\/[^\s)]+/)?.[0];
    if (!candidate) return null;

    try {
        const url = new URL(candidate);
        return url.origin === window.location.origin ? url.toString() : null;
    } catch {
        return null;
    }
};

const readRetryCount = () => {
    try {
        return Number.parseInt(
            sessionStorage.getItem(DYNAMIC_IMPORT_RETRY_KEY) || "0",
            10,
        ) || 0;
    } catch {
        return 0;
    }
};

const saveRetryCount = (count) => {
    try {
        sessionStorage.setItem(DYNAMIC_IMPORT_RETRY_KEY, String(count));
    } catch {
        // Recovery can continue without browser storage.
    }
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            recoveryExhausted: false,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        if (isDynamicImportFetchError(error)) this.recoverDynamicImport(error);
    }

    recoverDynamicImport = async (error) => {
        const retryCount = readRetryCount();
        if (retryCount >= MAX_DYNAMIC_IMPORT_RETRIES) {
            this.setState({ recoveryExhausted: true });
            return;
        }

        const nextRetryCount = retryCount + 1;
        saveRetryCount(nextRetryCount);

        const assetUrl = extractSameOriginAssetUrl(error);
        if (assetUrl) {
            try {
                await fetch(assetUrl, {
                    cache: "reload",
                    credentials: "same-origin",
                });
            } catch {
                // Reload below retries the application even if prefetch fails.
            }
        }

        const url = new URL(window.location.href);
        url.searchParams.set("_asset_retry", String(nextRetryCount));
        window.location.replace(url.toString());
    };

    render() {
        if (
            isDynamicImportFetchError(this.state.error) &&
            !this.state.recoveryExhausted
        ) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Đang cập nhật phiên bản mới nhất...</p>
                </div>
            );
        }

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
                                onClick={() => { window.location.href = "/"; }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                            >
                                Về trang chủ
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
