import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import CourseCard from '../components/CourseCard';
import InstructorCard from '../components/InstructorCard';
import { Star, Award, Quote } from 'lucide-react';

const InstructorProfile = () => {
    const { id } = useParams();
    const [instructor, setInstructor] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Instructor
                const instRef = doc(db, 'instructors', id);
                const instSnap = await getDoc(instRef);

                if (instSnap.exists()) {
                    setInstructor({ id: instSnap.id, ...instSnap.data() });
                }

                // Fetch Courses by this Instructor
                const q = query(
                    collection(db, 'courses'),
                    where('authorId', '==', id),
                    orderBy('createdAt', 'desc') // Ensure index exists or catch error
                );

                // Note: If compound index missing, might need to remove orderBy or create index
                // For now, let's try with basic query + client side sort if index errors, 
                // but usually single field sort with where is fine if it's the same field? 
                // Wait, where(authorId) and orderBy(createdAt) requires index.
                // I'll try without orderBy first to be safe, or handle error.
                // Actually, let's stick to simple where() for now and sort in JS.

                const coursesSnap = await getDocs(query(collection(db, 'courses'), where('authorId', '==', id)));
                const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Sort manually
                coursesData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                setCourses(coursesData);

            } catch (error) {
                console.error("Error fetching instructor profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) return <div className="min-h-screen pt-24 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-secret-wax rounded-full border-t-transparent"></div></div>;

    if (!instructor) return <div className="min-h-screen pt-24 text-center">Không tìm thấy giảng viên</div>;

    return (
        <div className="bg-slate-50 min-h-screen pb-20 pt-24">
            <div className="container mx-auto px-4">
                {/* Header Profile */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-10">
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        {/* Left: Card Stats */}
                        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                            <InstructorCard instructorData={instructor} showLink={false} />
                        </div>

                        {/* Right: Bio & Info */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{instructor.name}</h1>
                                <p className="text-lg text-secret-wax font-medium">{instructor.title}</p>
                            </div>

                            {instructor.bio && (
                                <div className="prose prose-slate max-w-none text-slate-600 bg-slate-50 p-6 rounded-xl border border-slate-100 relative">
                                    <Quote className="absolute top-4 left-4 w-6 h-6 text-slate-200 -z-0" />
                                    <p className="relative z-10 whitespace-pre-line">{instructor.bio}</p>
                                </div>
                            )}

                            {instructor.email && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="font-semibold">Liên hệ:</span>
                                    <a href={`mailto:${instructor.email}`} className="hover:text-secret-wax transition-colors">{instructor.email}</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Course List */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <Award className="w-6 h-6 text-secret-wax" />
                        <h2 className="text-2xl font-bold text-slate-900">Các khóa học của {instructor.name}</h2>
                    </div>

                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {courses.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">Giảng viên này chưa xuất bản khóa học nào trên hệ thống.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstructorProfile;
