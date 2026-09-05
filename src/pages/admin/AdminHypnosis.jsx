import { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Headphones, 
    Play, 
    Pause, 
    Plus, 
    Trash2, 
    Edit2, 
    Search, 
    Upload, 
    Clock, 
    ExternalLink, 
    Check, 
    X, 
    Sparkles, 
    Radio, 
    Activity, 
    Calendar, 
    Lock, 
    Unlock, 
    Coins, 
    Moon, 
    HeartHandshake, 
    Crown, 
    AlertTriangle, 
    HelpCircle, 
    CheckCircle2, 
    RefreshCw, 
    FileAudio, 
    Image as ImageIcon,
    Copy,
    Eye,
    User,
    Award,
    Percent,
    Tag
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../../firebase';
import { uploadFileToS3 } from '../../utils/s3UploadService';
import { uploadVideoToBunny } from '../../utils/bunnyStreamService';
import { HYPNOSIS_CATEGORIES, INITIAL_TRACKS, DEFAULT_HYPNOSIS_EXPERTS } from '../../data/hypnosisTracksData';

const DEFAULT_FORM_DATA = {
    id: '',
    title: '',
    benefit: '',
    category: 'wealth',
    segment: 'Tiền bạc & Thịnh vượng',
    isFree: false,
    price: '199.000đ',
    originalPrice: '499.000đ',
    duration: '30:00',
    durationSec: 1800,
    listens: 12500,
    authorId: 'coach-mong',
    author: 'Master Coach Mong',
    authorTitle: 'Chuyên gia Trị liệu Tiềm thức & Sáng lập Mali Edu',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    authorBio: 'Nhà sáng lập Mali Edu. Chuyên gia có nhiều năm kinh nghiệm nghiên cứu Thôi miên Trị liệu (Hypnotherapy) và Lập trình Ngôn ngữ Tư duy (NLP), đã giúp đỡ hàng ngàn học viên khơi thông dòng tiền và chữa lành nội tâm.',
    isAffiliateEnabled: true,
    affiliateCommissionType: 'percent', // 'percent' | 'fixed'
    affiliateCommissionPercent: '',
    affiliateCommissionAmount: '',
    affiliateBuyerDiscountPercent: '',
    affiliateBuyerVoucherText: '',
    coverImageSquare: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&h=600&q=80',
    coverImageBanner: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&h=675&q=80',
    coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
    audioUrl: '',
    audioProvider: 'bunny', // 'bunny', 'url'
    brainwave: 'Sóng não Theta (5.5Hz) & Tần số Solfeggio 888Hz',
    frequency: '888Hz Tần số kích hoạt may mắn & tài lộc dồi dào',
    recommendedCycle: 'Nghe liên tục 21 đêm trước khi ngủ',
    bestTime: '15 - 30 phút trước khi chìm vào giấc ngủ đêm',
    audioQuality: '320kbps Studio Lossless (Không nén)',
    targetAudience: 'Người kinh doanh, người hay lo lắng về tiền bạc, muốn mở rộng dung lượng tài chính.',
    effects: [
        'Cài đặt tư duy thịnh vượng vào tầng tiềm thức sâu nhất mỗi đêm khi ngủ.',
        'Xóa bỏ nỗi sợ vô thức về nợ nần, thiếu thốn và rào cản tài chính từ quá khứ.',
        'Đưa hệ thần kinh từ căng thẳng (Beta) sang thư giãn sâu (Theta), giúp ngủ ngon không mộng mị.'
    ],
    howToUse: [
        { step: 'Bước 1: Đeo tai nghe stereo', desc: 'Đeo tai nghe 2 bên để công nghệ sóng não (Binaural Beats) tác động đồng pha vào hai bán cầu não.' },
        { step: 'Bước 2: Nằm thả lỏng trên giường', desc: 'Chọn tư thế nằm thoải mái nhất, ánh sáng dịu hoặc tắt đèn, hít sâu thở chậm 3 nhịp.' },
        { step: 'Bước 3: Để tâm trí trôi theo giọng dẫn', desc: 'Không cần cố gắng phân tích câu từ. Hãy buông lỏng toàn thân để giọng dẫn của Coach Mong đưa bạn vào giấc ngủ.' }
    ],
    precautions: [
        '⚠️ TUYỆT ĐỐI KHÔNG nghe khi đang lái xe hoặc vận hành máy móc thiết bị nguy hiểm.',
        'Nếu bạn ngủ quên trong lúc nghe: Đây là hiện tượng hoàn toàn tự nhiên và rất tốt, tiềm thức vẫn hấp thu 100% ám thị.',
        'Chỉnh âm lượng vừa phải (40% - 60%), không nghe quá to.'
    ]
};

export default function AdminHypnosis() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedExpertFilter, setSelectedExpertFilter] = useState('all');
    const [instructors, setInstructors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [activeFormTab, setActiveFormTab] = useState('media'); // 'media', 'basic', 'specs', 'guide'
    
    // Audio preview inside list
    const [playingTrackId, setPlayingTrackId] = useState(null);
    const listAudioRef = useRef(null);

    // Upload state
    const [audioUploadProgress, setAudioUploadProgress] = useState(null);
    const [squareImageUploadProgress, setSquareImageUploadProgress] = useState(null);
    const [bannerImageUploadProgress, setBannerImageUploadProgress] = useState(null);
    const [isSeeding, setIsSeeding] = useState(false);

    // Combine DEFAULT_HYPNOSIS_EXPERTS with Firestore instructors
    const combinedExperts = useMemo(() => {
        const list = [...DEFAULT_HYPNOSIS_EXPERTS];
        instructors.forEach(inst => {
            if (!list.some(e => e.name.toLowerCase() === inst.name?.toLowerCase())) {
                list.push({
                    id: inst.id,
                    name: inst.name,
                    title: inst.title || 'Chuyên gia Mali Edu',
                    role: inst.title || 'Chuyên gia Mali Edu',
                    avatar: inst.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                    bio: inst.bio || 'Chuyên gia chia sẻ và đồng hành tại Mali Edu.'
                });
            }
        });
        return list;
    }, [instructors]);

    // Fetch instructors from Firestore
    const fetchInstructors = async () => {
        try {
            const q = query(collection(db, 'instructors'), orderBy('name', 'asc'));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setInstructors(loaded);
            }
        } catch (err) {
            console.warn('Could not load instructors:', err);
        }
    };

    // Fetch tracks from Firestore
    const fetchTracks = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'hypnosis_audios'));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setTracks(loaded);
            } else {
                setTracks([]);
            }
        } catch (err) {
            console.error('Error fetching tracks:', err);
            toast.error('Lỗi khi tải danh sách bản thôi miên');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTracks();
        fetchInstructors();
    }, []);

    // 1-Click Seed initial tracks if empty
    const handleSeedInitialTracks = async () => {
        if (tracks.length > 0) {
            if (!window.confirm('Hiện tại đã có bản ghi trong CSDL. Bạn có chắc muốn nạp thêm 7 bản mẫu chuẩn không?')) return;
        }
        setIsSeeding(true);
        try {
            for (const item of INITIAL_TRACKS) {
                await setDoc(doc(db, 'hypnosis_audios', item.id), {
                    ...item,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
            toast.success('🎉 Đã đồng bộ thành công các bản thôi miên mẫu vào CSDL!');
            await fetchTracks();
        } catch (err) {
            console.error('Seed error:', err);
            toast.error(`Lỗi đồng bộ: ${err.message}`);
        } finally {
            setIsSeeding(false);
        }
    };

    // Delete track
    const handleDeleteTrack = async (id, title) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bản thôi miên "${title}" không?`)) return;
        try {
            await deleteDoc(doc(db, 'hypnosis_audios', id));
            toast.success(`Đã xóa "${title}" thành công!`);
            setTracks(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            toast.error(`Lỗi khi xóa: ${err.message}`);
        }
    };

    // Open Modal for Create
    const handleOpenCreate = () => {
        setIsEditing(false);
        setFormData({
            ...DEFAULT_FORM_DATA,
            id: `tm-${Date.now()}`,
            effects: [...DEFAULT_FORM_DATA.effects],
            howToUse: [...DEFAULT_FORM_DATA.howToUse],
            precautions: [...DEFAULT_FORM_DATA.precautions]
        });
        setActiveFormTab('media');
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const handleOpenEdit = (track) => {
        setIsEditing(true);
        setFormData({
            ...DEFAULT_FORM_DATA,
            ...track,
            authorId: track.authorId || '',
            author: track.author || 'Master Coach Mong',
            authorTitle: track.authorTitle || '',
            authorAvatar: track.authorAvatar || '',
            authorBio: track.authorBio || '',
            isAffiliateEnabled: track.isAffiliateEnabled !== false,
            affiliateCommissionType: track.affiliateCommissionType || 'percent',
            affiliateCommissionPercent: track.affiliateCommissionPercent != null ? String(track.affiliateCommissionPercent) : '',
            affiliateCommissionAmount: track.affiliateCommissionAmount != null ? String(track.affiliateCommissionAmount) : '',
            affiliateBuyerDiscountPercent: track.affiliateBuyerDiscountPercent != null ? String(track.affiliateBuyerDiscountPercent) : '',
            affiliateBuyerVoucherText: track.affiliateBuyerVoucherText || '',
            coverImageSquare: track.coverImageSquare || track.coverImage || '',
            coverImageBanner: track.coverImageBanner || track.coverImage || '',
            coverImage: track.coverImageSquare || track.coverImage || '',
            effects: Array.isArray(track.effects) && track.effects.length > 0 ? [...track.effects] : [...DEFAULT_FORM_DATA.effects],
            howToUse: Array.isArray(track.howToUse) && track.howToUse.length > 0 ? [...track.howToUse] : [...DEFAULT_FORM_DATA.howToUse],
            precautions: Array.isArray(track.precautions) && track.precautions.length > 0 ? [...track.precautions] : [...DEFAULT_FORM_DATA.precautions]
        });
        setActiveFormTab('media');
        setIsModalOpen(true);
    };

    // Handle Audio File selection & duration parsing
    const handleAudioFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Automatically detect audio duration in browser
        try {
            const tempAudio = document.createElement('audio');
            tempAudio.preload = 'metadata';
            tempAudio.onloadedmetadata = () => {
                window.URL.revokeObjectURL(tempAudio.src);
                const totalSec = Math.floor(tempAudio.duration);
                const mins = Math.floor(totalSec / 60);
                const secs = totalSec % 60;
                setFormData(prev => ({
                    ...prev,
                    duration: `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`,
                    durationSec: totalSec
                }));
            };
            tempAudio.src = URL.createObjectURL(file);
        } catch {
            // Ignore duration parse error
        }

        // Upload to Bunny Cloud
        setAudioUploadProgress(1);
        try {
            const res = await uploadVideoToBunny(file, (percent) => setAudioUploadProgress(percent));
            const videoId = res?.videoId;
            if (!videoId) {
                throw new Error("Không nhận được mã tệp sau khi tải lên Bunny Cloud.");
            }

            // Lưu liên kết phát Bunny Stream (Library ID: 738609)
            const bunnyPlaybackUrl = `https://iframe.mediadelivery.net/embed/738609/${videoId}`;

            setFormData(prev => ({
                ...prev,
                audioUrl: bunnyPlaybackUrl,
                videoId: videoId,
                audioProvider: 'bunny'
            }));
            toast.success(`Tải tệp âm thanh "${file.name}" lên Bunny Cloud thành công!`);
        } catch (err) {
            console.error('Upload audio to Bunny error:', err);
            toast.error(`Lỗi tải lên Bunny Cloud: ${err.message}`);
        } finally {
            setAudioUploadProgress(null);
        }
    };

    // Handle Square Cover Image (1:1) upload
    const handleCoverImageSquareSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSquareImageUploadProgress(1);
        try {
            const publicUrl = await uploadFileToS3(file, (percent) => setSquareImageUploadProgress(percent), { folder: 'hypnosis_covers' });
            setFormData(prev => ({
                ...prev,
                coverImageSquare: publicUrl,
                coverImage: publicUrl
            }));
            toast.success(`Tải ảnh bìa vuông 1:1 "${file.name}" thành công!`);
        } catch (err) {
            toast.error(`Lỗi tải ảnh vuông: ${err.message}`);
        } finally {
            setSquareImageUploadProgress(null);
        }
    };

    // Handle Banner Cover Image (16:9) upload
    const handleCoverImageBannerSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBannerImageUploadProgress(1);
        try {
            const publicUrl = await uploadFileToS3(file, (percent) => setBannerImageUploadProgress(percent), { folder: 'hypnosis_covers' });
            setFormData(prev => ({
                ...prev,
                coverImageBanner: publicUrl
            }));
            toast.success(`Tải ảnh banner 16:9 "${file.name}" thành công!`);
        } catch (err) {
            toast.error(`Lỗi tải ảnh banner: ${err.message}`);
        } finally {
            setBannerImageUploadProgress(null);
        }
    };

    // Save Track
    const handleSaveTrack = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề bản thôi miên');
            return;
        }

        const trackId = formData.id || `tm-${Date.now()}`;
        const squareImg = formData.coverImageSquare || formData.coverImage || '';
        const bannerImg = formData.coverImageBanner || formData.coverImageSquare || formData.coverImage || '';
        const isAffiliateEnabled = Boolean(formData.isAffiliateEnabled);
        const affType = formData.affiliateCommissionType || 'percent';
        const parsedAffPercent = formData.affiliateCommissionPercent !== "" && formData.affiliateCommissionPercent != null
            ? Number(formData.affiliateCommissionPercent)
            : null;
        const parsedAffAmount = formData.affiliateCommissionAmount !== "" && formData.affiliateCommissionAmount != null
            ? Number(String(formData.affiliateCommissionAmount).replace(/\D/g, ''))
            : null;
        const parsedBuyerDiscount = formData.affiliateBuyerDiscountPercent !== "" && formData.affiliateBuyerDiscountPercent != null
            ? Number(formData.affiliateBuyerDiscountPercent)
            : null;

        const payload = {
            ...formData,
            isAffiliateEnabled,
            affiliateCommissionType: affType,
            affiliateCommissionPercent: parsedAffPercent,
            affiliateCommissionAmount: parsedAffAmount,
            affiliateBuyerDiscountPercent: parsedBuyerDiscount,
            affiliateBuyerVoucherText: formData.affiliateBuyerVoucherText || '',
            coverImageSquare: squareImg,
            coverImageBanner: bannerImg,
            coverImage: squareImg || bannerImg,
            id: trackId,
            updatedAt: serverTimestamp(),
            ...(isEditing ? {} : { createdAt: serverTimestamp() })
        };

        try {
            await setDoc(doc(db, 'hypnosis_audios', trackId), payload, { merge: true });
            toast.success(isEditing ? 'Cập nhật bản thôi miên thành công!' : 'Thêm bản thôi miên mới thành công!');
            setIsModalOpen(false);
            await fetchTracks();
        } catch (err) {
            console.error('Save error:', err);
            toast.error(`Lỗi khi lưu: ${err.message}`);
        }
    };

    // Helper functions for Array items in Form
    const handleAddEffect = () => {
        setFormData(prev => ({
            ...prev,
            effects: [...prev.effects, '']
        }));
    };

    const handleUpdateEffect = (index, value) => {
        setFormData(prev => {
            const next = [...prev.effects];
            next[index] = value;
            return { ...prev, effects: next };
        });
    };

    const handleRemoveEffect = (index) => {
        setFormData(prev => ({
            ...prev,
            effects: prev.effects.filter((_, i) => i !== index)
        }));
    };

    const handleAddHowToUse = () => {
        setFormData(prev => ({
            ...prev,
            howToUse: [...prev.howToUse, { step: `Bước ${prev.howToUse.length + 1}: `, desc: '' }]
        }));
    };

    const handleUpdateHowToUse = (index, field, value) => {
        setFormData(prev => {
            const next = [...prev.howToUse];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, howToUse: next };
        });
    };

    const handleRemoveHowToUse = (index) => {
        setFormData(prev => ({
            ...prev,
            howToUse: prev.howToUse.filter((_, i) => i !== index)
        }));
    };

    const handleAddPrecaution = () => {
        setFormData(prev => ({
            ...prev,
            precautions: [...prev.precautions, '']
        }));
    };

    const handleUpdatePrecaution = (index, value) => {
        setFormData(prev => {
            const next = [...prev.precautions];
            next[index] = value;
            return { ...prev, precautions: next };
        });
    };

    const handleRemovePrecaution = (index) => {
        setFormData(prev => ({
            ...prev,
            precautions: prev.precautions.filter((_, i) => i !== index)
        }));
    };

    // Filter tracks
    const filteredTracks = useMemo(() => {
        return tracks.filter(t => {
            const matchSearch = !searchTerm.trim() || 
                t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.benefit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.segment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.author?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchCat = selectedCategory === 'all' ||
                (selectedCategory === 'free' && t.isFree) ||
                (selectedCategory === 'vip' && t.category === 'vip') ||
                t.category === selectedCategory;

            const matchExpert = selectedExpertFilter === 'all' ||
                (t.author && t.author.trim().toLowerCase() === selectedExpertFilter.toLowerCase()) ||
                (t.authorId && t.authorId === selectedExpertFilter);

            return matchSearch && matchCat && matchExpert;
        });
    }, [tracks, searchTerm, selectedCategory, selectedExpertFilter]);

    // Track statistics
    const stats = useMemo(() => {
        const total = tracks.length;
        const free = tracks.filter(t => t.isFree).length;
        const paid = total - free;
        const totalListens = tracks.reduce((acc, curr) => acc + (Number(curr.listens) || 0), 0);
        return { total, free, paid, totalListens };
    }, [tracks]);

    // Handle play in list
    const toggleListPlay = (track) => {
        const audio = listAudioRef.current;
        if (!audio) return;

        if (playingTrackId === track.id) {
            audio.pause();
            setPlayingTrackId(null);
        } else {
            audio.src = track.audioUrl;
            audio.play().then(() => {
                setPlayingTrackId(track.id);
            }).catch(() => {
                toast.error('Không thể phát file âm thanh này.');
                setPlayingTrackId(null);
            });
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Hidden audio tag for list previews */}
            <audio ref={listAudioRef} onEnded={() => setPlayingTrackId(null)} />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-red-50 text-[#9B2528]">
                            <Headphones className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Quản Lý Thôi Miên & Thiền Định
                        </h1>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
                        Tải file âm thanh, ảnh bìa, chỉnh sửa nội dung ám thị, cấu hình tần số sóng não và phân khúc giá trị.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <a
                        href="/thoi-mien"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem Cửa hàng</span>
                    </a>

                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2.5 rounded-xl bg-[#9B2528] hover:bg-[#7E1E21] text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Thêm Bản Thôi Miên</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Tổng bản ghi</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-emerald-600 block uppercase">Bản 0đ Miễn phí</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">{stats.free}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-amber-600 block uppercase">Bản trả phí</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-600 mt-1 block">{stats.paid}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-blue-600 block uppercase">Tổng lượt nghe</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-600 mt-1 block">{stats.totalListens.toLocaleString()}</span>
                </div>
            </div>

            {/* Empty CSDL notification & Seed Button */}
            {tracks.length === 0 && !loading && (
                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-amber-600 mx-auto" />
                    <h3 className="text-base font-black text-amber-900">
                        Cơ sở dữ liệu Thôi miên trong Firestore đang trống!
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-800 max-w-lg mx-auto">
                        Website hiện đang hiển thị danh sách 7 bản ghi mặc định. Bạn có thể nhấn nút dưới đây để nạp 7 bản ghi này vào Firestore để chỉnh sửa và quản lý ngay.
                    </p>
                    <button
                        onClick={handleSeedInitialTracks}
                        disabled={isSeeding}
                        className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition inline-flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                        <span>{isSeeding ? 'Đang đồng bộ...' : 'Đồng bộ 7 bản ghi mẫu vào CSDL ngay'}</span>
                    </button>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm theo tiêu đề, phân khúc, tác dụng..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:border-[#9B2528] outline-none"
                        />
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                        Hiển thị <span className="text-slate-900 font-black">{filteredTracks.length}</span> / {tracks.length} bản ghi
                    </div>
                </div>

                {/* Filters Row: Categories & Expert Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                    {/* Category Pills */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                        {HYPNOSIS_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                                    selectedCategory === cat.id
                                        ? 'bg-[#9B2528] text-white border-[#9B2528] shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Expert Dropdown Filter */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-purple-600" /> Chuyên gia:
                        </span>
                        <select
                            value={selectedExpertFilter}
                            onChange={(e) => setSelectedExpertFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 outline-none focus:border-purple-500"
                        >
                            <option value="all">Tất cả chuyên gia</option>
                            {combinedExperts.map(exp => (
                                <option key={exp.id} value={exp.name}>
                                    {exp.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tracks List Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-xs text-slate-400">
                        Đang tải danh sách bản thôi miên...
                    </div>
                ) : filteredTracks.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                        <p className="text-sm font-bold text-slate-700">Không tìm thấy bản thôi miên nào</p>
                        <p className="text-xs text-slate-400">Hãy thử tìm với từ khóa khác hoặc bấm Thêm mới.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                    <th className="py-3.5 px-4">Bản thôi miên</th>
                                    <th className="py-3.5 px-4">Chuyên gia</th>
                                    <th className="py-3.5 px-4">Phân khúc / Sóng não</th>
                                    <th className="py-3.5 px-4">Mức phí</th>
                                    <th className="py-3.5 px-4">Thời lượng</th>
                                    <th className="py-3.5 px-4 text-center">Nghe thử</th>
                                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                {filteredTracks.map(track => {
                                    const isThisPlaying = playingTrackId === track.id;

                                    return (
                                        <tr key={track.id} className="hover:bg-slate-50/70 transition">
                                            {/* Thumbnail & Title */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={track.coverImageSquare || track.coverImage}
                                                            alt={track.title}
                                                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                                                        />
                                                        {track.coverImageBanner && (
                                                            <span 
                                                                className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] font-black px-1 py-0.2 rounded shadow-sm"
                                                                title="Đã có banner ngang 16:9"
                                                            >
                                                                16:9
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs sm:max-w-md">
                                                        <h4 className="font-bold text-slate-900 line-clamp-1">
                                                            {track.title}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                            {track.benefit || 'Chưa có mô tả ngắn'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Expert */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={track.authorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'}
                                                        alt={track.author || 'Chuyên gia'}
                                                        className="w-7 h-7 rounded-full object-cover border border-purple-200 shrink-0"
                                                    />
                                                    <div className="min-w-0 max-w-[130px]">
                                                        <p className="font-bold text-slate-800 text-xs truncate">
                                                            {track.author || 'Master Coach Mong'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 truncate">
                                                            {track.authorTitle || 'Chuyên gia'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Segment & Brainwave */}
                                            <td className="py-3 px-4">
                                                <div className="space-y-1">
                                                    <span className="inline-block px-2 py-0.5 rounded-md bg-red-50 text-[#9B2528] text-[10px] font-bold">
                                                        {track.segment || track.category}
                                                    </span>
                                                    <p className="text-[10px] text-slate-500 truncate max-w-[180px]">
                                                        {track.brainwave || 'Chưa cấu hình'}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Price */}
                                            <td className="py-3 px-4">
                                                {track.isFree ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                        <Unlock className="w-3 h-3" /> 0đ Miễn phí
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <span className="font-black text-[#9B2528] text-xs">
                                                            {track.price}
                                                        </span>
                                                        {track.originalPrice && (
                                                            <span className="text-[10px] text-slate-400 line-through block">
                                                                {track.originalPrice}
                                                            </span>
                                                        )}
                                                        {track.isAffiliateEnabled === false ? (
                                                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold">
                                                                Tắt Affiliate
                                                            </span>
                                                        ) : track.affiliateCommissionType === 'fixed' && track.affiliateCommissionAmount ? (
                                                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[9px] font-black border border-amber-200">
                                                                Hoa hồng: {Number(track.affiliateCommissionAmount).toLocaleString('vi-VN')}đ
                                                            </span>
                                                        ) : track.affiliateCommissionPercent != null && track.affiliateCommissionPercent !== "" ? (
                                                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[9px] font-black border border-amber-200">
                                                                Hoa hồng: {track.affiliateCommissionPercent}%
                                                            </span>
                                                        ) : null}
                                                        {track.isAffiliateEnabled !== false && Number(track.affiliateBuyerDiscountPercent) > 0 && (
                                                            <span className="inline-block mt-0.5 ml-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                                                                Voucher: -{track.affiliateBuyerDiscountPercent}%
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Duration & Listens */}
                                            <td className="py-3 px-4">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1 text-[11px] text-slate-600 font-bold">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span>{track.duration || '00:00'}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">
                                                        {track.listens ? `${Number(track.listens).toLocaleString()} lượt` : '0 lượt'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Audio Play Preview */}
                                            <td className="py-3 px-4 text-center">
                                                {track.audioUrl ? (
                                                    <button
                                                        onClick={() => toggleListPlay(track)}
                                                        className={`p-2 rounded-xl transition inline-flex items-center justify-center ${
                                                            isThisPlaying
                                                                ? 'bg-[#9B2528] text-white shadow-md'
                                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                        }`}
                                                        title={isThisPlaying ? "Tạm dừng" : "Nghe thử"}
                                                    >
                                                        {isThisPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600 italic">Chưa có link audio</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEdit(track)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#9B2528] hover:border-[#9B2528] transition"
                                                        title="Chỉnh sửa nội dung & file"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTrack(track.id, track.title)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 transition"
                                                        title="Xóa bài"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-fade-in">
                    <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    {isEditing ? `Chỉnh sửa: ${formData.title}` : 'Thêm Bản Thôi Miên Mới'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Cấu hình tải file âm thanh, ảnh bìa và các thông tin ám thị tiềm thức.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Tabs in Form */}
                        <div className="shrink-0 flex border-b border-slate-200 bg-white px-6 gap-2 pt-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveFormTab('media')}
                                className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                                    activeFormTab === 'media'
                                        ? 'border-[#9B2528] text-[#9B2528]'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <FileAudio className="w-4 h-4" />
                                <span>1. File & Ảnh bìa</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveFormTab('basic')}
                                className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                                    activeFormTab === 'basic'
                                        ? 'border-[#9B2528] text-[#9B2528]'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>2. Thông tin & Mức phí</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveFormTab('specs')}
                                className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                                    activeFormTab === 'specs'
                                        ? 'border-[#9B2528] text-[#9B2528]'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <Radio className="w-4 h-4" />
                                <span>3. Tần số sóng não</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveFormTab('guide')}
                                className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                                    activeFormTab === 'guide'
                                        ? 'border-[#9B2528] text-[#9B2528]'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span>4. Tác dụng & Hướng dẫn</span>
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleSaveTrack} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                            
                            {/* TAB 1: FILE ÂM THANH & ẢNH BÌA */}
                            {activeFormTab === 'media' && (
                                <div className="space-y-6">
                                    {/* Audio Upload Card */}
                                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileAudio className="w-5 h-5 text-[#9B2528]" />
                                                <h4 className="text-sm font-black text-slate-900">
                                                    Tải Lên Tệp Âm Thanh (Bunny Cloud)
                                                </h4>
                                            </div>
                                            <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                                                🐰 Bunny Cloud
                                            </span>
                                        </div>

                                        {/* File Input & Progress */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#9B2528] hover:bg-[#7E1E21] text-white text-xs font-bold transition inline-flex items-center gap-2 shadow-sm">
                                                    <Upload className="w-4 h-4" />
                                                    <span>Chọn tệp tải lên Bunny Cloud</span>
                                                    <input
                                                        type="file"
                                                        accept="audio/*,video/mp4"
                                                        onChange={handleAudioFileSelect}
                                                        className="hidden"
                                                    />
                                                </label>

                                                {audioUploadProgress !== null && (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 animate-pulse">
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                        <span>Đang tải lên Bunny Cloud: {audioUploadProgress}%</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Direct Audio URL input */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-600 block">
                                                    Hoặc dán trực tiếp đường dẫn URL âm thanh từ Bunny Cloud (Stream / CDN):
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.audioUrl}
                                                    onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value, audioProvider: 'bunny' })}
                                                    placeholder="https://... hoặc Video ID Bunny Stream"
                                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-[#9B2528] outline-none"
                                                />
                                                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200/80 flex items-start gap-1.5 leading-relaxed">
                                                    <span className="shrink-0 text-xs">💡</span>
                                                    <span><strong>Hỗ trợ nghe khi tắt màn hình:</strong> Để người dùng có thể khóa màn hình điện thoại / nghe trước khi ngủ mượt mà kèm bảng điều khiển màn hình khóa, khuyến khích sử dụng <strong>đường dẫn tệp âm thanh trực tiếp (.mp3, .m4a, Bunny Storage hoặc CDN)</strong>. Nếu nhúng Iframe Video, hệ điều hành iOS/Android sẽ tự động dừng phát khi tắt màn hình.</span>
                                                </div>
                                            </div>

                                            {/* Audio Player Preview */}
                                            {formData.audioUrl && (
                                                <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                                                    <span className="text-xs font-bold text-slate-700 shrink-0">
                                                        Nghe thử tệp:
                                                    </span>
                                                    {formData.audioUrl.includes('iframe.mediadelivery.net') ? (
                                                        <iframe
                                                            src={formData.audioUrl}
                                                            title="Bunny Preview"
                                                            className="w-full h-12 rounded-lg border-0"
                                                            allow="autoplay"
                                                        />
                                                    ) : (
                                                        <audio controls src={formData.audioUrl} className="w-full h-8" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Duration auto/manual */}
                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 block mb-1">
                                                        Thời lượng hiển thị (phút:giây)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.duration}
                                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                        placeholder="VD: 32:15"
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 block mb-1">
                                                        Thời lượng tính bằng giây
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={formData.durationSec}
                                                        onChange={(e) => setFormData({ ...formData, durationSec: Number(e.target.value) })}
                                                        placeholder="VD: 1935"
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cover Images Upload Card (2 DẠNG: 1:1 VUÔNG & 16:9 BANNER) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="w-5 h-5 text-amber-600" />
                                                <h4 className="text-sm font-black text-slate-900">
                                                    Ảnh Bìa Bản Thôi Miên (2 Dạng Bắt Buộc: Vuông 1:1 & Ngang 16:9)
                                                </h4>
                                            </div>
                                            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                                                Cần 2 ảnh riêng biệt
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {/* 1. Ảnh Vuông (1:1) */}
                                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3.5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-[#9B2528]"></span>
                                                            1. Ảnh Bìa Vuông (Tỉ lệ 1:1)
                                                        </span>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                            Dùng cho Cửa hàng, Danh sách và Mini Player khi nghe
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                                                        1:1 Square
                                                    </span>
                                                </div>

                                                <div className="flex items-start gap-3.5">
                                                    {/* Square Preview */}
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 shadow-sm relative group">
                                                        {formData.coverImageSquare || formData.coverImage ? (
                                                            <img
                                                                src={formData.coverImageSquare || formData.coverImage}
                                                                alt="Square Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px] text-center p-2">
                                                                <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                                                                Chưa có ảnh vuông
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-2.5 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm">
                                                                <Upload className="w-3.5 h-3.5" />
                                                                <span>Tải ảnh vuông từ máy</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleCoverImageSquareSelect}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                            {squareImageUploadProgress !== null && (
                                                                <span className="text-[11px] font-bold text-amber-600 animate-pulse">
                                                                    {squareImageUploadProgress}%
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <input
                                                                type="url"
                                                                value={formData.coverImageSquare || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        coverImageSquare: val,
                                                                        coverImage: val
                                                                    }));
                                                                }}
                                                                placeholder="Hoặc dán URL ảnh vuông 1:1 từ Bunny CDN / Web..."
                                                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 2. Ảnh Banner Ngang (16:9) */}
                                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3.5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                                            2. Ảnh Banner Ngang (Tỉ lệ 16:9)
                                                        </span>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                            Dùng cho Banner đỉnh trong Sheet Chi tiết & Hướng dẫn
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                                                        16:9 Banner
                                                    </span>
                                                </div>

                                                <div className="flex items-start gap-3.5">
                                                    {/* Banner 16:9 Preview */}
                                                    <div className="w-36 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 shadow-sm relative group">
                                                        {formData.coverImageBanner || formData.coverImage ? (
                                                            <img
                                                                src={formData.coverImageBanner || formData.coverImage}
                                                                alt="Banner Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px] text-center p-2">
                                                                <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                                                                Chưa có banner 16:9
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-2.5 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm">
                                                                <Upload className="w-3.5 h-3.5" />
                                                                <span>Tải banner 16:9 từ máy</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleCoverImageBannerSelect}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                            {bannerImageUploadProgress !== null && (
                                                                <span className="text-[11px] font-bold text-blue-600 animate-pulse">
                                                                    {bannerImageUploadProgress}%
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <input
                                                                type="url"
                                                                value={formData.coverImageBanner || ''}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, coverImageBanner: e.target.value }))}
                                                                placeholder="Hoặc dán URL banner 16:9 từ Bunny CDN / Web..."
                                                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: THÔNG TIN CƠ BẢN & GIÁ */}
                            {activeFormTab === 'basic' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Tiêu đề bản thôi miên <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="VD: Thôi Miên Cài Đặt Tiềm Thức Hút Tiền Trong Giấc Ngủ"
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:border-[#9B2528] outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Lợi ích cốt lõi ngắn (1 - 2 dòng hiển thị ở thẻ bài)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.benefit}
                                            onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
                                            placeholder="VD: Cài đặt niềm tin giàu có vào tầng tiềm thức sâu nhất mỗi đêm khi ngủ"
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#9B2528] outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Phân khúc / Thể loại
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => {
                                                    const cat = e.target.value;
                                                    let defaultSeg = 'Thôi Miên Trị Liệu';
                                                    if (cat === 'wealth') defaultSeg = 'Tiền bạc & Thịnh vượng';
                                                    if (cat === 'sleep') defaultSeg = 'Giấc ngủ & Thư giãn';
                                                    if (cat === 'healing') defaultSeg = 'Chữa lành cảm xúc';
                                                    if (cat === 'vip') defaultSeg = 'Trọn gói chuyển hóa';
                                                    setFormData({ ...formData, category: cat, segment: defaultSeg });
                                                }}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                                            >
                                                <option value="wealth">💰 Hút tài chính</option>
                                                <option value="sleep">🌙 Ngủ sâu & An yên</option>
                                                <option value="healing">❤️ Chữa lành nội tâm</option>
                                                <option value="vip">👑 Combo Cao Cấp</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Tên nhãn phân khúc (Tag hiển thị)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.segment}
                                                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                                                placeholder="VD: Tiền bạc & Thịnh vượng"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Expert Configuration Section */}
                                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-sm">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900 uppercase">
                                                    Chuyên gia & Người dẫn truyền bài này
                                                </h4>
                                                <p className="text-[11px] text-slate-500">
                                                    Chọn chuyên gia từ danh sách hoặc nhập thông tin chuyên gia mới
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Select */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Chọn nhanh chuyên gia
                                            </label>
                                            <select
                                                value={formData.authorId || (combinedExperts.find(e => e.name?.toLowerCase() === formData.author?.toLowerCase())?.id || 'custom')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'custom') {
                                                        setFormData(prev => ({ ...prev, authorId: 'custom' }));
                                                        return;
                                                    }
                                                    const found = combinedExperts.find(exp => exp.id === val);
                                                    if (found) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            authorId: found.id,
                                                            author: found.name,
                                                            authorTitle: found.title || found.role || '',
                                                            authorAvatar: found.avatar || '',
                                                            authorBio: found.bio || ''
                                                        }));
                                                    }
                                                }}
                                                className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold bg-white text-slate-800 outline-none focus:border-purple-500"
                                            >
                                                <optgroup label="Danh sách chuyên gia có sẵn">
                                                    {combinedExperts.map(exp => (
                                                        <option key={exp.id} value={exp.id}>
                                                            {exp.name} — {exp.title || exp.role}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                                <option value="custom">✏️ Nhập chuyên gia tùy chỉnh / Mới</option>
                                            </select>
                                        </div>

                                        {/* Name and Title */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                                    Tên chuyên gia / Giọng đọc <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.author}
                                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                                    placeholder="VD: Master Coach Mong, Coach Tuệ Nghi..."
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white outline-none focus:border-purple-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                                    Chức danh / Danh xưng
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.authorTitle || ''}
                                                    onChange={(e) => setFormData({ ...formData, authorTitle: e.target.value })}
                                                    placeholder="VD: Chuyên gia Trị liệu Tiềm thức & Sáng lập Mali Edu"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white outline-none focus:border-purple-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Avatar URL & Preview */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Ảnh đại diện chuyên gia (URL)
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border-2 border-purple-300 shrink-0">
                                                    {formData.authorAvatar ? (
                                                        <img src={formData.authorAvatar} alt={formData.author} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-6 h-6 text-slate-400 absolute inset-0 m-auto" />
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.authorAvatar || ''}
                                                    onChange={(e) => setFormData({ ...formData, authorAvatar: e.target.value })}
                                                    placeholder="https://images.unsplash.com/..."
                                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white outline-none focus:border-purple-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Tiểu sử ngắn / Giới thiệu năng lượng chuyên gia
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={formData.authorBio || ''}
                                                onChange={(e) => setFormData({ ...formData, authorBio: e.target.value })}
                                                placeholder="Giới thiệu về chuyên môn, năng lượng âm thanh, chứng chỉ trị liệu..."
                                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white outline-none focus:border-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Listens */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Lượt nghe ban đầu hiển thị trên website
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.listens}
                                            onChange={(e) => setFormData({ ...formData, listens: Number(e.target.value) })}
                                            placeholder="VD: 15400"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                                        />
                                    </div>

                                    {/* Pricing Section */}
                                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-900 uppercase">
                                                Hình thức tiếp cận
                                            </span>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isFree}
                                                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                                                    className="w-4 h-4 accent-[#9B2528] rounded"
                                                />
                                                <span className="text-xs font-bold text-emerald-700">
                                                    Miễn phí 0đ (Tặng trải nghiệm)
                                                </span>
                                            </label>
                                        </div>

                                        {!formData.isFree && (
                                            <>
                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                                            Giá bán thực tế
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.price}
                                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                            placeholder="VD: 199.000đ"
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                                            Giá gốc khuyến mãi (gạch ngang)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.originalPrice}
                                                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                                            placeholder="VD: 499.000đ"
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Affiliate Commission Configuration */}
                                                <div className="pt-4 border-t border-amber-200/80 space-y-3.5 bg-amber-50/40 p-3.5 rounded-2xl border">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-black text-slate-800 flex items-center gap-2 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.isAffiliateEnabled}
                                                                onChange={(e) => setFormData({ ...formData, isAffiliateEnabled: e.target.checked })}
                                                                className="w-4 h-4 rounded text-[#9B2528] focus:ring-[#9B2528]"
                                                            />
                                                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>Bật Tiếp thị liên kết (Affiliate) cho bản này</span>
                                                        </label>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            formData.isAffiliateEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                        }`}>
                                                            {formData.isAffiliateEnabled ? 'Đang BẬT' : 'Đã TẮT'}
                                                        </span>
                                                    </div>

                                                    {formData.isAffiliateEnabled && (
                                                        <div className="space-y-3 pt-2 border-t border-amber-200/60">
                                                            {/* 1. Hình thức hoa hồng */}
                                                            <div>
                                                                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                                                                    Hình thức tính hoa hồng cho Đối tác (CTV):
                                                                </span>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, affiliateCommissionType: 'percent' })}
                                                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                                                            formData.affiliateCommissionType === 'percent'
                                                                                ? 'bg-white border-[#9B2528] text-[#9B2528] shadow-sm'
                                                                                : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-white'
                                                                        }`}
                                                                    >
                                                                        <Percent className="w-3.5 h-3.5" />
                                                                        <span>Theo tỷ lệ %</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, affiliateCommissionType: 'fixed' })}
                                                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                                                            formData.affiliateCommissionType === 'fixed'
                                                                                ? 'bg-white border-[#9B2528] text-[#9B2528] shadow-sm'
                                                                                : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-white'
                                                                        }`}
                                                                    >
                                                                        <Coins className="w-3.5 h-3.5" />
                                                                        <span>Số tiền cố định (VNĐ)</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Input giá trị hoa hồng */}
                                                            <div>
                                                                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                                                    {formData.affiliateCommissionType === 'percent' ? '% Hoa hồng riêng' : 'Số tiền hoa hồng nhận được (VNĐ)'}
                                                                </label>
                                                                {formData.affiliateCommissionType === 'percent' ? (
                                                                    <div className="relative max-w-xs">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={formData.affiliateCommissionPercent}
                                                                            onChange={(e) => setFormData({ ...formData, affiliateCommissionPercent: e.target.value })}
                                                                            placeholder="Mặc định hệ thống (VD: 30)"
                                                                            className="w-full h-10 px-3.5 pr-8 rounded-xl border border-slate-200 text-xs font-black text-slate-900 outline-none focus:border-[#9B2528] bg-white"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">%</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative max-w-xs">
                                                                        <input
                                                                            type="text"
                                                                            value={formData.affiliateCommissionAmount}
                                                                            onChange={(e) => setFormData({ ...formData, affiliateCommissionAmount: e.target.value })}
                                                                            placeholder="VD: 50.000đ"
                                                                            className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 text-xs font-black text-slate-900 outline-none focus:border-[#9B2528] bg-white"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">VNĐ</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* 2. Ưu đãi cho người mua (Voucher) */}
                                                            <div className="pt-2.5 border-t border-amber-200/60 space-y-2">
                                                                <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                                                    <Tag className="w-3.5 h-3.5 text-[#9B2528]" />
                                                                    Ưu đãi cho khách mua qua link đối tác (Voucher / Giảm giá)
                                                                </label>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={formData.affiliateBuyerDiscountPercent}
                                                                            onChange={(e) => setFormData({ ...formData, affiliateBuyerDiscountPercent: e.target.value })}
                                                                            placeholder="Giảm giá % (VD: 10)"
                                                                            className="w-full h-9 px-3 pr-7 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-[#9B2528] bg-white"
                                                                        />
                                                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">%</span>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={formData.affiliateBuyerVoucherText}
                                                                        onChange={(e) => setFormData({ ...formData, affiliateBuyerVoucherText: e.target.value })}
                                                                        placeholder="Ghi chú voucher (VD: Giảm 10% khi mua)"
                                                                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-[#9B2528] bg-white"
                                                                    />
                                                                </div>
                                                                <p className="text-[10px] text-slate-500">
                                                                    Khách hàng truy cập qua link giới thiệu sẽ được tự động áp dụng mức giảm giá này khi thanh toán.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: TẦN SỐ SÓNG NÃO & KỸ THUẬT */}
                            {activeFormTab === 'specs' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Dải sóng não tích hợp
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.brainwave}
                                                onChange={(e) => setFormData({ ...formData, brainwave: e.target.value })}
                                                placeholder="VD: Sóng não Theta (5.5Hz) & Tần số Solfeggio 888Hz"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Tần số rung động âm thanh
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.frequency}
                                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                                placeholder="VD: 888Hz Tần số kích hoạt may mắn & tài lộc"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Thời điểm vàng để lắng nghe
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.bestTime}
                                                onChange={(e) => setFormData({ ...formData, bestTime: e.target.value })}
                                                placeholder="VD: 15 - 30 phút trước khi ngủ đêm"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Chu kỳ khuyến nghị
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.recommendedCycle}
                                                onChange={(e) => setFormData({ ...formData, recommendedCycle: e.target.value })}
                                                placeholder="VD: Nghe liên tục 21 đêm trước khi ngủ"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Chất lượng âm thanh
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.audioQuality}
                                                onChange={(e) => setFormData({ ...formData, audioQuality: e.target.value })}
                                                placeholder="VD: 320kbps Studio Lossless"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                                Đối tượng phù hợp nhất
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.targetAudience}
                                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                                placeholder="VD: Người kinh doanh, người hay lo lắng về tiền bạc..."
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: TÁC DỤNG & HƯỚNG DẪN */}
                            {activeFormTab === 'guide' && (
                                <div className="space-y-6">
                                    {/* Effects List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                                <span>Các tác dụng chuyển hóa (Effects)</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddEffect}
                                                className="text-[11px] font-bold text-[#9B2528] hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Thêm tác dụng
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {formData.effects.map((eff, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={eff}
                                                        onChange={(e) => handleUpdateEffect(idx, e.target.value)}
                                                        placeholder="VD: Cài đặt niềm tin giàu có vào tiềm thức..."
                                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveEffect(idx)}
                                                        className="p-2 text-slate-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* How To Use Steps */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                                                <HelpCircle className="w-4 h-4 text-blue-600" />
                                                <span>Các bước hướng dẫn lắng nghe</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddHowToUse}
                                                className="text-[11px] font-bold text-[#9B2528] hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Thêm bước
                                            </button>
                                        </div>

                                        <div className="space-y-2.5">
                                            {formData.howToUse.map((stepItem, idx) => (
                                                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <input
                                                            type="text"
                                                            value={stepItem.step}
                                                            onChange={(e) => handleUpdateHowToUse(idx, 'step', e.target.value)}
                                                            placeholder="Tên bước (VD: Bước 1: Đeo tai nghe)"
                                                            className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveHowToUse(idx)}
                                                            className="text-slate-400 hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        rows={2}
                                                        value={stepItem.desc}
                                                        onChange={(e) => handleUpdateHowToUse(idx, 'desc', e.target.value)}
                                                        placeholder="Mô tả chi tiết bước thực hành..."
                                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-normal"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Precautions */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                                <span>Lưu ý quan trọng & An toàn</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddPrecaution}
                                                className="text-[11px] font-bold text-[#9B2528] hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Thêm lưu ý
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {formData.precautions.map((prec, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={prec}
                                                        onChange={(e) => handleUpdatePrecaution(idx, e.target.value)}
                                                        placeholder="Cảnh báo an toàn (VD: Không nghe khi lái xe...)"
                                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePrecaution(idx)}
                                                        className="p-2 text-slate-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Actions Footer */}
                            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-medium">
                                    Dữ liệu được lưu trực tiếp vào Firestore `hypnosis_audios`
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-xl bg-[#9B2528] hover:bg-[#7E1E21] text-white text-xs font-bold transition shadow-md flex items-center gap-1.5"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>{isEditing ? 'Lưu Thay Đổi' : 'Tạo Bản Thôi Miên'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
