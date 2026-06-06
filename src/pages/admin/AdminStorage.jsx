import { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc, where, updateDoc } from 'firebase/firestore';
import { File, Video, Upload, Copy, Trash2, ExternalLink, Folder as FolderIcon, ChevronRight, Plus, Eye, X, Edit2, Check, ArchiveRestore, MoveRight, Image as ImageIcon, FileText, Package, HardDrive, Download, Share2, MoreHorizontal, List, Grid2X2, Home, SlidersHorizontal, Link2Off } from 'lucide-react';
import { db } from '../../firebase';
import { uploadFileToS3 } from '../../utils/s3UploadService';
import { SITE_URL } from '../../seo/routeSeo';
import toast from 'react-hot-toast';

export default function AdminStorage() {
  const [files, setFiles] = useState([]);
  const [allStorageFiles, setAllStorageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingFileName, setEditingFileName] = useState('');
  
  const [viewMode, setViewMode] = useState('storage');
  const [displayMode, setDisplayMode] = useState('list');
  const [activeCategory, setActiveCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
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
    fetchAllStorageFiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder, viewMode]);

  const fetchAllStorageFiles = async () => {
    try {
      const snapFiles = await getDocs(query(collection(db, 'storage_files')));
      const dataFiles = snapFiles.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => !d.isDeleted);
      dataFiles.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAllStorageFiles(dataFiles);
    } catch (error) {
      console.error("Error fetching all storage files:", error);
    }
  };

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

  const refreshItems = () => {
    fetchItems(currentFolder);
    fetchAllStorageFiles();
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
      refreshItems();
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
        refreshItems();
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
        
        fileUrl = await uploadFileToS3(file, (progress) => {
          setUploadProgress(`tệp ${i + 1}/${selectedFiles.length} (${progress}%)`);
        });

        const newFile = {
          name: file.name,
          url: fileUrl,
          type: file.type || 'unknown',
          size: file.size,
          folderId: currentFolder ? currentFolder.id : "root",
          isPublic: false,
          allowDownload: false,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'storage_files'), newFile);
        successCount++;
      }
      
      toast.success(`Đã tải lên thành công ${successCount} tệp!`);
      refreshItems();
    } catch (error) {
      console.error(error);
      toast.error(`Lỗi: ${error.message}. Đã tải lên ${successCount}/${selectedFiles.length} tệp.`);
      refreshItems();
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
        refreshItems();
      } catch {
        toast.error("Lỗi xóa file");
      }
    }
  };

  const handleRestoreFile = async (id) => {
    try {
      await updateDoc(doc(db, 'storage_files', id), { isDeleted: false, deletedAt: null });
      toast.success("Đã khôi phục file!");
      refreshItems();
    } catch {
      toast.error("Lỗi khôi phục file");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm("Xóa vĩnh viễn file này? Không thể khôi phục!")) {
      try {
        await deleteDoc(doc(db, 'storage_files', id));
        toast.success("Đã xóa vĩnh viễn!");
        refreshItems();
      } catch {
        toast.error("Lỗi xóa file");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredFiles.map(f => f.id));
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
  
  const isShareableMedia = (file) =>
    file?.type?.startsWith('image/') || file?.type?.startsWith('video/');

  const getShareUrl = (fileId) => `${SITE_URL}/xem/${fileId}`;

  const enablePublicShare = async (file) => {
    if (!isShareableMedia(file)) {
      throw new Error('Chỉ có thể chia sẻ ảnh hoặc video.');
    }

    if (!file.isPublic) {
      await updateDoc(doc(db, 'storage_files', file.id), {
        isPublic: true,
        sharedAt: serverTimestamp(),
      });
    }
  };

  const handleCopyShareLink = async (file) => {
    try {
      await enablePublicShare(file);
      await navigator.clipboard.writeText(getShareUrl(file.id));
      toast.success(file.isPublic ? 'Đã sao chép link xem!' : 'Đã bật chia sẻ và sao chép link xem!');
      refreshItems();
    } catch (error) {
      toast.error(error.message || 'Không thể tạo link xem.');
    }
  };

  const handleDisablePublicShare = async (file) => {
    try {
      await updateDoc(doc(db, 'storage_files', file.id), {
        isPublic: false,
        sharedAt: null,
      });
      toast.success('Đã tắt chia sẻ công khai.');
      refreshItems();
    } catch {
      toast.error('Không thể tắt chia sẻ.');
    }
  };

  const handleToggleVideoDownload = async (file) => {
    if (!file?.type?.startsWith('video/')) return;

    const nextAllowDownload = !file.allowDownload;
    try {
      await updateDoc(doc(db, 'storage_files', file.id), {
        allowDownload: nextAllowDownload,
      });
      toast.success(nextAllowDownload ? 'Đã bật tải video.' : 'Đã tắt tải video.');
      refreshItems();
    } catch {
      toast.error('Không thể cập nhật quyền tải video.');
    }
  };

  const handleBulkCopyLinks = async () => {
    const shareableFiles = selectedFiles.filter(isShareableMedia);
    const skippedCount = selectedFiles.length - shareableFiles.length;

    if (!shareableFiles.length) {
      toast.error('Không có ảnh hoặc video nào để chia sẻ.');
      return;
    }

    try {
      await Promise.all(shareableFiles.map(enablePublicShare));
      const links = shareableFiles.map(file => getShareUrl(file.id)).join('\n');
      await navigator.clipboard.writeText(links);
      toast.success(
        skippedCount > 0
          ? `Đã sao chép ${shareableFiles.length} link xem, bỏ qua ${skippedCount} file.`
          : `Đã sao chép ${shareableFiles.length} link xem!`
      );
      refreshItems();
    } catch {
      toast.error('Không thể tạo danh sách link xem.');
    }
  };

  const handleBulkSoftDelete = async () => {
     if (window.confirm(`Chuyển ${selectedItems.length} mục vào thùng rác?`)) {
       try {
         for (const id of selectedItems) {
            await updateDoc(doc(db, 'storage_files', id), { isDeleted: true, deletedAt: serverTimestamp() });
         }
         toast.success("Đã chuyển vào thùng rác");
         refreshItems();
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
       refreshItems();
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
      refreshItems();
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

  const handleBulkDownload = () => {
    selectedFiles.forEach(file => window.open(file.url, '_blank', 'noreferrer'));
  };

  const handleBulkRename = () => {
    if (selectedFiles.length !== 1) {
      toast.error('Chỉ đổi tên được 1 file mỗi lần.');
      return;
    }
    setEditingFileId(selectedFiles[0].id);
    setEditingFileName(selectedFiles[0].name);
  };

  const resetFolderPath = () => {
    setFolderPath([]);
    setCurrentFolder(null);
  };

  const openFolder = (folder) => {
    setFolderPath(prev => [...prev, folder]);
    setCurrentFolder(folder);
  };

  const goBackFolder = () => {
    const nextPath = folderPath.slice(0, -1);
    setFolderPath(nextPath);
    setCurrentFolder(nextPath[nextPath.length - 1] || null);
  };

  const goToFolderPathIndex = (index) => {
    const nextPath = folderPath.slice(0, index + 1);
    setFolderPath(nextPath);
    setCurrentFolder(nextPath[nextPath.length - 1] || null);
  };

  const getFileExtension = (name = '') => {
    const parts = String(name).split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : 'khác';
  };

  const getStorageCategory = (file) => {
    const type = file.type || '';
    const extension = getFileExtension(file.name);
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(extension)) return 'document';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
    return 'other';
  };

  const getItemDate = (item) => item.createdAt?.toDate ? item.createdAt.toDate() : null;

  const formatUpdatedAt = (item) => {
    const date = getItemDate(item);
    if (!date) return '-';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type = '') => {
    if (type.startsWith('image/')) return 'Hình ảnh';
    if (type.startsWith('video/')) return 'Video';
    const extension = type.split('/')[1];
    return extension ? extension.toUpperCase() : 'Khác';
  };

  const matchesDateFilter = (item) => {
    if (dateFilter === 'all') return true;
    const date = getItemDate(item);
    if (!date) return false;
    const now = new Date();
    const ageMs = now.getTime() - date.getTime();
    if (dateFilter === 'today') return date.toDateString() === now.toDateString();
    if (dateFilter === 'week') return ageMs <= 7 * 24 * 60 * 60 * 1000;
    if (dateFilter === 'month') return ageMs <= 30 * 24 * 60 * 60 * 1000;
    return true;
  };

  const matchesSizeFilter = (file) => {
    if (sizeFilter === 'all') return true;
    const size = file.size || 0;
    if (sizeFilter === 'small') return size < 1024 * 1024;
    if (sizeFilter === 'medium') return size >= 1024 * 1024 && size < 50 * 1024 * 1024;
    if (sizeFilter === 'large') return size >= 50 * 1024 * 1024;
    return true;
  };

  const matchesFormatFilter = (file) => {
    if (formatFilter === 'all') return true;
    return getFileExtension(file.name) === formatFilter;
  };

  const categoryCounts = allStorageFiles.reduce((counts, file) => {
    const category = getStorageCategory(file);
    return { ...counts, [category]: (counts[category] || 0) + 1 };
  }, {});

  const fileSource = viewMode === 'storage' && activeCategory !== 'all'
    ? allStorageFiles
    : files;
  const fileExtensions = Array.from(new Set(fileSource.map(file => getFileExtension(file.name)))).sort();
  const filteredFolders = viewMode === 'storage' && activeCategory === 'all' && ['all', 'folders'].includes(typeFilter)
    ? folders.filter(matchesDateFilter)
    : [];
  const filteredFiles = fileSource.filter(file => {
    if (typeFilter === 'folders') return false;
    if (activeCategory !== 'all' && getStorageCategory(file) !== activeCategory) return false;
    return matchesDateFilter(file) && matchesSizeFilter(file) && matchesFormatFilter(file);
  });
  const totalVisibleItems = filteredFolders.length + filteredFiles.length;
  const selectedFiles = fileSource.filter(f => selectedItems.includes(f.id));
  const usedBytes = allStorageFiles.reduce((total, file) => total + (file.size || 0), 0);
  const storageLimitBytes = 500 * 1024 * 1024 * 1024;
  const usedPercent = Math.min(100, Math.round((usedBytes / storageLimitBytes) * 100));
  const hasActiveFilters = typeFilter !== 'all' || formatFilter !== 'all' || sizeFilter !== 'all' || dateFilter !== 'all';

  const resetFilters = () => {
    setTypeFilter('all');
    setFormatFilter('all');
    setSizeFilter('all');
    setDateFilter('all');
  };

  const handleSelectCategory = (categoryKey) => {
    setViewMode('storage');
    setActiveCategory(categoryKey);
    resetFolderPath();
    setTypeFilter(categoryKey === 'all' ? 'all' : 'files');
    setSelectedItems([]);
  };

  const storageCategories = [
    { key: 'all', label: 'Tất cả kho lưu trữ', count: folders.length + allStorageFiles.length, icon: FolderIcon },
    { key: 'image', label: 'Hình ảnh', count: categoryCounts.image || 0, icon: ImageIcon },
    { key: 'video', label: 'Video', count: categoryCounts.video || 0, icon: Video },
    { key: 'document', label: 'Tài liệu', count: categoryCounts.document || 0, icon: FileText },
    { key: 'archive', label: 'File nén', count: categoryCounts.archive || 0, icon: Package },
    { key: 'other', label: 'Khác', count: categoryCounts.other || 0, icon: File },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secret-wax text-white shadow-sm shadow-red-900/20">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kho Lưu Trữ</h1>
            <p className="text-sm text-slate-500">Quản lý và sắp xếp hình ảnh, video, tài liệu</p>
          </div>
        </div>
        {viewMode === 'storage' && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-secret-wax hover:text-secret-wax"
            >
              <Plus className="h-4 w-4" />
              Thư mục mới
            </button>
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                disabled={isUploading}
              />
              <button className="relative z-0 flex items-center gap-2 rounded-lg bg-secret-wax px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-secret-ink disabled:opacity-50">
                <Upload className="h-4 w-4" />
                {isUploading ? `Đang tải ${typeof uploadProgress === 'number' ? uploadProgress + '%' : uploadProgress}` : 'Tải file lên'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-8 border-b border-slate-200">
        <button
          onClick={() => { resetFolderPath(); handleSelectCategory('all'); }}
          className={`pb-3 text-sm font-semibold transition ${viewMode === 'storage' ? 'border-b-2 border-secret-wax text-secret-wax' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Tất cả kho lưu trữ
        </button>
        <button
          onClick={() => { setViewMode('trash'); resetFolderPath(); setActiveCategory('all'); setTypeFilter('all'); setSelectedItems([]); }}
          className={`pb-3 text-sm font-semibold transition ${viewMode === 'trash' ? 'border-b-2 border-secret-wax text-secret-wax' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Thùng rác
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <button onClick={resetFolderPath} className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-secret-wax">
          <Home className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <button onClick={resetFolderPath} className="font-medium transition hover:text-secret-wax">
          Tất cả kho lưu trữ
        </button>
        {viewMode === 'storage' && folderPath.map((folder, index) => (
          <span key={folder.id} className="inline-flex min-w-0 items-center gap-2">
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            <button
              onClick={() => goToFolderPathIndex(index)}
              className={`max-w-[220px] truncate font-medium transition ${index === folderPath.length - 1 ? 'text-secret-wax' : 'text-slate-500 hover:text-secret-wax'}`}
              title={folder.name}
            >
              {folder.name}
            </button>
          </span>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-secret-wax">
              <option value="all">Loại: Tất cả</option>
              <option value="folders">Loại: Thư mục</option>
              <option value="files">Loại: File</option>
            </select>
            <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-secret-wax">
              <option value="all">Định dạng: Tất cả</option>
              {fileExtensions.map(extension => (
                <option key={extension} value={extension}>Định dạng: {extension.toUpperCase()}</option>
              ))}
            </select>
            <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-secret-wax">
              <option value="all">Kích thước: Tất cả</option>
              <option value="small">Dưới 1 MB</option>
              <option value="medium">1 MB - 50 MB</option>
              <option value="large">Trên 50 MB</option>
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-secret-wax">
              <option value="all">Ngày cập nhật: Mọi thời điểm</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày gần đây</option>
              <option value="month">30 ngày gần đây</option>
            </select>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-secret-wax hover:text-secret-wax">
                Xóa bộ lọc
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
              Mới nhất
            </button>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button onClick={() => setDisplayMode('list')} className={`rounded-md p-2 transition ${displayMode === 'list' ? 'bg-white text-secret-wax shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} title="Dạng danh sách">
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setDisplayMode('grid')} className={`rounded-md p-2 transition ${displayMode === 'grid' ? 'bg-white text-secret-wax shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} title="Dạng lưới">
                <Grid2X2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-[560px] grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="flex flex-col border-b border-slate-100 bg-white p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Danh mục</h2>
              <button onClick={() => setIsCreatingFolder(true)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-secret-wax hover:text-secret-wax">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {storageCategories.map(category => {
                const CategoryIcon = category.icon;
                const isActive = viewMode === 'storage' && activeCategory === category.key;
                return (
                  <button
                    key={category.key}
                    onClick={() => handleSelectCategory(category.key)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-red-50 text-secret-wax ring-1 ring-red-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <span className="flex items-center gap-3">
                      <CategoryIcon className={`h-4 w-4 ${category.key === 'all' ? '' : 'text-amber-500'}`} />
                      <span className="font-semibold">{category.label}</span>
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{category.count}</span>
                  </button>
                );
              })}
              <button
                onClick={() => { setViewMode('trash'); resetFolderPath(); setActiveCategory('all'); setTypeFilter('all'); setSelectedItems([]); }}
                className={`mt-4 flex w-full items-center justify-between border-t border-slate-100 px-3 py-3 text-sm transition ${viewMode === 'trash' ? 'text-secret-wax' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <span className="flex items-center gap-3 font-semibold">
                  <Trash2 className="h-4 w-4" />
                  Thùng rác
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{viewMode === 'trash' ? files.length : 0}</span>
              </button>
            </div>

            <div className="mt-auto rounded-lg border border-amber-100 bg-amber-50/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dung lượng lưu trữ</p>
              <p className="mt-3 text-sm font-bold text-slate-900">{formatSize(usedBytes)} <span className="font-medium text-slate-500">/ 500 GB</span></p>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-secret-wax" style={{ width: `${usedPercent}%` }} />
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            {isCreatingFolder && viewMode === 'storage' && (
              <form onSubmit={handleCreateFolder} className="m-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <FolderIcon className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Tên thư mục mới..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button type="submit" className="rounded-lg bg-secret-wax px-3 py-1.5 text-sm font-semibold text-white">Lưu</button>
                <button type="button" onClick={() => setIsCreatingFolder(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-white">Hủy</button>
              </form>
            )}

            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
              {selectedItems.length > 0 && viewMode === 'storage' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input type="checkbox" onChange={toggleSelectAll} checked={filteredFiles.length > 0 && selectedItems.length === filteredFiles.length} className="h-4 w-4 rounded border-slate-300 text-secret-wax focus:ring-secret-wax" />
                    Đã chọn {selectedFiles.length} mục
                  </label>
                  <button onClick={handleBulkCopyLinks} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-secret-wax"><Share2 className="h-4 w-4" /> Chia sẻ</button>
                  <button onClick={handleBulkDownload} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-secret-wax"><Download className="h-4 w-4" /> Tải xuống</button>
                  <button onClick={handleOpenMoveModal} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-secret-wax"><MoveRight className="h-4 w-4" /> Di chuyển</button>
                  <button onClick={handleBulkRename} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-secret-wax"><Edit2 className="h-4 w-4" /> Đổi tên</button>
                  <button onClick={handleBulkSoftDelete} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-red-600"><Trash2 className="h-4 w-4" /> Xóa</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input type="checkbox" onChange={toggleSelectAll} checked={filteredFiles.length > 0 && selectedItems.length === filteredFiles.length} className="h-4 w-4 rounded border-slate-300 text-secret-wax focus:ring-secret-wax" />
                  {totalVisibleItems} mục
                </label>
              )}
              <button className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-secret-wax" title="Tùy chọn">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {displayMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="w-12 px-4 py-3"></th>
                      <th className="px-4 py-3">Tên</th>
                      <th className="px-4 py-3">Loại</th>
                      <th className="px-4 py-3">Kích thước</th>
                      <th className="px-4 py-3">Số lượng</th>
                      <th className="px-4 py-3">Cập nhật</th>
                      <th className="px-4 py-3 text-right">...</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentFolder && viewMode === 'storage' && (
                      <tr onClick={goBackFolder} className="cursor-pointer hover:bg-slate-50">
                        <td className="px-4 py-4"></td>
                        <td className="px-4 py-4" colSpan="6">
                          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                            <FolderIcon className="h-5 w-5" />
                            .. (Quay lại)
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredFolders.map(folder => (
                      <tr key={folder.id} onClick={() => openFolder(folder)} className="group cursor-pointer hover:bg-slate-50">
                        <td className="px-4 py-4"></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                              <FolderIcon className="h-5 w-5 fill-current opacity-30" />
                            </div>
                            <span className="font-semibold text-slate-900">{folder.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Thư mục</span></td>
                        <td className="px-4 py-4 text-slate-500">1 file</td>
                        <td className="px-4 py-4 text-slate-600">-</td>
                        <td className="px-4 py-4 text-slate-500">{formatUpdatedAt(folder)}</td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" title="Xóa thư mục">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredFiles.map(file => (
                      <tr
                        key={file.id}
                        className={`transition hover:bg-slate-50 ${selectedItems.includes(file.id) ? 'bg-red-50/70' : ''} ${isDragging ? 'cursor-row-resize' : ''}`}
                        onMouseDown={(e) => viewMode === 'storage' && handleRowMouseDown(e, file.id)}
                        onMouseEnter={() => viewMode === 'storage' && handleRowMouseEnter(file.id)}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          {viewMode === 'storage' && (
                            <input type="checkbox" checked={selectedItems.includes(file.id)} onChange={(e) => handleSelectItem(file.id, e)} className="h-4 w-4 rounded border-slate-300 text-secret-wax focus:ring-secret-wax" />
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {file.type.startsWith('image/') ? (
                              <img src={file.url} alt={file.name} className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-slate-100 object-cover" onClick={() => setPreviewFile(file)} />
                            ) : file.type.startsWith('video/') ? (
                              <div className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-black" onClick={() => setPreviewFile(file)}>
                                <video src={`${file.url}#t=0.1`} className="h-full w-full object-cover" preload="metadata" />
                                <Video className="absolute h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                                <File className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              {editingFileId === file.id ? (
                                <div className="flex items-center gap-2">
                                  <input type="text" value={editingFileName} onChange={(e) => setEditingFileName(e.target.value)} autoFocus className="w-56 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-secret-wax" />
                                  <button onClick={() => handleRenameFile(file)} className="rounded-md bg-green-50 p-1.5 text-green-600"><Check className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => setEditingFileId(null)} className="rounded-md bg-slate-100 p-1.5 text-slate-500"><X className="h-3.5 w-3.5" /></button>
                                </div>
                              ) : (
                                <p className="truncate font-semibold text-slate-900" title={file.name}>{file.name}</p>
                              )}
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <p className="text-xs text-slate-500">{getFileExtension(file.name).toUpperCase()}</p>
                                {file.isPublic && isShareableMedia(file) && (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                    Đang chia sẻ
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{getTypeLabel(file.type)}</span></td>
                        <td className="px-4 py-4 text-slate-600">{formatSize(file.size)}</td>
                        <td className="px-4 py-4 text-slate-500">-</td>
                        <td className="px-4 py-4 text-slate-500">{formatUpdatedAt(file)}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {viewMode === 'trash' ? (
                              <>
                                <button onClick={() => handleRestoreFile(file.id)} className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600" title="Khôi phục"><ArchiveRestore className="h-4 w-4" /></button>
                                <button onClick={() => handlePermanentDelete(file.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Xóa vĩnh viễn"><Trash2 className="h-4 w-4" /></button>
                              </>
                            ) : (
                              <>
                                {(file.type.startsWith('image/') || file.type.startsWith('video/')) && <button onClick={() => setPreviewFile(file)} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Xem trước"><Eye className="h-4 w-4" /></button>}
                                <a href={file.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Mở file"><ExternalLink className="h-4 w-4" /></a>
                                {isShareableMedia(file) && <button onClick={() => handleCopyShareLink(file)} className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="Copy link xem"><Share2 className="h-4 w-4" /></button>}
                                <button onClick={() => copyToClipboard(file.url)} className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600" title="Copy link file S3"><Copy className="h-4 w-4" /></button>
                                {file.type.startsWith('video/') && <button onClick={() => handleToggleVideoDownload(file)} className={`rounded-lg p-2 transition ${file.allowDownload ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`} title={file.allowDownload ? 'Tắt tải video' : 'Bật tải video'}><Download className="h-4 w-4" /></button>}
                                {file.isPublic && isShareableMedia(file) && <button onClick={() => handleDisablePublicShare(file)} className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600" title="Tắt chia sẻ"><Link2Off className="h-4 w-4" /></button>}
                                <button onClick={() => handleDelete(file.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Xóa vào thùng rác"><MoreHorizontal className="h-4 w-4" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {totalVisibleItems === 0 && (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-sm text-slate-500">
                          {viewMode === 'storage' ? 'Chưa có mục nào phù hợp.' : 'Thùng rác trống.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {currentFolder && viewMode === 'storage' && (
                  <button onClick={goBackFolder} className="flex min-h-[150px] flex-col items-start justify-between rounded-lg border border-dashed border-slate-200 p-4 text-left text-slate-500 transition hover:border-secret-wax hover:text-secret-wax">
                    <FolderIcon className="h-8 w-8" />
                    <span className="font-semibold">.. (Quay lại)</span>
                  </button>
                )}
                {filteredFolders.map(folder => (
                  <div key={folder.id} onClick={() => openFolder(folder)} className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-secret-wax">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-500"><FolderIcon className="h-6 w-6 fill-current opacity-30" /></div>
                      <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                    <p className="mt-4 truncate font-semibold text-slate-900">{folder.name}</p>
                    <p className="mt-1 text-xs text-slate-500">Thư mục · {formatUpdatedAt(folder)}</p>
                  </div>
                ))}
                {filteredFiles.map(file => (
                  <div key={file.id} className={`group rounded-lg border bg-white p-4 shadow-sm transition hover:border-secret-wax ${selectedItems.includes(file.id) ? 'border-secret-wax bg-red-50/60' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      {viewMode === 'storage' && <input type="checkbox" checked={selectedItems.includes(file.id)} onChange={(e) => handleSelectItem(file.id, e)} className="h-4 w-4 rounded border-slate-300 text-secret-wax focus:ring-secret-wax" />}
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-secret-wax"><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-3 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                      {file.type.startsWith('image/') ? (
                        <img src={file.url} alt={file.name} className="h-full w-full cursor-pointer object-cover" onClick={() => setPreviewFile(file)} />
                      ) : file.type.startsWith('video/') ? (
                        <video src={`${file.url}#t=0.1`} className="h-full w-full cursor-pointer object-cover" preload="metadata" onClick={() => setPreviewFile(file)} />
                      ) : (
                        <File className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    <div className="mt-3 flex min-w-0 items-center gap-2">
                      <p className="min-w-0 flex-1 truncate font-semibold text-slate-900" title={file.name}>{file.name}</p>
                      {file.isPublic && isShareableMedia(file) && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" title="Đang chia sẻ" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{getTypeLabel(file.type)}</span>
                      <span>{formatSize(file.size)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {(file.type.startsWith('image/') || file.type.startsWith('video/')) && <button onClick={() => setPreviewFile(file)} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"><Eye className="h-4 w-4" /></button>}
                      <a href={file.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><ExternalLink className="h-4 w-4" /></a>
                      {isShareableMedia(file) && <button onClick={() => handleCopyShareLink(file)} className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="Copy link xem"><Share2 className="h-4 w-4" /></button>}
                      <button onClick={() => copyToClipboard(file.url)} className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600" title="Copy link file S3"><Copy className="h-4 w-4" /></button>
                      {file.type.startsWith('video/') && <button onClick={() => handleToggleVideoDownload(file)} className={`rounded-lg p-2 transition ${file.allowDownload ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`} title={file.allowDownload ? 'Tắt tải video' : 'Bật tải video'}><Download className="h-4 w-4" /></button>}
                      {file.isPublic && isShareableMedia(file) && <button onClick={() => handleDisablePublicShare(file)} className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600" title="Tắt chia sẻ"><Link2Off className="h-4 w-4" /></button>}
                      {viewMode === 'trash' ? (
                        <button onClick={() => handleRestoreFile(file.id)} className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600"><ArchiveRestore className="h-4 w-4" /></button>
                      ) : (
                        <button onClick={() => handleDelete(file.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </div>
                ))}
                {totalVisibleItems === 0 && (
                  <div className="col-span-full py-12 text-center text-sm text-slate-500">
                    {viewMode === 'storage' ? 'Chưa có mục nào phù hợp.' : 'Thùng rác trống.'}
                  </div>
                )}
              </div>
            )}
          </section>
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
