import React, { useState } from 'react';
import { Eye, Code, Sparkles, Trash2, FolderInput, ChevronDown } from 'lucide-react';

/**
 * TemplateCard Component
 * Hiển thị mỗi landing template dưới dạng card
 */
const TemplateCard = ({ template, config, onPreview, onCreate, onDelete, onMoveToFolder, folders = [] }) => {
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc muốn xóa template "${config?.name || 'này'}"?\n\nLưu ý: Hành động này không thể hoàn tác!`)) {
      onDelete?.(template, config);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all shadow-sm hover:shadow-xl group overflow-hidden">
      {/* Thumbnail */}
      <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
        {config?.thumbnail ? (
          <img src={config.thumbnail} alt={config.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <Sparkles size={48} className="text-indigo-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">Chưa có hình đại diện</p>
          </div>
        )}
        
        {/* Status Badge */}
        {config?.status && (
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase ${
            config.status === 'active' ? 'bg-emerald-500 text-white' : 
            config.status === 'draft' ? 'bg-slate-500 text-white' : 'bg-orange-500 text-white'
          }`}>
            {config.status === 'active' ? 'Đang dùng' : 
             config.status === 'draft' ? 'Nháp' : config.status}
          </div>
        )}

        {/* Delete Button - Hiện khi hover */}
        <button
          onClick={handleDelete}
          className="absolute top-3 left-3 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110"
          title="Xóa template"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category */}
        {config?.category && (
          <div className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold uppercase mb-3">
            {getCategoryName(config.category)}
          </div>
        )}

        {/* Title & Description */}
        <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1">
          {config?.name || 'Template chưa đặt tên'}
        </h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {config?.description || 'Chưa có mô tả'}
        </p>

        {/* Features */}
        {config?.features && config.features.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {config.features.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onPreview?.(template, config)}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-100 transition-colors"
            >
              <Eye size={16} />
              Xem trước
            </button>
            <button
              onClick={() => onCreate?.(template, config)}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              <Code size={16} />
              Sử dụng
            </button>
          </div>

          {/* Move to Folder - Dropdown */}
          {folders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFolderMenu(!showFolderMenu)}
                className="w-full flex items-center justify-center gap-2 bg-teal-50 text-teal-700 py-2 rounded-lg font-semibold text-sm hover:bg-teal-100 transition-colors"
              >
                <FolderInput size={16} />
                Chuyển vào folder
                <ChevronDown size={14} className={`transition-transform ${showFolderMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showFolderMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border-2 border-slate-200 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                  {/* Option: Không thuộc folder nào */}
                  <button
                    onClick={() => {
                      onMoveToFolder?.(template, config, null);
                      setShowFolderMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                      !config?.folderId ? 'bg-teal-50 font-semibold text-teal-700' : 'text-slate-700'
                    }`}
                  >
                    📂 Không thuộc folder nào
                  </button>

                  {/* Folders List */}
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        onMoveToFolder?.(template, config, folder.id);
                        setShowFolderMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                        config?.folderId === folder.id ? 'bg-teal-50 font-semibold text-teal-700' : 'text-slate-700'
                      }`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: getFolderColor(folder.color) }}
                      />
                      <span className="flex-1 truncate">{folder.name}</span>
                      {config?.folderId === folder.id && <span className="text-teal-600">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meta Info */}
        {config?.createdAt && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Ngày tạo: {config.createdAt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function để chuyển category sang tiếng Việt
const getCategoryName = (category) => {
  const names = {
    'all': 'Tất cả',
    'ads': 'Quảng cáo',
    'organic': 'Tự nhiên',
    'event': 'Sự kiện',
    'course': 'Khóa học',
    'webinar': 'Hội thảo',
    'promo': 'Khuyến mãi',
    'example': 'Ví dụ mẫu'
  };
  return names[category] || category.toUpperCase();
};

// Helper function để get folder color
const getFolderColor = (colorKey) => {
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

export default TemplateCard;
