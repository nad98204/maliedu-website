import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const CourseFilter = ({ onFilterChange, className = "", courses = [] }) => {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedAuthors, setSelectedAuthors] = useState([]);
    const [selectedPrices, setSelectedPrices] = useState([]);

    const [categories, setCategories] = useState([]);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
                const snapshot = await getDocs(q);
                setCategories(snapshot.docs.map(doc => ({
                    id: doc.data().slug, // Use slug as ID for filtering
                    label: doc.data().name
                })));
            } catch (error) {
                console.error("Error fetching categories for filter:", error);
            }
        };
        fetchCategories();
    }, []);

    // Extract Dynamic Authors from Courses
    const authors = useMemo(() => {
        const uniqueAuthors = new Set();
        const authorOptions = [];

        courses.forEach(course => {
            const name = course.instructorName || "Mong Coaching";
            if (!uniqueAuthors.has(name)) {
                uniqueAuthors.add(name);
                authorOptions.push({
                    id: name, // Use Name as ID for simplicity
                    label: name
                });
            }
        });
        return authorOptions;
    }, [courses]);



    // Handlers
    const handleCheckboxChange = (id, list, setList, type) => {
        const newList = list.includes(id)
            ? list.filter(item => item !== id)
            : [...list, id];

        setList(newList);

        // Notify Parent
        onFilterChange({
            categories: type === 'category' ? newList : selectedCategories,
            authors: type === 'author' ? newList : selectedAuthors,
            prices: type === 'price' ? newList : selectedPrices,
        });
    };

    const handleReset = () => {
        setSelectedCategories([]);
        setSelectedAuthors([]);
        setSelectedPrices([]);
        onFilterChange({ categories: [], authors: [], prices: [] });
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-base uppercase tracking-wider">
                    <Filter className="w-4 h-4 text-secret-wax" />
                    Bộ lọc nâng cao
                </h3>
                {(selectedCategories.length > 0 || selectedAuthors.length > 0) && (
                    <button onClick={handleReset} className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 bg-rose-50 rounded-lg">
                        <X className="w-3 h-3" /> Cài lại
                    </button>
                )}
            </div>

            <div className="space-y-8">
                {/* Categories */}
                <div>
                    <h4 className="font-black text-[11px] text-slate-400 uppercase tracking-widest mb-4">Chuyên mục</h4>
                    <div className="space-y-3">
                        {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat.id)}
                                        onChange={() => handleCheckboxChange(cat.id, selectedCategories, setSelectedCategories, 'category')}
                                        className="w-5 h-5 rounded-lg border-slate-200 text-secret-wax focus:ring-secret-wax/20 transition-all cursor-pointer"
                                    />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${selectedCategories.includes(cat.id) ? 'text-secret-wax' : 'text-slate-600 group-hover:text-secret-wax'}`}>
                                    {cat.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Authors */}
                <div>
                    <h4 className="font-black text-[11px] text-slate-400 uppercase tracking-widest mb-4">Giảng viên</h4>
                    <div className="space-y-3">
                        {authors.map(author => (
                            <label key={author.id} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedAuthors.includes(author.id)}
                                    onChange={() => handleCheckboxChange(author.id, selectedAuthors, setSelectedAuthors, 'author')}
                                    className="w-5 h-5 rounded-lg border-slate-200 text-secret-wax focus:ring-secret-wax/20 transition-all cursor-pointer"
                                />
                                <span className={`text-sm font-bold transition-colors ${selectedAuthors.includes(author.id) ? 'text-secret-wax' : 'text-slate-600 group-hover:text-secret-wax'}`}>
                                    {author.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseFilter;
