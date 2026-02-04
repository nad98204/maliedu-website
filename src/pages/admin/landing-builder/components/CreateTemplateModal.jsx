import React, { useState } from 'react';
import { X, Sparkles, FolderPlus, CheckCircle, Folder } from 'lucide-react';

/**
 * Modal tạo Landing Page Template mới
 */
const CreateTemplateModal = ({ isOpen, onClose, onCreateSuccess, folders = [] }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Preview, 3: Success
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'ads',
    slug: '',
    folderId: null,
  });

  const [autoGenerating, setAutoGenerating] = useState(false);

  // Tự động tạo slug từ tên
  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: name
        .toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    });
  };

  const handleCreate = () => {
    setAutoGenerating(true);
    
    // Simulate tạo file structure
    setTimeout(() => {
      setAutoGenerating(false);
      setStep(3);
      
      // Sau 2 giây tự động close và notify parent
      setTimeout(() => {
        onCreateSuccess?.(formData);
        handleClose();
      }, 2000);
    }, 1500);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: 'ads',
      slug: '',
      folderId: null,
    });
    setStep(1);
    onClose?.();
  };

  const categories = [
    { key: 'ads', name: '📢 Quảng cáo', color: 'indigo' },
    { key: 'organic', name: '🌱 Tự nhiên', color: 'emerald' },
    { key: 'event', name: '🎉 Sự kiện', color: 'purple' },
    { key: 'course', name: '📚 Khóa học', color: 'blue' },
    { key: 'webinar', name: '💻 Hội thảo', color: 'orange' },
    { key: 'promo', name: '🎁 Khuyến mãi', color: 'pink' },
  ];

  const isFormValid = formData.name.trim().length > 0 && formData.slug.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Tạo Landing Page Mới</h2>
              <p className="text-indigo-100 text-sm mt-1">
                {step === 1 && 'Bước 1: Nhập thông tin cơ bản'}
                {step === 2 && 'Bước 2: Xác nhận và tạo'}
                {step === 3 && 'Hoàn thành!'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            <div className={`h-1.5 rounded-full flex-1 ${step >= 1 ? 'bg-white' : 'bg-white/30'}`}></div>
            <div className={`h-1.5 rounded-full flex-1 ${step >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
            <div className={`h-1.5 rounded-full flex-1 ${step >= 3 ? 'bg-white' : 'bg-white/30'}`}></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: Form */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Tên Landing Page */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tên Landing Page *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="VD: Khóa Khơi Thông Dòng Tiền - K38"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-800 font-medium"
                  autoFocus
                />
              </div>

              {/* Slug (Auto-generated) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  URL Slug (Tự động tạo)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">/landing/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-600 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Preview: <span className="font-mono text-indigo-600">maliedu.vn/landing/{formData.slug || '...'}</span>
                </p>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Mô tả ngắn
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về landing page này..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-700 resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Danh mục *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setFormData({ ...formData, category: cat.key })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.category === cat.key
                          ? `border-${cat.color}-500 bg-${cat.color}-50`
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-800">{cat.name}</div>
                      <div className="text-xs text-slate-500 mt-1 capitalize">{cat.key}</div>
                    </button>
                  ))
}                </div>
              </div>

              {/* Folder Selector */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Thư mục (Tùy chọn)
                </label>
                <select
                  value={formData.folderId || ''}
                  onChange={(e) => setFormData({ ...formData, folderId: e.target.value || null })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-slate-700 font-medium"
                >
                  <option value="">📂 Không thuộc folder nào</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      📁 {folder.name} ({folder.templateCount || 0} templates)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn folder để tổ chức templates theo dự án hoặc nhóm
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4">📋 Xác nhận thông tin</h3>
                
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Tên Landing Page</div>
                    <div className="font-bold text-slate-800">{formData.name}</div>
                  </div>

                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">URL</div>
                    <div className="font-mono text-sm text-indigo-600">maliedu.vn/landing/{formData.slug}</div>
                  </div>

                  <div className="bg-white rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Danh mục</div>
                    <div className="font-semibold">
                      {categories.find(c => c.key === formData.category)?.name}
                    </div>
                  </div>

                  {formData.folderId && (
                    <div className="bg-white rounded-xl p-4">
                      <div className="text-xs text-slate-500 mb-1">Thư mục</div>
                      <div className="font-semibold text-teal-600 flex items-center gap-2">
                        <Folder size={16} />
                        {folders.find(f => f.id === formData.folderId)?.name}
                      </div>
                    </div>
                  )}

                  {formData.description && (
                    <div className="bg-white rounded-xl p-4">
                      <div className="text-xs text-slate-500 mb-1">Mô tả</div>
                      <div className="text-slate-600 text-sm">{formData.description}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <FolderPlus size={18} />
                  Hệ thống sẽ tạo:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1 font-mono">
                  <li>📁 src/landing-templates/{formData.slug}/</li>
                  <li className="ml-4">📄 {toComponentName(formData.name)}.jsx</li>
                  <li className="ml-4">📄 config.json</li>
                  <li className="ml-4">📄 README.md</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle size={48} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                ✅ Tạo thành công!
              </h3>
              <p className="text-slate-600 mb-6">
                Template <span className="font-bold text-indigo-600">{formData.name}</span> đã được tạo
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                <p>Giờ bạn có thể:</p>
                <p className="font-semibold text-slate-800 mt-2">
                  📝 Báo tôi code nội dung cho landing page này
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(step === 1 || step === 2) && (
          <div className="p-6 bg-slate-50 border-t-2 border-slate-100 flex gap-3">
            {step === 1 && (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!isFormValid}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all ${
                    isFormValid
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Tiếp tục →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleCreate}
                  disabled={autoGenerating}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all ${
                    autoGenerating
                      ? 'bg-emerald-400 cursor-wait'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {autoGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang tạo...
                    </span>
                  ) : (
                    '✨ Tạo Template'
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper: Convert tên thành ComponentName
const toComponentName = (name) => {
  return name
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

export default CreateTemplateModal;
