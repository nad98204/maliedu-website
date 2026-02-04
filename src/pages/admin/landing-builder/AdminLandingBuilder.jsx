import React, { useState } from "react";
import { Sparkles, Layout, FolderOpen, Info, Plus, FolderPlus, ChevronRight } from "lucide-react";
import TemplateCard from "./components/TemplateCard";
import CreateTemplateModal from "./components/CreateTemplateModal";
import CreateFolderModal from "./components/CreateFolderModal";
import FolderSidebar from "./components/FolderSidebar";
import * as LandingTemplates from "../../../landing-templates";
import exampleConfig from "../../../landing-templates/example-template/config.json";
import thienGiaoThuaConfig from "../../../landing-templates/thien-giao-thua/config.json";

/**
 * Admin Landing Builder
 * Quản lý và tạo các landing page templates
 */
const AdminLandingBuilder = () => {
    // Load templates trực tiếp khi khởi tạo state
    const [templates, setTemplates] = useState(() => {
        return [
            {
                id: 'example-template',
                component: LandingTemplates.ExampleTemplate,
                config: {...exampleConfig, folderId: null} // Thêm folderId
            },
            {
                id: 'thien-giao-thua',
                component: LandingTemplates.ThienGiaoThua,
                config: {...thienGiaoThuaConfig, folderId: null}
            }
        ];
    });
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    
    // Folder management với localStorage persistence
    const [folders, setFolders] = useState(() => {
        const saved = localStorage.getItem('landing-folders');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedFolderId, setSelectedFolderId] = useState(null);

    // Auto-save folders to localStorage khi thay đổi
    React.useEffect(() => {
        localStorage.setItem('landing-folders', JSON.stringify(folders));
    }, [folders]);

    // Auto-save templates to localStorage khi thay đổi
    React.useEffect(() => {
        localStorage.setItem('landing-templates', JSON.stringify(templates));
    }, [templates]);

    const handlePreview = (template, config) => {
        // Mở landing page trong tab mới
        const landingUrl = config.slug || `/landing/${config.id}`;
        window.open(landingUrl, '_blank');
    };

    const handleCreate = (template, config) => {
        // Mở landing page trong tab mới (same as preview for now)
        const landingUrl = config.slug || `/landing/${config.id}`;
        window.open(landingUrl, '_blank');
    };

    const handleDelete = (template, config) => {
        console.log('Xóa:', config.name);
        
        // Xóa template khỏi danh sách
        setTemplates(prev => prev.filter(t => t.id !== config.id));
        
        // Cập nhật template count của folder
        if (config.folderId) {
            setFolders(prev => prev.map(f => 
                f.id === config.folderId 
                    ? {...f, templateCount: (f.templateCount || 1) - 1}
                    : f
            ));
        }
        
        // Thông báo thành công
        alert(`✓ Đã xóa template "${config.name}"\n\nLưu ý: Để xóa hoàn toàn, bạn cần:\n1. Xóa folder: src/landing-templates/${config.id}/\n2. Xóa export trong index.js`);
    };

    const handleCreateSuccess = (formData) => {
        console.log('Template mới:', formData);
        
        // Thêm template placeholder vào danh sách
        const newTemplate = {
            id: formData.slug,
            component: null, // Chưa có component thật
            config: {
                id: formData.slug,
                name: formData.name,
                description: formData.description,
                category: formData.category,
                folderId: formData.folderId || null, // Thêm folderId
                slug: `/landing/${formData.slug}`,
                status: 'draft',
                createdAt: new Date().toISOString().split('T')[0],
                features: ['Đang phát triển', 'Chưa có nội dung']
            }
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        
        // Cập nhật template count của folder
        if (formData.folderId) {
            setFolders(prev => prev.map(f => 
                f.id === formData.folderId 
                    ? {...f, templateCount: (f.templateCount || 0) + 1}
                    : f
            ));
        }
        
        alert(`✅ Đã tạo template "${formData.name}"!\n\n📝 Giờ bạn có thể báo tôi:\n"Code landing page ${formData.name}"\n\nTôi sẽ tạo đầy đủ:\n- Component React\n- Styling\n- Sections cần thiết`);
    };

    const handleCreateFolder = (folderData) => {
        console.log('Folder mới:', folderData);
        setFolders(prev => [folderData, ...prev]);
    };

    const handleDeleteFolder = (folder) => {
        // Chuyển templates trong folder về null
        setTemplates(prev => prev.map(t => 
            t.config.folderId === folder.id 
                ? {...t, config: {...t.config, folderId: null}}
                : t
        ));
        
        setFolders(prev => prev.filter(f => f.id !== folder.id));
        
        if (selectedFolderId === folder.id) {
            setSelectedFolderId(null);
        }
        
        alert(`✓ Đã xóa folder "${folder.name}"\n\nCác templates đã được chuyển về "Tất cả"`);
    };

    const handleEditFolder = (folder) => {
        alert(`Chỉnh sửa folder "${folder.name}"\n\nTính năng đang phát triển...`);
    };

    const handleMoveToFolder = (template, config, targetFolderId) => {
        const oldFolderId = config.folderId;
        
        // Update template's folderId
        setTemplates(prev => prev.map(t => 
            t.config.id === config.id 
                ? {...t, config: {...t.config, folderId: targetFolderId}}
                : t
        ));
        
        // Update folder counts
        setFolders(prev => prev.map(f => {
            if (f.id === oldFolderId) {
                // Giảm count của folder cũ
                return {...f, templateCount: (f.templateCount || 1) - 1};
            } else if (f.id === targetFolderId) {
                // Tăng count của folder mới
                return {...f, templateCount: (f.templateCount || 0) + 1};
            }
            return f;
        }));
        
        const targetFolderName = targetFolderId 
            ? folders.find(f => f.id === targetFolderId)?.name 
            : 'Tất cả';
        
        console.log(`✓ Đã chuyển "${config.name}" vào "${targetFolderName}"`);
    };

    const categories = [
        { key: 'all', name: 'Tất cả' },
        { key: 'ads', name: 'Quảng cáo' },
        { key: 'organic', name: 'Tự nhiên' },
        { key: 'event', name: 'Sự kiện' },
        { key: 'course', name: 'Khóa học' },
        { key: 'webinar', name: 'Hội thảo' },
        { key: 'promo', name: 'Khuyến mãi' },
        { key: 'example', name: 'Ví dụ' }
    ];

    // Filter templates theo folder VÀ category
    const filteredTemplates = templates.filter(t => {
        const matchFolder = selectedFolderId === null || t.config.folderId === selectedFolderId;
        const matchCategory = selectedCategory === 'all' || t.config?.category === selectedCategory;
        return matchFolder && matchCategory;
    });

    const selectedCategoryName = categories.find(c => c.key === selectedCategory)?.name || 'Tất cả';

    // Helper: Convert color key to hex
    const getColorHex = (colorKey) => {
        const colorMap = {
            'indigo': '#4F46E5',
            'purple': '#9333EA',
            'pink': '#EC4899',
            'emerald': '#10B981',
            'orange': '#F59E0B',
            'red': '#EF4444',
            'blue': '#3B82F6',
            'slate': '#64748B',
        };
        return colorMap[colorKey] || '#64748B';
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-0">
            {/* FOLDER SIDEBAR */}
            <FolderSidebar
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                onEditFolder={handleEditFolder}
                onDeleteFolder={handleDeleteFolder}
            />

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    {/* Breadcrumb */}
                    {selectedFolderId && (
                        <div className="mb-4 flex items-center gap-2 text-sm">
                            <button
                                onClick={() => setSelectedFolderId(null)}
                                className="text-slate-500 hover:text-indigo-600 transition-colors font-medium"
                            >
                                Home
                            </button>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-800 font-semibold">
                                {folders.find(f => f.id === selectedFolderId)?.name}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            {selectedFolderId ? (
                                // Header khi đang xem folder
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedFolderId(null)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                                        title="Quay lại tất cả templates"
                                    >
                                        <ChevronRight size={24} className="text-slate-400 group-hover:text-indigo-600 rotate-180 transition-colors" />
                                    </button>
                                    <div 
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: getColorHex(folders.find(f => f.id === selectedFolderId)?.color) }}
                                    >
                                        <FolderOpen size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-800">
                                            {folders.find(f => f.id === selectedFolderId)?.name}
                                        </h1>
                                        <p className="text-slate-500 text-sm mt-0.5">
                                            {filteredTemplates.length} templates trong folder này
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                // Header mặc định
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
                                        <Sparkles size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-800">Tạo Landing Page</h1>
                                        <p className="text-slate-500 text-sm mt-1">
                                            Chọn mẫu template và tùy chỉnh để tạo landing page chuyên nghiệp
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {/* Nút tạo folder */}
                            <button 
                                onClick={() => setIsCreateFolderModalOpen(true)}
                                className="px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold inline-flex items-center gap-2"
                            >
                                <FolderPlus size={20} />
                                Tạo Folder
                            </button>

                            {/* Nút thêm template */}
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold inline-flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Thêm Template
                            </button>

                            {/* Info Button */}
                            <button 
                                onClick={() => alert('📖 Hướng dẫn sử dụng:\n\n1. Tạo Folder để phân loại templates\n2. Chọn template từ danh sách\n3. Nhấn "Xem trước" để preview\n4. Nhấn "Sử dụng" để tạo landing\n5. Nhấn icon 🗑️ (hiện khi hover) để xóa\n\n📁 Thêm template mới:\nXem file LANDING_STRUCTURE.md')}
                                className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                                title="Hướng dẫn"
                            >
                                <Info size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <div key={cat.key} className="relative group">
                                <button
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                        selectedCategory === cat.key
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-indigo-200'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                                
                                {/* Nút tạo folder cho category này */}
                                {cat.key !== 'all' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsCreateFolderModalOpen(true);
                                        }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal-600 hover:scale-110"
                                        title={`Tạo folder cho ${cat.name}`}
                                    >
                                        <Plus size={12} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
                        <div className="px-3 py-1 bg-slate-100 rounded-lg">
                            <span className="text-slate-600">Tổng: </span>
                            <span className="font-bold text-slate-800">{templates.length} templates</span>
                        </div>
                        {selectedCategory !== 'all' && (
                            <div className="px-3 py-1 bg-indigo-50 rounded-lg">
                                <span className="text-indigo-600">
                                    {selectedCategoryName}: 
                                </span>
                                <span className="font-bold text-indigo-800 ml-1">
                                    {filteredTemplates.length}
                                </span>
                            </div>
                        )}
                        
                        {/* Hiển thị folders */}
                        {folders.length > 0 && (
                            <>
                                <div className="w-px h-6 bg-slate-300"></div>
                                <span className="text-xs text-slate-500 font-semibold">📁 Folders:</span>
                                {folders.map(folder => {
                                    const folderTemplateCount = templates.filter(t => t.config.folderId === folder.id).length;
                                    const isSelected = selectedFolderId === folder.id;
                                    
                                    return (
                                        <button
                                            key={folder.id}
                                            onClick={() => setSelectedFolderId(isSelected ? null : folder.id)}
                                            className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                                                isSelected
                                                    ? 'bg-teal-500 text-white shadow-md'
                                                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-teal-300'
                                            }`}
                                        >
                                            <span className="inline-block w-2 h-2 rounded-full mr-1.5" 
                                                  style={{ backgroundColor: getColorHex(folder.color) }}></span>
                                            {folder.name} ({folderTemplateCount})
                                        </button>
                                    );
                                })}
                            </>
                        )}
                        
                        {selectedFolderId && (
                            <button
                                onClick={() => setSelectedFolderId(null)}
                                className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                            >
                                ✕ Bỏ lọc
                            </button>
                        )}
                    </div>
                </div>

                {/* Templates Grid */}
                {filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                        {filteredTemplates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template.component}
                                config={template.config}
                                onPreview={handlePreview}
                                onCreate={handleCreate}
                                onDelete={handleDelete}
                                onMoveToFolder={handleMoveToFolder}
                                folders={folders}
                            />
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mb-6">
                        <FolderOpen size={64} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">
                            Chưa có template nào
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {selectedCategory === 'all' 
                                ? 'Thêm templates mới vào thư mục landing-templates/'
                                : `Không có template nào trong danh mục "${selectedCategoryName}"`
                            }
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                            >
                                <Layout size={20} />
                                Xem tất cả
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                            >
                                <Plus size={20} />
                                Thêm template
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6">
                    <div className="flex gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl h-fit">
                            <Info size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 mb-3 text-lg">💡 Cách sử dụng</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-white p-4 rounded-xl">
                                    <h5 className="font-bold text-sm text-slate-700 mb-2">📁 Quản lý Folders:</h5>
                                    <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                                        <li>Tạo folder để phân loại templates</li>
                                        <li>Click vào folder để xem templates</li>
                                        <li>Menu 3 chấm để đổi tên/xóa</li>
                                        <li>Templates có thể thuộc nhiều category</li>
                                    </ol>
                                </div>

                                <div className="bg-white p-4 rounded-xl">
                                    <h5 className="font-bold text-sm text-slate-700 mb-2">📋 Sử dụng template:</h5>
                                    <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                                        <li>Chọn template phù hợp</li>
                                        <li>Nhấn "Xem trước" để kiểm tra</li>
                                        <li>Nhấn "Sử dụng" để tạo landing</li>
                                        <li>Tùy chỉnh nội dung theo nhu cầu</li>
                                    </ol>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <span className="text-xs text-teal-600 font-semibold bg-white px-3 py-1 rounded-full">
                                    📁 Folders giúp tổ chức templates theo dự án
                                </span>
                                <span className="text-xs text-indigo-600 font-semibold bg-white px-3 py-1 rounded-full">
                                    📖 Chi tiết xem: LANDING_STRUCTURE.md
                                </span>
                                <span className="text-xs text-emerald-600 font-semibold bg-white px-3 py-1 rounded-full">
                                    🗑️ Xóa: Hover vào card → Nhấn nút đỏ góc trên trái
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <CreateTemplateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateSuccess={handleCreateSuccess}
                folders={folders}
            />

            <CreateFolderModal
                isOpen={isCreateFolderModalOpen}
                onClose={() => setIsCreateFolderModalOpen(false)}
                onCreateSuccess={handleCreateFolder}
            />
        </div>
    );
};

export default AdminLandingBuilder;
