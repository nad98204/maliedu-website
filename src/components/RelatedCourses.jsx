import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
                const q = query(
                    collection(db, 'courses'), 
                    where('isPublished', '==', true),
                    where('isForSale', '==', true)
                );
                const querySnapshot = await getDocs(q);

                let fetchedCourses = [];
                querySnapshot.forEach((doc) => {
                    if (doc.id !== currentCourseId) {
                        fetchedCourses.push({ id: doc.id, ...doc.data() });
                    }
                });

                // Batch-fetch enrollment counts
                if (fetchedCourses.length > 0) {
                    const enrollSnap = await getDocs(collection(db, 'enrollments'));
                    const counts = {};
                    enrollSnap.forEach(d => {
                        const cId = d.data().courseId;
                        if (cId) counts[cId] = (counts[cId] || 0) + 1;
                    });
                    fetchedCourses = fetchedCourses.map(c => ({ ...c, enrollmentCount: counts[c.id] || c.enrollmentCount || 0 }));
                }

                // Sort by createdAt desc in memory
                fetchedCourses.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

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
