import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    collection,
    getCountFromServer,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
} from 'firebase/firestore';
import { Calendar, ChevronLeft, ChevronRight, Megaphone, Search, X } from 'lucide-react';
import { db } from '../../firebase';
import { normalizeLeadSearchTerm } from '../../utils/leadSearch';

const PAGE_SIZE = 10;

const getStartOfDate = (dateValue) => {
    const date = new Date(`${dateValue}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const getStartOfNextDate = (dateValue) => {
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + 1);
    return date.getTime();
};

const buildDateRange = ({ dateFrom, dateTo }) => {
    if (!dateFrom && !dateTo) return {};

    if (dateFrom && !dateTo) {
        return {
            startAt: getStartOfDate(dateFrom),
            endBefore: getStartOfNextDate(dateFrom),
        };
    }

    if (!dateFrom && dateTo) {
        return {
            endBefore: getStartOfNextDate(dateTo),
        };
    }

    const fromStart = getStartOfDate(dateFrom);
    const toStart = getStartOfDate(dateTo);

    if (fromStart != null && toStart != null && fromStart > toStart) {
        return {
            startAt: toStart,
            endBefore: getStartOfNextDate(dateFrom),
        };
    }

    return {
        startAt: fromStart,
        endBefore: getStartOfNextDate(dateTo),
    };
};

const buildLeadQueryConstraints = ({ statusFilter, searchTerm, dateFrom, dateTo }) => {
    const constraints = [];
    const normalizedSearchTerm = normalizeLeadSearchTerm(searchTerm);
    const { startAt, endBefore } = buildDateRange({ dateFrom, dateTo });

    if (statusFilter !== 'all') {
        constraints.push(where('status', '==', statusFilter));
    }

    if (normalizedSearchTerm) {
        constraints.push(where('searchKeywords', 'array-contains', normalizedSearchTerm));
    }

    if (startAt != null) {
        constraints.push(where('createdAt', '>=', startAt));
    }

    if (endBefore != null) {
        constraints.push(where('createdAt', '<', endBefore));
    }

    return constraints;
};

const AdminDataAds = () => {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageStartCursors, setPageStartCursors] = useState([null]);
    const [nextPageCursor, setNextPageCursor] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const requestIdRef = useRef(0);

    const fetchPage = useCallback(async (pageIndex = 0, cursor = null) => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        setIsLoading(true);
        setErrorMessage('');

        try {
            const filterConstraints = buildLeadQueryConstraints({
                statusFilter,
                searchTerm: debouncedSearchTerm,
                dateFrom,
                dateTo,
            });
            const countQuery = query(collection(db, 'leads'), ...filterConstraints);
            const pageQuery = query(
                collection(db, 'leads'),
                ...filterConstraints,
                orderBy('createdAt', 'desc'),
                ...(cursor ? [startAfter(cursor)] : []),
                limit(PAGE_SIZE)
            );

            const [snap, countSnap] = await Promise.all([
                getDocs(pageQuery),
                getCountFromServer(countQuery),
            ]);

            if (requestIdRef.current !== requestId) return;

            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastVisible = snap.docs[snap.docs.length - 1] || null;

            setLeads(list);
            setTotalCount(countSnap.data().count);
            setCurrentPage(pageIndex);
            setNextPageCursor(lastVisible);
            setPageStartCursors((prev) => {
                const next = pageIndex === 0 ? [null] : prev.slice(0, pageIndex + 1);
                if (lastVisible && list.length === PAGE_SIZE) {
                    next[pageIndex + 1] = lastVisible;
                }
                return next;
            });
        } catch (error) {
            console.error('Error fetching leads:', error);
            if (requestIdRef.current === requestId) {
                setLeads([]);
                setNextPageCursor(null);
                setTotalCount(0);
                setErrorMessage('Không thể tải dữ liệu lead. Vui lòng kiểm tra Firestore index/quyền truy cập.');
            }
        } finally {
            if (requestIdRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, [dateFrom, dateTo, debouncedSearchTerm, statusFilter]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchPage(0, null);
    }, [fetchPage]);

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };

    const handleClearDateFilter = () => {
        setDateFrom('');
        setDateTo('');
    };

    const handlePreviousPage = () => {
        if (currentPage === 0 || isLoading) return;
        const targetPage = currentPage - 1;
        fetchPage(targetPage, pageStartCursors[targetPage] || null);
    };

    const handleNextPage = () => {
        if (!nextPageCursor || isLoading || (currentPage + 1) * PAGE_SIZE >= totalCount) return;
        fetchPage(currentPage + 1, nextPageCursor);
    };

    const startIndex = totalCount === 0 ? 0 : currentPage * PAGE_SIZE + 1;
    const endIndex = Math.min(currentPage * PAGE_SIZE + leads.length, totalCount);
    const hasNextPage = (currentPage + 1) * PAGE_SIZE < totalCount;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-full xl:w-auto text-center xl:text-left flex flex-col items-center xl:items-start">
                        <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 md:gap-3 uppercase">
                            <Megaphone className="w-6 h-6 md:w-8 md:h-8 text-secret-wax" />
                            Quản lý Data Ads
                        </h1>
                        <p className="text-slate-500 mt-1 md:mt-2 text-[10px] sm:text-[11px] md:text-[13px] font-medium whitespace-nowrap tracking-tight">Danh sách đăng ký khóa học Phễu.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên, SĐT..."
                                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax bg-white text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax font-bold text-slate-600 w-full sm:w-auto"
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="new">Mới (New)</option>
                            </select>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-40">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        aria-label="Từ ngày"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax bg-white text-sm font-semibold text-slate-600"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="relative w-full sm:w-40">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        aria-label="Đến ngày"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax bg-white text-sm font-semibold text-slate-600"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                                {(dateFrom || dateTo) && (
                                    <button
                                        type="button"
                                        onClick={handleClearDateFilter}
                                        className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-secret-wax hover:text-secret-wax"
                                    >
                                        <X className="h-4 w-4" />
                                        Xóa
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
                            <div className="text-sm border border-secret-wax/20 bg-secret-wax/5 text-secret-wax px-4 py-2.5 rounded-xl font-bold shrink-0 text-center flex-1 sm:flex-none">
                                Tổng: {totalCount} leads
                            </div>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {errorMessage}
                        </div>
                    )}

                    <div>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <div className="w-12 h-12 border-4 border-secret-wax border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-500 text-sm animate-pulse font-black tracking-widest uppercase opacity-60">Đang tải dữ liệu...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] text-left table-fixed border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                                            <th className="px-4 py-3 font-black w-[250px]">Tên Lead</th>
                                            <th className="px-4 py-3 font-black w-[200px]">Số điện thoại</th>
                                            <th className="px-4 py-3 font-black border-x border-slate-100 bg-slate-100/20">Nguồn</th>
                                            <th className="px-4 py-3 font-black text-center w-[200px]">Ngày đăng ký</th>
                                            <th className="px-4 py-3 font-black text-center w-[150px]">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {leads.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 italic">
                                                    Không tìm thấy lead nào khớp với tiêu chí tìm kiếm.
                                                </td>
                                            </tr>
                                        ) : (
                                            leads.map((lead) => (
                                                <tr key={lead.id} className="hover:bg-slate-50 transition-all border-b border-slate-200 bg-white">
                                                    <td className="px-4 py-3 font-bold text-[14px] text-slate-800 align-middle">
                                                        {lead.name}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-[13px] text-slate-700 align-middle">
                                                        {lead.phone}
                                                    </td>
                                                    <td className="px-4 py-3 align-middle border-x border-slate-100">
                                                        <span className="inline-flex items-center gap-1 text-[11px] leading-tight font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1.5 rounded-lg max-w-full">
                                                            {lead.source}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center align-middle text-slate-500 text-[12px] font-mono whitespace-nowrap">
                                                        {lead.createdAt ? new Date(lead.createdAt).toLocaleString('vi-VN') : '---'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center align-middle">
                                                        <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full whitespace-nowrap ${
                                                            lead.status === 'new'
                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                        }`}>
                                                            {lead.status === 'new' ? 'New' : lead.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
                        <div className="font-semibold">
                            Hiển thị {startIndex}-{endIndex} / {totalCount} leads
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePreviousPage}
                                disabled={isLoading || currentPage === 0}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-700 transition hover:border-secret-wax hover:text-secret-wax disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Trước
                            </button>
                            <span className="min-w-20 text-center font-black text-slate-700">
                                Trang {currentPage + 1}
                            </span>
                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={isLoading || !hasNextPage || !nextPageCursor}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-700 transition hover:border-secret-wax hover:text-secret-wax disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Sau
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDataAds;
