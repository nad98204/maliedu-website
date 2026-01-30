import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { formatPrice } from '../utils/orderService';
import { Star, Users, Clock } from 'lucide-react';
import CourseCard from './CourseCard';

const RelatedCourses = ({ currentCourseId }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedCourses = async () => {
            try {
                // Fetch recent 3 courses (excluding current one manually after fetch if needed, 
                // or just fetch 4 and slice). 
                // Since we don't have complex 'category' logic yet, just fetch latest.
                const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'), limit(4));
                const querySnapshot = await getDocs(q);

                const fetchedCourses = [];
                querySnapshot.forEach((doc) => {
                    if (doc.id !== currentCourseId) {
                        fetchedCourses.push({ id: doc.id, ...doc.data() });
                    }
                });

                setCourses(fetchedCourses.slice(0, 3));
            } catch (error) {
                console.error("Error fetching related courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedCourses();
    }, [currentCourseId]);

    if (loading) return null;
    if (courses.length === 0) return null;

    return (
        <div className="mt-12 mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 font-sans">Có thể bạn sẽ thích</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
    );
};

export default RelatedCourses;
