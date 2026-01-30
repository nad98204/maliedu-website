import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, query, collection, where, getDocs, addDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { ArrowRight, Globe, Star, Users, Check, Home, ChevronRight, PlayCircle, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from '../firebase';
import SEO from '../components/SEO';
import CourseSidebar from '../components/CourseSidebar';
import Breadcrumb from '../components/Breadcrumb';
import CourseCurriculum from '../components/CourseCurriculum';
import RelatedCourses from '../components/RelatedCourses';
import CourseReviews from '../components/CourseReviews';
import AuthModal from '../components/AuthModal';

const CourseDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('intro');
    const [isDescExpanded, setIsDescExpanded] = useState(false);
    const [instructorStats, setInstructorStats] = useState({ courses: 0, students: 0 });

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['intro', 'curriculum', 'instructor', 'reviews'];
            const scrollPosition = window.scrollY + 200; // Offset for sticky header

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const offsetTop = element.offsetTop;
                    const offsetHeight = element.offsetHeight;

                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 100; // Adjust for sticky header height
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const enrollUser = async (courseData) => {
        if (!currentUser) return;
        try {
            // Check if already enrolled
            const q = query(
                collection(db, 'enrollments'),
                where('userId', '==', currentUser.uid),
                where('courseId', '==', courseData.id)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                await addDoc(collection(db, 'enrollments'), {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    courseId: courseData.id,
                    courseName: courseData.name,
                    enrolledAt: Date.now(),
                    status: 'active',
                    progress: 0
                });
            }

            // ALWAYS Sync Student Count to Course Document (Idempotent)
            // Even if already enrolled, ensure ID is in the list
            const courseRef = doc(db, 'courses', courseData.id);
            await updateDoc(courseRef, {
                students: arrayUnion(currentUser.uid)
            }).catch(err => console.error("Error syncing student count:", err));
        } catch (error) {
            console.error("Enrollment error:", error);
        }
    };

    const handleBuyClick = async () => {
        if (currentUser) {
            if (course.isForSale === false) {
                // Free course - Auto Enroll
                await enrollUser(course);
                navigate(`/bai-giang/${course.id}`);
            } else {
                navigate(`/thanh-toan/${course.id}`);
            }
        } else {
            setIsAuthModalOpen(true);
        }
    };

    const handlePreviewClick = async () => {
        if (currentUser) {
            // Auto Enroll on Preview too (as requested: "registered for free viewing")
            await enrollUser(course);
            navigate(`/bai-giang/${course.id}`);
        } else {
            // Even for preview, maybe require login? Or just let them go? 
            // User request implies "registered", so likely Login -> Enroll -> View.
            // But usually Preview is public.
            // Requirement: "anyone who has... registered for free viewing... put into my courses".
            // This implies we capture them WHEN they are logged in.
            // If they are NOT logged in, we can't put it in "My Courses".
            // So for now, we only enroll if logged in.
            navigate(`/bai-giang/${course.id}`);
        }
    };

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                // Try fetching by ID first
                let docRef = doc(db, 'courses', slug);
                let docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setCourse({ id: docSnap.id, ...docSnap.data() });

                    // Increment Views (Once per session)
                    const viewKey = `mali_view_${docSnap.id}`;
                    if (!sessionStorage.getItem(viewKey)) {
                        updateDoc(docRef, { views: increment(1) }).catch(err => console.error("Error incr views:", err));
                        sessionStorage.setItem(viewKey, 'true');
                    }
                } else {
                    // Fallback: Query by "slug" field
                    const q = query(collection(db, 'courses'), where('slug', '==', slug));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const courseData = querySnapshot.docs[0].data();
                        const courseId = querySnapshot.docs[0].id;
                        setCourse({ id: courseId, ...courseData });

                        // Increment Views (Once per session)
                        const viewKey = `mali_view_${courseId}`;
                        if (!sessionStorage.getItem(viewKey)) {
                            const ref = doc(db, 'courses', courseId);
                            updateDoc(ref, { views: increment(1) }).catch(err => console.error("Error incr views:", err));
                            sessionStorage.setItem(viewKey, 'true');
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching course:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchCourse();
        window.scrollTo(0, 0);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, [slug]);

    useEffect(() => {
        const fetchInstructorStats = async () => {
            if (!course?.authorId) return;

            try {
                const q = query(collection(db, 'courses'), where('authorId', '==', course.authorId));
                const snapshot = await getDocs(q);
                let totalC = 0;
                let totalS = 0;

                snapshot.forEach(doc => {
                    const data = doc.data();
                    totalC++;
                    // Use REAL student count
                    const sCount = data.students?.length || 0;
                    totalS += sCount;
                });

                setInstructorStats({ courses: totalC, students: totalS });
            } catch (err) {
                console.error("Stats error", err);
            }
        };

        if (course) {
            fetchInstructorStats();
        }
    }, [course]);

    if (loading) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-secret-wax/30 border-t-secret-wax rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">Không tìm thấy khóa học</h2>
                <Link to="/khoa-hoc" className="text-secret-wax hover:underline">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <div className="font-sans bg-slate-50 min-h-screen pb-20">
            <SEO
                title={course.name}
                description={course.description}
                image={course.thumbnailUrl}
                url={`/khoa-hoc/${course.id}`}
                type="product"
            />

            {/* HERO SECTION (Blurred Thumbnail + Dark Red Overlay) */}
            <div className="relative overflow-hidden bg-[#450a0a] pt-14 pb-16 border-b border-gray-100">
                {/* Layer 1: Blurred Thumbnail Background */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center scale-110 blur-lg opacity-40"
                    style={{ backgroundImage: `url(${course.thumbnailUrl || "https://via.placeholder.com/1920x600"})` }}
                ></div>

                {/* Layer 2: Dark Red Overlay (Gradient for refinement) */}
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#450a0a]/90 via-[#450a0a]/70 to-[#450a0a]/30"></div>

                {/* Layer 3: Content */}
                <div className="max-w-7xl mx-auto px-4 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                        <div className="lg:col-span-2">
                            {/* Breadcrumb */}
                            <Breadcrumb
                                items={[
                                    { label: 'Khóa học', link: '/khoa-hoc' },
                                    { label: course.name }
                                ]}
                                className="text-white/80 mb-14"
                            />

                            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-relaxed py-3 font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200">
                                {course.name}
                            </h1>

                            <p
                                className="text-sm font-light text-white/90 mb-6 leading-relaxed max-w-2xl break-words"
                                dangerouslySetInnerHTML={{ __html: course?.description ? course.description.replace(/&nbsp;/g, ' ') : '' }}
                            ></p>

                            <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <span className="flex text-yellow-400"><Star className="w-5 h-5 fill-current" /></span>
                                    <span className="text-white font-bold">{course.fakeRating || "5.0"}</span>
                                    <span className="text-red-100">({course.fakeReviewCount || "120+"} đánh giá)</span>
                                </div>
                                <div className="flex items-center gap-2 text-red-100">
                                    <Users className="w-5 h-5 text-red-100" />
                                    <span>{course.fakeStudentCount || "2,500+"} học viên</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/10 text-white px-3 py-1 rounded-full shadow-sm text-sm font-semibold flex items-center gap-2 border border-white/20">
                                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                                        Mali Edu
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-red-200 text-xs">
                                    <span>Cập nhật mới nhất: {new Date().toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN (CONTENT) */}
                <div className="lg:col-span-2 space-y-12">

                    {/* Sticky In-Page Navigation */}
                    <div className="sticky-nav z-40 sticky top-0 flex items-center gap-6 md:gap-8 overflow-x-auto whitespace-nowrap px-4 py-3 -mx-4 md:mx-0 md:px-6 md:rounded-lg md:border md:border-slate-100 bg-white/95 backdrop-blur-md mb-8 shadow-sm transition-all duration-300">
                        {['intro', 'curriculum', 'instructor', 'reviews'].map((section) => (
                            <a
                                key={section}
                                href={`#${section}`}
                                onClick={(e) => scrollToSection(e, section)}
                                className={`text-sm font-medium transition-all duration-300 pb-2 border-b-2 ${activeSection === section
                                    ? 'text-slate-900 border-secret-wax font-bold'
                                    : 'text-slate-500 border-transparent hover:text-secret-wax'
                                    }`}
                            >
                                {section === 'intro' && 'Giới thiệu'}
                                {section === 'curriculum' && 'Nội dung khóa học'}
                                {section === 'instructor' && 'Giảng viên'}
                                {section === 'reviews' && 'Đánh giá'}
                            </a>
                        ))}
                    </div>

                    {/* INTRO SECTION */}
                    <div id="intro" className="scroll-mt-24 space-y-8">
                        {/* What You'll Learn Box */}
                        <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Bạn sẽ học được gì?</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 ? (
                                    course.whatYouWillLearn.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5">
                                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-slate-700 text-sm">{item}</span>
                                        </div>
                                    ))
                                ) : (
                                    [
                                        "Nắm vững tư duy gốc rễ để thay đổi vận mệnh",
                                        "Thực hành các bài tập chữa lành chuyên sâu",
                                        "Khai phá sức mạnh tiềm thức bên trong bạn",
                                        "Kết nối năng lượng thịnh vượng và hạnh phúc",
                                        "Tham gia cộng đồng học tập tích cực",
                                        "Được hỗ trợ giải đáp thắc mắc trọn đời"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5">
                                            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-slate-700 text-sm">{item}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose prose-slate max-w-none relative">
                            <h3 className="text-2xl font-bold font-sans text-slate-900 mb-4">Giới thiệu khóa học</h3>
                            <div
                                className={`text-slate-600 leading-relaxed text-sm break-words [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 overflow-hidden transition-all duration-500 ease-in-out ${isDescExpanded ? 'max-h-full' : 'max-h-60'}`}
                                dangerouslySetInnerHTML={{ __html: course?.content ? course.content.replace(/&nbsp;/g, ' ') : (course?.description ? course.description.replace(/&nbsp;/g, ' ') : '') }}
                            />

                            {!isDescExpanded && (
                                <div className="absolute bottom-8 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none"></div>
                            )}

                            <div className="mt-4 flex justify-center relative z-10">
                                <button
                                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                                    className="flex items-center gap-1 text-secret-wax font-bold text-sm hover:text-secret-ink transition-colors bg-white px-4 py-2 rounded-full border border-secret-wax/20 shadow-sm"
                                >
                                    {isDescExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                                    {isDescExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CURRICULUM SECTION */}
                    <div id="curriculum" className="scroll-mt-24">
                        <CourseCurriculum
                            curriculum={course.curriculum}
                            isFreeCourse={course.isForSale === false}
                            courseId={course.id}
                            onPreviewClick={handlePreviewClick}
                        />
                    </div>

                    {/* INSTRUCTOR SECTION */}
                    <div id="instructor" className="scroll-mt-24">
                        <h3 className="text-2xl font-bold font-sans text-slate-900 mb-6">Giảng viên</h3>
                        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Link to={`/giang-vien/${course.authorId || ''}`} className="shrink-0">
                                <img
                                    src={course.instructorImageUrl || "https://res.cloudinary.com/dstukyjzd/image/upload/v1736737568/z6127415478441_3dd15f40940dc417387405e608a28796_c459o5.jpg"}
                                    alt={course.instructorName}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md hover:border-secret-wax transition-colors"
                                />
                            </Link>
                            <div className="text-center md:text-left">
                                <Link to={`/giang-vien/${course.authorId || ''}`} className="hover:text-secret-wax transition-colors">
                                    <h4 className="text-xl font-bold text-slate-900">{course.instructorName || "Mong Coaching"}</h4>
                                </Link>
                                <p className="text-secret-wax font-medium text-sm mb-3">{course.instructorTitle || "Life Coach & Spiritual Mentor"}</p>
                                <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-slate-600 mb-4">
                                    <span className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 bg-slate-50">
                                        <Users className="w-4 h-4 text-slate-500" />
                                        {instructorStats.students.toLocaleString('vi-VN')}+ Học viên
                                    </span>
                                    <span className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-1.5 bg-slate-50">
                                        <PlayCircle className="w-4 h-4 text-slate-500" />
                                        {instructorStats.courses} Khóa học
                                    </span>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                    {course.instructorBio || "Với kinh nghiệm đồng hành cùng hàng ngàn học viên, Mong Coaching sẽ giúp bạn tìm lại chính mình, chữa lành những tổn thương và kiến tạo một cuộc đời thịnh vượng, hạnh phúc từ gốc rễ."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* REVIEWS SECTION */}
                    <div id="reviews" className="scroll-mt-24">
                        <h3 className="text-2xl font-bold font-sans text-slate-900 mb-6">Đánh giá từ học viên</h3>
                        <CourseReviews courseId={course.id} currentUser={currentUser} />
                    </div>

                    {/* RELATED COURSES */}
                    <RelatedCourses currentCourseId={course.id} />
                </div>

                {/* RIGHT COLUMN (SIDEBAR) */}
                <div className="lg:col-span-1 relative z-20 lg:sticky lg:top-8 h-fit lg:-mt-20">
                    <CourseSidebar course={course} onBuyClick={handleBuyClick} />
                </div>
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

export default CourseDetail;
