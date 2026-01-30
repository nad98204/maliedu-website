import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const CourseFilter = ({ onSearchChange, onFilterChange, className = "", courses = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
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

    // Mock Prices (Static is fine)
    const prices = [
        { id: 'free', label: 'Miễn phí' },
        { id: 'paid', label: 'Trả phí' },
    ];

    // Handlers
    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        onSearchChange(val);
    };

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
        setSearchTerm('');
        setSelectedCategories([]);
        setSelectedAuthors([]);
        setSelectedPrices([]);
        onSearchChange('');
        onFilterChange({ categories: [], authors: [], prices: [] });
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    Tìm kiếm
                </h3>
                {(searchTerm || selectedCategories.length > 0 || selectedAuthors.length > 0 || selectedPrices.length > 0) && (
                    <button onClick={handleReset} className="text-xs text-slate-400 hover:text-secret-wax flex items-center gap-1 transition-colors">
                        <X className="w-3 h-3" /> Cài lại
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Tìm kiếm khóa học..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-secret-wax focus:ring-1 focus:ring-secret-wax/20 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="space-y-6">
                {/* Categories */}
                <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-3">Những Chuyên mục</h4>
                    <div className="space-y-2">
                        {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(cat.id)}
                                    onChange={() => handleCheckboxChange(cat.id, selectedCategories, setSelectedCategories, 'category')}
                                    className="w-4 h-4 rounded border-slate-300 text-secret-wax focus:ring-secret-wax"
                                />
                                <span className="text-sm text-slate-600 group-hover:text-secret-wax transition-colors">{cat.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Authors */}
                <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-3">Tác giả</h4>
                    <div className="space-y-2">
                        {authors.map(author => (
                            <label key={author.id} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedAuthors.includes(author.id)}
                                    onChange={() => handleCheckboxChange(author.id, selectedAuthors, setSelectedAuthors, 'author')}
                                    className="w-4 h-4 rounded border-slate-300 text-secret-wax focus:ring-secret-wax"
                                />
                                <span className="text-sm text-slate-600 group-hover:text-secret-wax transition-colors">{author.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Price */}
                <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-3">Giá</h4>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedPrices.includes('free')}
                                onChange={() => handleCheckboxChange('free', selectedPrices, setSelectedPrices, 'price')}
                                className="w-4 h-4 rounded border-slate-300 text-secret-wax focus:ring-secret-wax"
                            />
                            <span className="text-sm text-slate-600 group-hover:text-secret-wax transition-colors">Miễn phí</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedPrices.includes('paid')}
                                onChange={() => handleCheckboxChange('paid', selectedPrices, setSelectedPrices, 'price')}
                                className="w-4 h-4 rounded border-slate-300 text-secret-wax focus:ring-secret-wax"
                            />
                            <span className="text-sm text-slate-600 group-hover:text-secret-wax transition-colors">Đã thanh toán</span>
                        </label>
                    </div>
                </div>

                {/* Activate Button */}
                <div className="pt-2">
                    <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} // Simple action for now
                    >
                        Kích hoạt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseFilter;
