import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { PlayCircle, Award, BookOpen, Clock } from "lucide-react";

import { db, auth } from "../firebase";
import { ensureUserProfile } from "../utils/userService";

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, in-progress, completed

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                ensureUserProfile({ db, user: currentUser }).catch(() => { });
                fetchMyCourses(currentUser);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchMyCourses = async (currentUser) => {
        try {
            const enrollmentMap = {};
            if (currentUser?.uid) {
                const byUidSnap = await getDocs(
                    query(collection(db, "enrollments"), where("userId", "==", currentUser.uid))
                );
                byUidSnap.docs.forEach(d => {
                    const data = d.data();
                    enrollmentMap[data.courseId] = data;
                });
            }

            if (currentUser?.email) {
                const byEmailSnap = await getDocs(
                    query(collection(db, "enrollments"), where("userEmail", "==", currentUser.email))
                );
                byEmailSnap.docs.forEach(d => {
                    const data = d.data();
                    if (!enrollmentMap[data.courseId]) {
                        enrollmentMap[data.courseId] = data;
                    }
                });
            }

            const courseIds = Object.keys(enrollmentMap);

            if (courseIds.length === 0) {
                setCourses([]);
                setLoading(false);
                return;
            }

            const coursePromises = courseIds.map(id => getDoc(doc(db, "courses", id)));
            const courseSnapshots = await Promise.all(coursePromises);

            const coursesData = courseSnapshots
                .filter(snap => snap.exists())
                .map(snap => {
                    const cData = { id: snap.id, ...snap.data() };
                    const enrollment = enrollmentMap[cData.id];

                    let completedCount = 0;
                    if (enrollment && enrollment.completedLessonIds) {
                        completedCount = enrollment.completedLessonIds.length;
                    }

                    let totalLessons = 0;
                    if (cData.curriculum) {
                        if (cData.curriculum.length > 0 && cData.curriculum[0].lessons) {
                            cData.curriculum.forEach(s => totalLessons += (s.lessons?.length || 0));
                        } else {
                            totalLessons = cData.curriculum.length;
                        }
                    }

                    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                    return {
                        ...cData,
                        progressPercent,
                        totalLessons,
                        completedCount,
                        enrollmentDate: enrollment?.createdAt?.toDate ? enrollment.createdAt.toDate() : new Date()
                    };
                });

            setCourses(coursesData);
        } catch (error) {
            console.error("Error fetching my courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredCourses = () => {
        if (activeTab === 'in-progress') {
            return courses.filter(c => c.progressPercent < 100);
        }
        if (activeTab === 'completed') {
            return courses.filter(c => c.progressPercent === 100);
        }
        return courses;
    };

    const filteredCourses = getFilteredCourses();

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-20 flex justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-secret-wax border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-4 text-center bg-slate-50">
                <h2 className="text-2xl font-bold text-slate-900">Vui lòng đăng nhập</h2>
                <p className="mt-2 text-slate-600 mb-6 font-medium">Bạn cần đăng nhập để xem các khóa học của mình.</p>
                <Link to="/admin/login" className="px-6 py-3 bg-secret-wax text-white rounded-xl font-bold hover:bg-secret-ink shadow-lg inline-flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Đăng nhập ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Khóa học của tôi</h1>
                        <p className="mt-2 text-slate-600 font-medium">Chào mừng trở lại, tiếp tục hành trình học tập nào!</p>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex overflow-x-auto whitespace-nowrap">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'all'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setActiveTab('in-progress')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'in-progress'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                        >
                            Đang học
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed'
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-green-600 hover:bg-green-50'
                                }`}
                        >
                            Đã học xong
                        </button>
                    </div>
                </div>

                {/* Course List */}
                {filteredCourses.length > 0 ? (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCourses.map((course) => (
                            <div
                                key={course.id}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                            >
                                {/* Image Area */}
                                <div className="relative aspect-video overflow-hidden bg-slate-100">
                                    <img
                                        src={course.thumbnailUrl || "https://via.placeholder.com/640x360"}
                                        alt={course.name}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3">
                                        {course.progressPercent === 100 ? (
                                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                                                <Award className="w-3.5 h-3.5" /> HOÀN THÀNH
                                            </span>
                                        ) : course.progressPercent > 0 ? (
                                            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                                                <BookOpen className="w-3.5 h-3.5" /> ĐANG HỌC
                                            </span>
                                        ) : (
                                            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                                                <PlayCircle className="w-3.5 h-3.5" /> CHƯA HỌC
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="flex flex-1 flex-col p-6">
                                    <h3 className="mb-3 text-xl font-bold text-slate-900 leading-snug line-clamp-2" title={course.name}>
                                        {course.name}
                                    </h3>

                                    <div className="mt-auto pt-4 space-y-4">
                                        {/* Progress Section */}
                                        <div>
                                            <div className="flex items-center justify-between text-sm font-medium mb-2">
                                                <span className="text-slate-600 flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {course.progressPercent === 100 ? 'Đã hoàn thành' : 'Tiến độ học tập'}
                                                </span>
                                                <span className={`font-bold ${course.progressPercent === 100 ? 'text-green-600' : 'text-slate-900'
                                                    }`}>
                                                    {course.progressPercent}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${course.progressPercent === 100 ? 'bg-green-500' : 'bg-blue-600'
                                                        }`}
                                                    style={{ width: `${course.progressPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        {course.progressPercent === 0 ? (
                                            <Link
                                                to={`/bai-giang/${course.id}`}
                                                className="block w-full text-center rounded-xl bg-orange-500 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-orange-600 hover:shadow-lg active:scale-[0.98]"
                                            >
                                                VÀO HỌC NGAY
                                            </Link>
                                        ) : course.progressPercent < 100 ? (
                                            <Link
                                                to={`/bai-giang/${course.id}`}
                                                className="block w-full text-center rounded-xl bg-blue-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
                                            >
                                                HỌC TIẾP
                                            </Link>
                                        ) : (
                                            <Link
                                                to={`/bai-giang/${course.id}`}
                                                className="block w-full text-center rounded-xl bg-slate-100 border-2 border-slate-200 px-4 py-3 text-base font-bold text-slate-600 transition-all hover:bg-white hover:border-slate-300 hover:text-slate-900 active:scale-[0.98]"
                                            >
                                                XEM LẠI
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">
                            {activeTab === 'all'
                                ? 'Bạn chưa đăng ký khóa học nào'
                                : activeTab === 'in-progress'
                                    ? 'Bạn không có khóa học nào đang học'
                                    : 'Bạn chưa hoàn thành khóa học nào'}
                        </h3>
                        {activeTab === 'all' && (
                            <div className="mt-8">
                                <Link to="/khoa-hoc" className="px-8 py-3.5 bg-secret-wax text-white rounded-xl font-bold shadow-lg hover:bg-secret-ink transition-all hover:-translate-y-1 inline-flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5" />
                                    Khám phá khóa học mới
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCourses;
