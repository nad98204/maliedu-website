import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowRight } from 'lucide-react';
import CourseCard from './CourseCard';
import { isPublicCatalogCourse } from '../utils/courseMarketing';

const getPopularityScore = (course) => (
    Number(
        course.fakeStudentCount
        || course.studentCount
        || course.enrollmentCount
        || 0
    ) * 1000 + Number(course.views || 0)
);

const getCreatedAtValue = (course) => (
    Number(course.createdAt?.seconds || course.createdAt || course.updatedAt || 0)
);

const compareRelatedCourses = (courseA, courseB) => {
    const pinnedDifference = Number(Boolean(courseB.isPinned)) - Number(Boolean(courseA.isPinned));
    if (pinnedDifference !== 0) return pinnedDifference;

    const priorityDifference = Number(courseB.listingPriority || 0) - Number(courseA.listingPriority || 0);
    if (priorityDifference !== 0) return priorityDifference;

    const popularityDifference = getPopularityScore(courseB) - getPopularityScore(courseA);
    if (popularityDifference !== 0) return popularityDifference;

    return getCreatedAtValue(courseB) - getCreatedAtValue(courseA);
};

const shuffleCourses = (courses) => {
    const shuffledCourses = [...courses];

    for (let index = shuffledCourses.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledCourses[index], shuffledCourses[randomIndex]] = [
            shuffledCourses[randomIndex],
            shuffledCourses[index],
        ];
    }

    return shuffledCourses;
};

const RelatedCourses = ({ currentCourseId, limit = 3, variant = 'default' }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const isPlayerVariant = variant === 'player';

    useEffect(() => {
        const fetchRelatedCourses = async () => {
            try {
                const q = query(
                    collection(db, 'courses'),
                    where('isPublished', '==', true),
                );
                const querySnapshot = await getDocs(q);

                const fetchedCourses = [];
                querySnapshot.forEach((doc) => {
                    const course = { id: doc.id, ...doc.data() };
                    if (doc.id !== currentCourseId && isPublicCatalogCourse(course)) {
                        fetchedCourses.push(course);
                    }
                });
                const orderedCourses = isPlayerVariant
                    ? shuffleCourses(fetchedCourses)
                    : fetchedCourses.sort(compareRelatedCourses);

                setCourses(orderedCourses.slice(0, limit));
            } catch (error) {
                console.error("Error fetching related courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedCourses();
    }, [currentCourseId, isPlayerVariant, limit]);

    if (loading) return null;
    if (courses.length === 0) return null;

    return (
        <section className={isPlayerVariant
            ? 'mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8'
            : 'mb-8 mt-12'}
        >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    {isPlayerVariant && (
                        <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-[#9B2528]">
                            Tiếp tục khám phá
                        </p>
                    )}
                    <h3 className="font-sans text-2xl font-black text-slate-900">
                        Có thể bạn sẽ thích
                    </h3>
                    {isPlayerVariant && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Khám phá thêm những khóa học phù hợp với hành trình của bạn.
                        </p>
                    )}
                </div>

                {isPlayerVariant && (
                    <Link
                        to="/khoa-hoc"
                        className="inline-flex w-fit items-center gap-2 text-sm font-black text-[#9B2528] transition-colors hover:text-[#701B1E]"
                    >
                        Xem tất cả khóa học <ArrowRight className="h-4 w-4" />
                    </Link>
                )}
            </div>

            <div className={`grid grid-cols-1 gap-6 ${isPlayerVariant ? '2xl:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </section>
    );
};

export default RelatedCourses;
