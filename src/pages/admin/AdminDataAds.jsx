import React, { useEffect, useState, useCallback } from 'react';
import {
    collection,
    getDocs,
    query,
    orderBy,
} from 'firebase/firestore';
import { Megaphone, Search } from 'lucide-react';
import { db } from '../../firebase';

const AdminDataAds = () => {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(leadsQuery);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeads(list);
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredLeads = leads.filter(l => {
        const matchesSearch = (l.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (l.phone?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* HEADER */}
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
                    {/* Search Bar & Filters */}
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
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="new">Mới (New)</option>
                            </select>
                        </div>
                        <div className="flex flex-row items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
                            <div className="text-sm border border-secret-wax/20 bg-secret-wax/5 text-secret-wax px-4 py-2.5 rounded-xl font-bold shrink-0 text-center flex-1 sm:flex-none">
                                Tổng: {filteredLeads.length} leads
                            </div>
                        </div>
                    </div>

                    <div className="">
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
                                        {filteredLeads.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 italic">
                                                    Không tìm thấy lead nào khớp với tiêu chí tìm kiếm.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLeads.map((l) => (
                                                <tr key={l.id} className="hover:bg-slate-50 transition-all border-b border-slate-200 bg-white">
                                                    <td className="px-4 py-3 font-bold text-[14px] text-slate-800 align-middle">
                                                        {l.name}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-[13px] text-slate-700 align-middle">
                                                        {l.phone}
                                                    </td>
                                                    <td className="px-4 py-3 align-middle border-x border-slate-100">
                                                        <span className="inline-flex items-center gap-1 text-[11px] leading-tight font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1.5 rounded-lg max-w-full">
                                                            {l.source}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center align-middle text-slate-500 text-[12px] font-mono whitespace-nowrap">
                                                        {l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : '---'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center align-middle">
                                                        <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full whitespace-nowrap ${
                                                            l.status === 'new' 
                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                        }`}>
                                                            {l.status === 'new' ? 'New' : l.status}
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
                </div>
            </div>
        </div>
    );
};

export default AdminDataAds;
