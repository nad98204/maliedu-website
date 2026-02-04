import React from 'react';
import { Folder, ChevronRight, MoreVertical, Trash2, Edit2 } from 'lucide-react';

/**
 * Sidebar hiển thị danh sách folders
 */
const FolderSidebar = ({ 
  folders = [], 
  selectedFolderId, 
  onSelectFolder, 
  onEditFolder, 
  onDeleteFolder 
}) => {
  const [expandedMenu, setExpandedMenu] = React.useState(null);

  const handleMenuToggle = (e, folderId) => {
    e.stopPropagation();
    setExpandedMenu(expandedMenu === folderId ? null : folderId);
  };

  const handleDelete = (e, folder) => {
    e.stopPropagation();
    if (window.confirm(`Xóa folder "${folder.name}"?\n\nCác templates trong folder sẽ được chuyển về "Tất cả".`)) {
      onDeleteFolder?.(folder);
    }
    setExpandedMenu(null);
  };

  const handleEdit = (e, folder) => {
    e.stopPropagation();
    onEditFolder?.(folder);
    setExpandedMenu(null);
  };

  const getColorClass = (color) => {
    const colors = {
      'indigo': 'bg-indigo-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'emerald': 'bg-emerald-500',
      'orange': 'bg-orange-500',
      'red': 'bg-red-500',
      'blue': 'bg-blue-500',
      'slate': 'bg-slate-500',
    };
    return colors[color] || 'bg-slate-500';
  };

  return (
    <div className="w-72 bg-white border-r-2 border-slate-100 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b-2 border-slate-100">
        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
          <Folder size={16} />
          Thư mục
        </h3>
      </div>

      {/* Folder List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* All Templates */}
        <button
          onClick={() => onSelectFolder?.(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${
            selectedFolderId === null
              ? 'bg-indigo-50 text-indigo-700 font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Folder size={18} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold">Tất cả Templates</div>
            <div className="text-xs opacity-75">
              {folders.reduce((sum, f) => sum + (f.templateCount || 0), 0)} templates
            </div>
          </div>
          <ChevronRight size={16} className={selectedFolderId === null ? 'opacity-100' : 'opacity-0'} />
        </button>

        {/* Custom Folders */}
        <div className="mt-4">
          <div className="text-xs font-bold text-slate-400 uppercase px-3 mb-2">
            Folders của bạn
          </div>
          
          {folders.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-slate-300 mb-2">
                <Folder size={32} className="mx-auto" />
              </div>
              <p className="text-sm text-slate-400">
                Chưa có folder nào
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tạo folder để tổ chức templates
              </p>
            </div>
          ) : (
            folders.map(folder => (
              <div
                key={folder.id}
                className={`relative group mb-1`}
              >
                <button
                  onClick={() => onSelectFolder?.(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    selectedFolderId === folder.id
                      ? 'bg-slate-100 text-slate-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 ${getColorClass(folder.color)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Folder size={18} className="text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold truncate">{folder.name}</div>
                    <div className="text-xs opacity-75">
                      {folder.templateCount || 0} templates
                    </div>
                  </div>
                  <ChevronRight size={16} className={selectedFolderId === folder.id ? 'opacity-100' : 'opacity-0'} />
                </button>

                {/* Menu Button */}
                <button
                  onClick={(e) => handleMenuToggle(e, folder.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={14} className="text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {expandedMenu === folder.id && (
                  <div className="absolute right-2 top-full mt-1 bg-white rounded-xl shadow-xl border-2 border-slate-100 z-10 min-w-[160px]">
                    <button
                      onClick={(e) => handleEdit(e, folder)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-t-xl"
                    >
                      <Edit2 size={14} />
                      Đổi tên
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, folder)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-medium rounded-b-xl"
                    >
                      <Trash2 size={14} />
                      Xóa folder
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderSidebar;
