import React, { useState } from 'react';
import { X, FolderPlus, CheckCircle } from 'lucide-react';

/**
 * Modal tạo Folder mới để phân loại templates
 */
const CreateFolderModal = ({ isOpen, onClose, onCreateSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'indigo',
  });

  const [isCreating, setIsCreating] = useState(false);

  const colors = [
    { key: 'indigo', name: 'Xanh Dương', hex: '#4F46E5' },
    { key: 'purple', name: 'Tím', hex: '#9333EA' },
    { key: 'pink', name: 'Hồng', hex: '#EC4899' },
    { key: 'emerald', name: 'Xanh Lá', hex: '#10B981' },
    { key: 'orange', name: 'Cam', hex: '#F59E0B' },
    { key: 'red', name: 'Đỏ', hex: '#EF4444' },
    { key: 'blue', name: 'Xanh Biển', hex: '#3B82F6' },
    { key: 'slate', name: 'Xám', hex: '#64748B' },
  ];

  const handleCreate = () => {
    setIsCreating(true);
    
    setTimeout(() => {
      const folderId = formData.name
        .toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      onCreateSuccess?.({
        ...formData,
        id: folderId,
        createdAt: new Date().toISOString().split('T')[0],
        templateCount: 0
      });
      
      setIsCreating(false);
      handleClose();
    }, 500);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: 'indigo',
    });
    onClose?.();
  };

  const isFormValid = formData.name.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white relative rounded-t-2xl">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <FolderPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tạo Folder Mới</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Phân loại templates theo dự án hoặc nhóm
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tên Folder */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Tên Folder *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Chiến dịch TikTok Q1, Khóa học K38..."
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-800 font-medium text-sm"
              autoFocus
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Mô tả (tùy chọn)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả ngắn gọn về folder này..."
              rows={2}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-700 resize-none text-sm"
            />
          </div>

          {/* Màu sắc */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Chọn màu nhận diện
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color.key}
                  onClick={() => setFormData({ ...formData, color: color.key })}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    formData.color === color.key
                      ? 'border-slate-800 ring-2 ring-slate-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div 
                    className="w-full h-6 rounded-md mb-1.5"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="text-xs text-slate-600 font-medium text-center">
                    {color.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-lg p-3 border-2 border-slate-100">
            <div className="text-xs text-slate-500 mb-2">Xem trước:</div>
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: colors.find(c => c.key === formData.color)?.hex }}
              >
                <FolderPlus size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">
                  {formData.name || 'Tên folder...'}
                </div>
                {formData.description && (
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {formData.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t-2 border-slate-100 flex gap-2.5 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={!isFormValid || isCreating}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition-all text-sm ${
              isFormValid && !isCreating
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tạo...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                Tạo Folder
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal;
