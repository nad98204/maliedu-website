import { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc, where, updateDoc } from 'firebase/firestore';
import { File, Video, Upload, Copy, Trash2, ExternalLink, Folder as FolderIcon, ChevronRight, Plus, Eye, X, Edit2, Check, ArchiveRestore, MoveRight } from 'lucide-react';
import { db } from '../../firebase';
import { uploadVideoToS3 } from '../../utils/s3UploadService';
import { uploadToCloudinary } from '../../utils/uploadService';
import toast from 'react-hot-toast';

export default function AdminStorage() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProvider, setUploadProvider] = useState('auto');

  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingFileName, setEditingFileName] = useState('');
  
  const [viewMode, setViewMode] = useState('storage');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [allFoldersList, setAllFoldersList] = useState([]);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef(null);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      dragModeRef.current = null;
      document.body.classList.remove('select-none');
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleRowMouseDown = (e, fileId) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input[type="text"]')) return;
    
    document.body.classList.add('select-none');
    setIsDragging(true);
    
    setSelectedItems(prev => {
      const isCurrentlySelected = prev.includes(fileId);
      if (e.target.type === 'checkbox') {
          dragModeRef.current = !isCurrentlySelected ? 'select' : 'deselect';
          return prev;
      } else {
          dragModeRef.current = isCurrentlySelected ? 'deselect' : 'select';
          if (dragModeRef.current === 'select') {
             return prev.includes(fileId) ? prev : [...prev, fileId];
          } else {
             return prev.filter(id => id !== fileId);
          }
      }
    });
  };

  const handleRowMouseEnter = (fileId) => {
    if (dragModeRef.current) {
      setSelectedItems(prev => {
        if (dragModeRef.current === 'select' && !prev.includes(fileId)) {
          return [...prev, fileId];
        } else if (dragModeRef.current === 'deselect' && prev.includes(fileId)) {
          return prev.filter(id => id !== fileId);
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    fetchItems(currentFolder, viewMode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder, viewMode]);

  const fetchItems = async (folder, mode = viewMode) => {
    setSelectedItems([]);
    try {
      if (mode === 'trash') {
        const snapDeletedFiles = await getDocs(query(collection(db, 'storage_files'), where('isDeleted', '==', true)));
        let dataDeletedFiles = snapDeletedFiles.docs.map(d => ({ id: d.id, ...d.data() }));
        const now = new Date();
        const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
        const toKeep = [];
        for (const f of dataDeletedFiles) {
          if (f.deletedAt && (now.getTime() - f.deletedAt.toDate().getTime() > fifteenDaysMs)) {
              await deleteDoc(doc(db, 'storage_files', f.id));
          } else {
              toKeep.push(f);
          }
        }
        toKeep.sort((a, b) => (b.deletedAt?.seconds || 0) - (a.deletedAt?.seconds || 0));
        setFiles(toKeep);
        setFolders([]);
      } else {
        const folderId = folder ? folder.id : "root";
        const snapFolders = await getDocs(query(collection(db, 'storage_folders'), where('parentId', '==', folderId)));
        const dataFolders = snapFolders.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.isDeleted);
        dataFolders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setFolders(dataFolders);

        const snapFiles = await getDocs(query(collection(db, 'storage_files'), where('folderId', '==', folderId)));
        const dataFiles = snapFiles.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.isDeleted);
        dataFiles.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setFiles(dataFiles);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'storage_folders'), {
        name: newFolderName,
        parentId: currentFolder ? currentFolder.id : "root",
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
      fetchItems(currentFolder);
      toast.success("Đã tạo thư mục");
    } catch {
      toast.error("Lỗi tạo thư mục");
    }
  };

  const handleDeleteFolder = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Thư mục sẽ được chuyển vào thùng rác?")) {
      try {
        await updateDoc(doc(db, 'storage_folders', id), { isDeleted: true, deletedAt: serverTimestamp() });
        toast.success("Đã chuyển vào thùng rác!");
        fetchItems(currentFolder);
      } catch {
        toast.error("Lỗi xóa thư mục");
      }
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    setIsUploading(true);
    let successCount = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(`tệp ${i + 1}/${selectedFiles.length}...`);
        
        let fileUrl = '';
        
        if (uploadProvider === 'cloudinary' || (uploadProvider === 'auto' && file.type.startsWith('image/'))) {
           const res = await uploadToCloudinary(file);
           fileUrl = res.secureUrl;
        } else {
           fileUrl = await uploadVideoToS3(file, (progress) => {
             setUploadProgress(`tệp ${i + 1}/${selectedFiles.length} (${progress}%)`);
           });
        }

        const newFile = {
          name: file.name,
          url: fileUrl,
          type: file.type || 'unknown',
          size: file.size,
          folderId: currentFolder ? currentFolder.id : "root",
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'storage_files'), newFile);
        successCount++;
      }
      
      toast.success(`Đã tải lên thành công ${successCount} tệp!`);
      fetchItems(currentFolder);
    } catch (error) {
      console.error(error);
      toast.error(`Có lỗi xảy ra. Đã tải lên ${successCount}/${selectedFiles.length} tệp.`);
      fetchItems(currentFolder);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("File sẽ được chuyển vào thùng rác?")) {
      try {
        await updateDoc(doc(db, 'storage_files', id), { isDeleted: true, deletedAt: serverTimestamp() });
        toast.success("Đã chuyển vào thùng rác!");
        fetchItems(currentFolder);
      } catch {
        toast.error("Lỗi xóa file");
      }
    }
  };

  const handleRestoreFile = async (id) => {
    try {
      await updateDoc(doc(db, 'storage_files', id), { isDeleted: false, deletedAt: null });
      toast.success("Đã khôi phục file!");
      fetchItems(currentFolder);
    } catch {
      toast.error("Lỗi khôi phục file");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm("Xóa vĩnh viễn file này? Không thể khôi phục!")) {
      try {
        await deleteDoc(doc(db, 'storage_files', id));
        toast.success("Đã xóa vĩnh viễn!");
        fetchItems(currentFolder);
      } catch {
        toast.error("Lỗi xóa file");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === files.length && files.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(files.map(f => f.id));
    }
  };

  const handleSelectItem = (id, e) => {
    e.stopPropagation();
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  
  const handleBulkSoftDelete = async () => {
     if (window.confirm(`Chuyển ${selectedItems.length} mục vào thùng rác?`)) {
       try {
         for (const id of selectedItems) {
            await updateDoc(doc(db, 'storage_files', id), { isDeleted: true, deletedAt: serverTimestamp() });
         }
         toast.success("Đã chuyển vào thùng rác");
         fetchItems(currentFolder);
       } catch {
         toast.error("Có lỗi xảy ra");
       }
     }
  };
  
  const handleOpenMoveModal = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'storage_folders')));
      const allFolders = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.isDeleted);
      
      const buildFolderTree = (folders) => {
        const rootNodes = [];
        const childrenMap = {};
        
        folders.forEach(folder => {
          const pId = folder.parentId || "root";
          if (!childrenMap[pId]) childrenMap[pId] = [];
          childrenMap[pId].push(folder);
        });

        // "root" nodes are those whose parentId is "root"
        if (childrenMap["root"]) {
          rootNodes.push(...childrenMap["root"]);
        }

        const flattenTree = (nodes, depth = 0) => {
          let result = [];
          // Optional: sort nodes by name
          nodes.sort((a, b) => a.name.localeCompare(b.name));
          nodes.forEach(node => {
            result.push({ ...node, depth });
            if (childrenMap[node.id]) {
              result = result.concat(flattenTree(childrenMap[node.id], depth + 1));
            }
          });
          return result;
        };

        return flattenTree(rootNodes);
      };

      setAllFoldersList(buildFolderTree(allFolders));
      setSelectedMoveFolder(null);
      setIsMoveModalOpen(true);
    } catch {
      toast.error("Lỗi lấy danh sách thư mục");
    }
  };

  const handleBulkMove = async (targetFolderId) => {
     try {
       for (const id of selectedItems) {
          await updateDoc(doc(db, 'storage_files', id), { folderId: targetFolderId });
       }
       toast.success("Đã di chuyển file thành công");
       setIsMoveModalOpen(false);
       setSelectedMoveFolder(null);
       fetchItems(currentFolder);
     } catch {
       toast.error("Lỗi di chuyển file");
     }
  };

  const handleRenameFile = async (file) => {
    if (!editingFileName.trim() || editingFileName === file.name) {
      setEditingFileId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'storage_files', file.id), { name: editingFileName });
      toast.success("Đã đổi tên file!");
      fetchItems(currentFolder);
    } catch {
      toast.error("Lỗi đổi tên file");
    } finally {
      setEditingFileId(null);
    }
  };

  const formatSize = (bytes) => {
     if (!bytes) return '0 B';
     const k = 1024;
     const sizes = ['B', 'KB', 'MB', 'GB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));
     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép link!');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => {setViewMode('storage'); setCurrentFolder(null);}} className={`pb-2 font-medium px-4 transition ${viewMode === 'storage' ? 'border-b-2 border-secret-wax text-secret-wax' : 'text-slate-500 hover:text-slate-700'}`}>Tất cả kho lưu trữ</button>
        <button onClick={() => {setViewMode('trash'); setCurrentFolder(null);}} className={`pb-2 font-medium px-4 transition ${viewMode === 'trash' ? 'border-b-2 border-red-500 text-red-500' : 'text-slate-500 hover:text-slate-700'}`}>Thùng rác</button>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="shrink-0 max-w-full">
          <h1 className="text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
            {viewMode === 'trash' ? "Thùng rác" : (
              <button onClick={() => setCurrentFolder(null)} className="hover:text-secret-wax transition whitespace-nowrap">Kho Lưu Trữ</button>
            )}
            {currentFolder && viewMode === 'storage' && (
              <>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                <span className="text-secret-wax truncate max-w-[200px] sm:max-w-xs">{currentFolder.name}</span>
              </>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{viewMode === 'trash' ? "Tệp trong thùng rác sẽ tự động xóa vĩnh viễn sau 15 ngày." : "Quản lý và sắp xếp hình ảnh, video, tài liệu"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 xl:justify-end w-full xl:w-auto">
          {selectedItems.length > 0 && viewMode === 'storage' && (
            <div className="flex flex-wrap items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shrink-0">
              <span className="text-sm text-blue-700 font-medium mr-1 whitespace-nowrap">Đã chọn: {selectedItems.length}</span>
              <button onClick={handleOpenMoveModal} className="flex items-center gap-1.5 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded text-sm transition whitespace-nowrap"><MoveRight className="w-4 h-4" /> Di chuyển</button>
              <button onClick={handleBulkSoftDelete} className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm transition whitespace-nowrap"><Trash2 className="w-4 h-4" /> Xóa</button>
            </div>
          )}
          {viewMode === 'storage' && (
             <>
               <button 
                 onClick={() => setIsCreatingFolder(true)} 
                 className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition font-medium border border-slate-200"
               >
                 <Plus className="w-4 h-4" />
                 Thư mục mới
               </button>
               <select 
                 value={uploadProvider} 
                 onChange={(e) => setUploadProvider(e.target.value)}
                 className="border-slate-200 border rounded-lg px-3 py-2 text-sm text-slate-700 bg-white outline-none focus:border-secret-wax shadow-sm"
                 disabled={isUploading}
               >
                 <option value="auto">Tự động (Ảnh: Cloudinary, Khác: S3)</option>
                 <option value="cloudinary">Tải lên Cloudinary</option>
                 <option value="s3">Tải lên Long Vân S3</option>
               </select>

               <div className="relative">
                 <input 
                   type="file" 
                   multiple
                   onChange={handleFileUpload} 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                   disabled={isUploading}
                 />
                 <button className="flex items-center gap-2 bg-secret-wax text-white px-4 py-2 rounded-lg hover:bg-secret-ink transition font-medium relative z-0 disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {isUploading ? `Đang tải ${typeof uploadProgress === 'number' ? uploadProgress + '%' : uploadProgress}` : 'Tải file lên'}
                 </button>
               </div>
             </>
          )}
        </div>
      </div>

      {isCreatingFolder && viewMode === 'storage' && (
        <form onSubmit={handleCreateFolder} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <FolderIcon className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Tên thư mục mới..."
            className="flex-1 border-none outline-none text-sm bg-transparent"
          />
          <button type="submit" className="text-sm font-bold text-secret-wax hover:text-secret-ink px-3">Lưu</button>
          <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-sm text-slate-400 hover:text-slate-600 px-3">Hủy</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
             <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                   {viewMode === 'storage' && (
                     <th className="px-4 py-4 w-10">
                       <input type="checkbox" onChange={toggleSelectAll} checked={files.length > 0 && selectedItems.length === files.length} className="rounded border-slate-300 text-secret-wax focus:ring-secret-wax cursor-pointer w-4 h-4" />
                     </th>
                   )}
                   <th className="px-6 py-4">File</th>
                   <th className="px-6 py-4">Loại</th>
                   <th className="px-6 py-4">Kích thước</th>
                   <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {currentFolder && viewMode === 'storage' && (
                   <tr onClick={() => setCurrentFolder(null)} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-4 py-4"></td>
                      <td className="px-6 py-4" colSpan="4">
                         <div className="flex items-center gap-3 text-slate-500 font-medium">
                            <FolderIcon className="w-5 h-5" />
                            .. (Quay lại)
                         </div>
                      </td>
                   </tr>
                )}
                {viewMode === 'storage' && folders.map(folder => (
                   <tr key={folder.id} onClick={() => setCurrentFolder(folder)} className="hover:bg-slate-50 cursor-pointer group">
                      <td className="px-4 py-4"></td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                               <FolderIcon className="w-5 h-5 fill-current opacity-20" />
                            </div>
                            <span className="font-semibold text-slate-800">{folder.name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Thư mục</span></td>
                      <td className="px-6 py-4 text-slate-500">-</td>
                      <td className="px-6 py-4 text-right">
                         <button
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="Xóa thư mục"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                   </tr>
                ))}
                {files.length === 0 && (viewMode === 'trash' || folders.length === 0) ? (
                  <tr>
                    <td colSpan={viewMode === 'storage' ? "5" : "4"} className="py-10 text-center text-slate-500">
                      {viewMode === 'storage' ? 'Chưa có file nào trong kho lưu trữ.' : 'Thùng rác trống.'}
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr 
                       key={file.id} 
                       className={`hover:bg-slate-50 transition-colors ${selectedItems.includes(file.id) ? 'bg-blue-50/50' : ''} ${isDragging ? 'cursor-row-resize' : ''}`}
                       onMouseDown={(e) => viewMode === 'storage' && handleRowMouseDown(e, file.id)}
                       onMouseEnter={() => viewMode === 'storage' && handleRowMouseEnter(file.id)}
                    >
                       {viewMode === 'storage' && (
                         <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                           <input type="checkbox" checked={selectedItems.includes(file.id)} onChange={(e) => handleSelectItem(file.id, e)} className="rounded border-slate-300 text-secret-wax focus:ring-secret-wax cursor-pointer w-4 h-4" />
                         </td>
                       )}
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             {file.type.startsWith('image/') ? (
                                <img 
                                  src={file.url} 
                                  alt={file.name} 
                                  className="w-10 h-10 object-cover rounded bg-slate-100 border border-slate-200 cursor-pointer hover:opacity-80 transition shrink-0"
                                  onClick={() => setPreviewFile(file)}
                                />
                             ) : file.type.startsWith('video/') ? (
                                <div 
                                  className="relative w-10 h-10 rounded bg-black flex items-center justify-center border border-slate-200 cursor-pointer hover:opacity-80 transition overflow-hidden shrink-0"
                                  onClick={() => setPreviewFile(file)}
                                >
                                   <video src={`${file.url}#t=0.1`} className="w-full h-full object-cover" preload="metadata" />
                                   <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                      <Video className="w-4 h-4 text-white" />
                                   </div>
                                </div>
                             ) : (
                                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                                   <File className="w-5 h-5" />
                                </div>
                             )}
                             <div className="flex flex-col gap-1 w-full relative group/title">
                                {editingFileId === file.id ? (
                                   <div className="flex items-center gap-2">
                                     <input 
                                       type="text"
                                       value={editingFileName}
                                       onChange={(e) => setEditingFileName(e.target.value)}
                                       autoFocus
                                       className="border-slate-300 border rounded px-2 py-1 text-sm bg-white"
                                     />
                                     <button onClick={() => handleRenameFile(file)} className="text-green-600 hover:text-green-700 bg-green-50 p-1.5 rounded-lg transition" title="Lưu">
                                       <Check className="w-3.5 h-3.5" />
                                     </button>
                                     <button onClick={() => setEditingFileId(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg transition" title="Hủy">
                                       <X className="w-3.5 h-3.5" />
                                     </button>
                                   </div>
                                ) : (
                                   <div className="flex items-center gap-2 max-w-[280px]">
                                     <p className="font-medium text-slate-900 line-clamp-1 flex-1" title={file.name}>{file.name}</p>
                                     <button
                                       onClick={(e) => { e.stopPropagation(); setEditingFileId(file.id); setEditingFileName(file.name); }}
                                       className="p-1.5 opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded bg-white transition shadow-sm border border-slate-100 absolute right-0 top-0"
                                       title="Đổi tên"
                                     >
                                       <Edit2 className="w-3.5 h-3.5" />
                                     </button>
                                   </div>
                                )}
                                <p className="text-xs text-slate-500">
                                  {file.createdAt?.toDate ? file.createdAt.toDate().toLocaleDateString('vi-VN') : ''}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                             {file.type.split('/')[0] || 'Khác'}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-slate-500">
                          {formatSize(file.size)}
                       </td>
                       <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             {viewMode === 'trash' ? (
                               <>
                                 <button
                                    onClick={() => handleRestoreFile(file.id)}
                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                    title="Khôi phục"
                                 >
                                    <ArchiveRestore className="w-4 h-4" />
                                 </button>
                                 <button
                                    onClick={() => handlePermanentDelete(file.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Xóa vĩnh viễn"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                               </>
                             ) : (
                               <>
                                 {file.type.startsWith('image/') || file.type.startsWith('video/') ? (
                                   <button
                                      onClick={() => setPreviewFile(file)}
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                      title="Xem trước"
                                   >
                                      <Eye className="w-4 h-4" />
                                   </button>
                                 ) : null}
                                 <a 
                                    href={file.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Mở file"
                                 >
                                    <ExternalLink className="w-4 h-4" />
                                 </a>
                                 <button
                                    onClick={() => copyToClipboard(file.url)}
                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                    title="Copy Link"
                                 >
                                    <Copy className="w-4 h-4" />
                                 </button>
                                 <button
                                    onClick={() => handleDelete(file.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Xóa vào thùng rác"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                               </>
                             )}
                           </div>
                       </td>
                    </tr>
                  ))
                )}
             </tbody>
          </table>
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewFile(null)}>
          <button 
            onClick={() => setPreviewFile(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-red-500 rounded-full text-white transition z-50 flex items-center gap-2 group"
          >
            <X className="w-6 h-6" />
            <span className="font-medium pr-1 text-sm hidden group-hover:block transition">Đóng</span>
          </button>
          
          <div className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            {previewFile.type.startsWith('image/') ? (
              <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            ) : previewFile.type.startsWith('video/') ? (
              <video src={previewFile.url} controls autoPlay className="max-w-full max-h-[85vh] object-contain rounded-lg w-full" />
            ) : (
              <div className="bg-white p-8 rounded-lg text-center">
                <File className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p>Không thể xem trước tệp tin này.</p>
                <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-blue-500 mt-2 inline-block">Mở tệp</a>
              </div>
            )}
            <p className="text-white mt-4 text-center font-medium">{previewFile.name}</p>
          </div>
        </div>
      )}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Di chuyển {selectedItems.length} tệp đến</h3>
            <div className="max-h-[60vh] overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 mb-4">
               <div onClick={() => setSelectedMoveFolder("root")} className={`p-2 cursor-pointer rounded flex items-center gap-2 text-sm font-medium ${selectedMoveFolder === "root" ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                  <FolderIcon className="w-4 h-4 text-slate-400" /> (Thư mục ngoài cùng)
               </div>
               {allFoldersList.map(folder => (
                 <div 
                   key={folder.id} 
                   onClick={() => setSelectedMoveFolder(folder.id)} 
                   className={`p-2 cursor-pointer rounded flex items-center gap-2 text-sm font-medium ${selectedMoveFolder === folder.id ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}
                   style={{ paddingLeft: `${(folder.depth || 0) * 1.5 + 0.5}rem` }}
                 >
                    <FolderIcon className="w-4 h-4 text-amber-500 opacity-80" /> {folder.name}
                 </div>
               ))}
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition">Hủy</button>
              <button 
                 onClick={() => selectedMoveFolder && handleBulkMove(selectedMoveFolder)} 
                 disabled={!selectedMoveFolder}
                 className="flex-1 py-2 bg-secret-wax text-white rounded-lg font-medium hover:bg-secret-wax/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
