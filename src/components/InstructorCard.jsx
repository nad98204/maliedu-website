import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User, PlayCircle, Users, BookOpen } from 'lucide-react';

const InstructorCard = ({ instructorId, instructorData, showLink = true }) => {
    const [stats, setStats] = useState({ courses: 0, students: 0 });
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(instructorData || null);

    useEffect(() => {
        const fetchData = async () => {
            if (!instructorId && !data?.id) return;

            const id = instructorId || data?.id;

            try {
                // Fetch stats if not provided or to ensure accuracy
                const q = query(collection(db, 'courses'), where('authorId', '==', id));
                const snapshot = await getDocs(q);

                let totalS = 0;
                snapshot.forEach(doc => {
                    const course = doc.data();
                    // Calculate based on real students array length
                    totalS += (course.students?.length || 0);
                });

                setStats({
                    courses: snapshot.size,
                    students: totalS
                });

                // If we didn't have instructor data but had ID (future case), we'd fetch it here too.
                // But for now assuming data is passed or we just calculating stats for the provided ID.
            } catch (err) {
                console.error("Error fetching instructor stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instructorId, data]);

    if (!data && !instructorId) return null;

    // Use passed data or stats
    const displayData = data || { name: 'Unknown', title: 'Instructor', avatar: '', id: instructorId };

    return (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="relative mb-4">
                <img
                    src={displayData.avatar || 'https://via.placeholder.com/150?text=Avatar'}
                    alt={displayData.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm"
                />
                {displayData.isLeader && (
                    <div className="absolute bottom-0 right-0 bg-secret-wax text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                        LEADER
                    </div>
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">{displayData.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{displayData.title || 'Giảng viên'}</p>

            <div className="flex items-center justify-center gap-4 mb-6 w-full">
                <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                        <Users className="w-4 h-4 text-secret-wax" />
                        {loading ? '...' : stats.students.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Học viên</span>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                        <BookOpen className="w-4 h-4 text-secret-wax" />
                        {loading ? '...' : stats.courses}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Khóa học</span>
                </div>
            </div>

            {showLink && (
                <Link
                    to={`/giang-vien/${displayData.id || instructorId}`}
                    className="flex items-center gap-2 text-sm font-semibold text-secret-wax hover:text-secret-ink transition-colors"
                >
                    Xem hồ sơ
                </Link>
            )}
        </div>
    );
};

export default InstructorCard;
