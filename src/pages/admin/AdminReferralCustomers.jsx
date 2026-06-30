import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  ExternalLink,
  GraduationCap,
  Link2,
  Loader2,
  Search,
  Sheet,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { auth, db } from "../../firebase";
import { isSuperAdminEmail } from "../../utils/adminAccess";
import { normalizeLeadSearchText } from "../../utils/leadSearch";

const COURSE_OPTIONS = [
  {
    id: "chinh-phuc-muc-tieu",
    name: "Chinh Phục Mục Tiêu",
    path: "/dao-tao/chinh-phuc-muc-tieu",
    sources: ["chinh-phuc-muc-tieu"],
  },
];

const DEFAULT_COURSE_ID = COURSE_OPTIONS[0].id;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const REFERRAL_CUSTOMERS_FILTER_STORAGE_KEY = "mali-admin-referral-customers-filters";
const DEFAULT_REFERRAL_CUSTOMERS_FILTERS = {
  activeView: "customers",
  searchTerm: "",
  statusFilter: "all",
  partnerFilter: "all",
  dedupeMode: "all",
  courseFilter: "all",
  linkCourseId: DEFAULT_COURSE_ID,
  pageSize: 10,
};
const DEDUPE_MODE_OPTIONS = [
  { value: "all", label: "Tính cả trùng" },
  { value: "unique_phone", label: "Lọc trùng SĐT" },
];
const COMPANY_PARTNER = {
  id: "cong-ty",
  code: "cong-ty",
  name: "Công ty",
  email: "",
  userId: "",
  isCompany: true,
  isActive: true,
};
const REFERRAL_PARTNER_FIXES = [
  {
    email: "ductue38538@gmail.com",
    canonicalCode: "tue-duc",
    legacyCodes: ["tue-du"],
    name: "Tuệ Đức",
  },
];

const STATUS_OPTIONS = [
  { value: "new", label: "Mới", className: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "contacted", label: "Đã liên hệ", className: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "interested", label: "Quan tâm", className: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "registered", label: "Đã đăng ký", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "not_interested", label: "Không quan tâm", className: "bg-slate-100 text-slate-600 border-slate-200" },
];

const normalizeReferralCode = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : new Date(value).getTime() || 0;
};

const formatDateTime = (value) => {
  const millis = toMillis(value);
  if (!millis) return "---";
  return new Date(millis).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusMeta = (status) =>
  STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0];

const getLeadCourseId = (lead = {}) => {
  const explicitId = String(lead.courseId || lead.landingPageId || "").trim();
  const source = String(lead.source || "").trim();
  const slug = String(lead.landingPageSlug || lead.sourceUrl || "").toLowerCase();
  const courseName = normalizeLeadSearchText(lead.courseName || "");

  const matchedCourse = COURSE_OPTIONS.find(
    (course) =>
      explicitId === course.id ||
      course.sources.includes(source) ||
      slug.includes(course.path) ||
      courseName.includes(normalizeLeadSearchText(course.name))
  );

  return matchedCourse?.id || explicitId || source || "khac";
};

const normalizeLeadPhoneKey = (phone = "") => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0084") && digits.length > 4) return `0${digits.slice(4)}`;
  if (digits.startsWith("84") && digits.length > 9) return `0${digits.slice(2)}`;
  return digits;
};

const mapLeadDoc = (leadDoc) => {
  const data = leadDoc.data();
  return {
    id: leadDoc.id,
    ...data,
    referralCode: data.referralCode || COMPANY_PARTNER.code,
    courseId: getLeadCourseId(data),
  };
};

const compareLeadByOldestFirst = (left, right) => {
  const leftMillis = toMillis(left.createdAt);
  const rightMillis = toMillis(right.createdAt);
  if (leftMillis !== rightMillis) return leftMillis - rightMillis;
  return String(left.id || "").localeCompare(String(right.id || ""));
};

const dedupeLeadsByFirstPhone = (leadList = []) => {
  const leadByPhone = new Map();
  const uniqueLeads = [];

  leadList.forEach((lead) => {
    const phoneKey = normalizeLeadPhoneKey(lead.phone);
    if (!phoneKey) {
      uniqueLeads.push(lead);
      return;
    }

    const existingLead = leadByPhone.get(phoneKey);
    if (!existingLead || compareLeadByOldestFirst(lead, existingLead) < 0) {
      leadByPhone.set(phoneKey, lead);
    }
  });

  return [...uniqueLeads, ...leadByPhone.values()];
};

const applyLeadDedupeMode = (leadList = [], dedupeMode = "all") =>
  dedupeMode === "unique_phone" ? dedupeLeadsByFirstPhone(leadList) : leadList;

const sortLeadsNewestFirst = (leadList = []) =>
  [...leadList].sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));

const uniqueValues = (values = []) =>
  [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];

const applyPartnerFixes = (partner = {}) => {
  const email = String(partner.email || "").trim().toLowerCase();
  const code = String(partner.code || partner.id || "").trim();
  const fix = REFERRAL_PARTNER_FIXES.find(
    (item) =>
      item.email === email ||
      item.canonicalCode === code ||
      item.legacyCodes.includes(code)
  );

  if (!fix) return partner;

  return {
    ...partner,
    code: fix.canonicalCode,
    name: partner.name === code || !partner.name ? fix.name : partner.name,
    legacyCodes: uniqueValues([
      ...(Array.isArray(partner.legacyCodes) ? partner.legacyCodes : []),
      code,
      ...fix.legacyCodes,
    ]).filter((item) => item !== fix.canonicalCode),
  };
};

const getPartnerReferralCodes = (partner = {}) =>
  uniqueValues([
    partner.code,
    ...(Array.isArray(partner.legacyCodes) ? partner.legacyCodes : []),
  ]);

const leadBelongsToPartner = (lead, partner) =>
  getPartnerReferralCodes(partner).includes(lead.referralCode);

const getStoredReferralCustomerFilters = () => {
  if (typeof window === "undefined") return DEFAULT_REFERRAL_CUSTOMERS_FILTERS;

  try {
    const rawValue = window.localStorage.getItem(REFERRAL_CUSTOMERS_FILTER_STORAGE_KEY);
    const storedValue = rawValue ? JSON.parse(rawValue) : {};
    const validCourseIds = COURSE_OPTIONS.map((course) => course.id);
    const validStatusValues = STATUS_OPTIONS.map((status) => status.value);
    const validDedupeModes = DEDUPE_MODE_OPTIONS.map((option) => option.value);

    return {
      activeView: ["customers", "partners"].includes(storedValue.activeView)
        ? storedValue.activeView
        : DEFAULT_REFERRAL_CUSTOMERS_FILTERS.activeView,
      searchTerm:
        typeof storedValue.searchTerm === "string"
          ? storedValue.searchTerm
          : DEFAULT_REFERRAL_CUSTOMERS_FILTERS.searchTerm,
      statusFilter:
        storedValue.statusFilter === "all" || validStatusValues.includes(storedValue.statusFilter)
          ? storedValue.statusFilter
          : DEFAULT_REFERRAL_CUSTOMERS_FILTERS.statusFilter,
      partnerFilter:
        typeof storedValue.partnerFilter === "string" && storedValue.partnerFilter.trim()
          ? storedValue.partnerFilter
          : DEFAULT_REFERRAL_CUSTOMERS_FILTERS.partnerFilter,
      dedupeMode: validDedupeModes.includes(storedValue.dedupeMode)
        ? storedValue.dedupeMode
        : DEFAULT_REFERRAL_CUSTOMERS_FILTERS.dedupeMode,
      courseFilter:
        storedValue.courseFilter === "all" || validCourseIds.includes(storedValue.courseFilter)
          ? storedValue.courseFilter
          : DEFAULT_REFERRAL_CUSTOMERS_FILTERS.courseFilter,
      linkCourseId: validCourseIds.includes(storedValue.linkCourseId)
        ? storedValue.linkCourseId
        : DEFAULT_REFERRAL_CUSTOMERS_FILTERS.linkCourseId,
      pageSize: PAGE_SIZE_OPTIONS.includes(Number(storedValue.pageSize))
        ? Number(storedValue.pageSize)
        : DEFAULT_REFERRAL_CUSTOMERS_FILTERS.pageSize,
    };
  } catch (error) {
    console.warn("Không thể khôi phục bộ lọc khách hàng giới thiệu:", error);
    return DEFAULT_REFERRAL_CUSTOMERS_FILTERS;
  }
};

const AdminReferralCustomers = () => {
  const [storedFilters] = useState(getStoredReferralCustomerFilters);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [partners, setPartners] = useState([]);
  const [webUsers, setWebUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [activeView, setActiveView] = useState(storedFilters.activeView);
  const [searchTerm, setSearchTerm] = useState(storedFilters.searchTerm);
  const [statusFilter, setStatusFilter] = useState(storedFilters.statusFilter);
  const [partnerFilter, setPartnerFilter] = useState(storedFilters.partnerFilter);
  const [dedupeMode, setDedupeMode] = useState(storedFilters.dedupeMode);
  const [courseFilter, setCourseFilter] = useState(storedFilters.courseFilter);
  const [linkCourseId, setLinkCourseId] = useState(storedFilters.linkCourseId);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(storedFilters.searchTerm);
  const [pageSize, setPageSize] = useState(storedFilters.pageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState({ 1: null });
  const [pageEndCursor, setPageEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [leadStats, setLeadStats] = useState({
    total: 0,
    contacted: 0,
    registered: 0,
  });
  const [partnerStats, setPartnerStats] = useState([]);
  const [partnerForm, setPartnerForm] = useState({
    userId: "",
    name: "",
    email: "",
    code: "",
  });

  const loadData = useCallback(async (superAdmin) => {
    setIsLoading(true);
    try {
      const partnerSnapshot = await getDocs(
        query(collection(db, "referral_partners"), orderBy("name", "asc"))
      );
      const storedPartnerList = partnerSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })).map(applyPartnerFixes);
      const partnerList = [
        COMPANY_PARTNER,
        ...storedPartnerList.filter((item) => item.code !== COMPANY_PARTNER.code),
      ];
      setPartners(partnerList);

      setLeads([]);

      if (superAdmin) {
        const userSnapshot = await getDocs(collection(db, "users"));
        setWebUsers(
          userSnapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .filter((item) => item.role === "admin")
            .sort((left, right) =>
              String(left.displayName || left.email || "").localeCompare(
                String(right.displayName || right.email || ""),
                "vi"
              )
            )
        );
      }
    } catch (error) {
      console.error("Lỗi tải khách hàng giới thiệu:", error);
      toast.error("Không thể tải dữ liệu khách hàng giới thiệu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsLoading(false);
        return;
      }

      const superAdmin = isSuperAdminEmail(user.email);
      setIsSuperAdmin(superAdmin);
      await loadData(superAdmin);
    });

    return unsubscribe;
  }, [loadData]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      setPageCursors({ 1: null });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      REFERRAL_CUSTOMERS_FILTER_STORAGE_KEY,
      JSON.stringify({
        activeView,
        searchTerm,
        statusFilter,
        partnerFilter,
        dedupeMode,
        courseFilter,
        linkCourseId,
        pageSize,
      })
    );
  }, [
    activeView,
    courseFilter,
    dedupeMode,
    linkCourseId,
    pageSize,
    partnerFilter,
    searchTerm,
    statusFilter,
  ]);

  useEffect(() => {
    if (currentUser && !isSuperAdmin && activeView === "partners") {
      setActiveView("customers");
    }
  }, [activeView, currentUser, isSuperAdmin]);

  const partnerByCode = useMemo(() => {
    const entries = [];
    partners.forEach((partner) => {
      getPartnerReferralCodes(partner).forEach((code) => {
        entries.push([code, partner]);
      });
    });
    return new Map(entries);
  }, [partners]);

  const selectedPartnerFilter = useMemo(
    () => (partnerFilter !== "all" ? partnerByCode.get(partnerFilter) || null : null),
    [partnerByCode, partnerFilter]
  );

  const ownPartner = useMemo(
    () =>
      partners.find(
        (item) =>
          item.userId === currentUser?.uid ||
          String(item.email || "").toLowerCase() ===
            String(currentUser?.email || "").toLowerCase()
      ) || null,
    [currentUser, partners]
  );

  const filteredLeads = leads;

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setPageCursors({ 1: null });
    setPageEndCursor(null);
    setHasNextPage(false);
  }, []);

  useEffect(() => {
    if (partnerFilter !== "all" && partners.length > 0 && !partnerByCode.has(partnerFilter)) {
      setPartnerFilter("all");
      resetPagination();
    }
  }, [partnerByCode, partnerFilter, partners.length, resetPagination]);

  const selectedCourseSources = useMemo(
    () =>
      courseFilter === "all"
        ? COURSE_OPTIONS.flatMap((course) => course.sources)
        : COURSE_OPTIONS.find((course) => course.id === courseFilter)?.sources || [],
    [courseFilter]
  );

  const countLeads = useCallback(async ({ sources, referralCode, referralCodes, status }) => {
    const codesToCount = referralCodes?.length
      ? referralCodes
      : referralCode
        ? [referralCode]
        : [""];
    const counts = await Promise.all(
      sources.flatMap((source) =>
        codesToCount.map(async (code) => {
          const constraints = [where("source", "==", source)];
          if (code) constraints.push(where("referralCode", "==", code));
          if (status) constraints.push(where("status", "==", status));
          const snapshot = await getCountFromServer(
            query(collection(db, "leads"), ...constraints)
          );
          return snapshot.data().count;
        })
      )
    );
    return counts.reduce((total, count) => total + count, 0);
  }, []);

  const matchesLeadFilters = useCallback(
    (lead) => {
      if (!selectedCourseSources.includes(lead.source)) return false;
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (partnerFilter !== "all") {
        const selectedPartner = partnerByCode.get(partnerFilter);
        if (!selectedPartner || !leadBelongsToPartner(lead, selectedPartner)) return false;
      }

      const normalizedSearch = normalizeLeadSearchText(debouncedSearchTerm);
      if (!normalizedSearch) return true;

      const partner = partnerByCode.get(lead.referralCode);
      const course = COURSE_OPTIONS.find((item) => item.id === lead.courseId);
      const haystack = normalizeLeadSearchText(
        [
          lead.name,
          lead.phone,
          lead.note,
          partner?.name,
          lead.referralCode,
          course?.name,
          lead.courseName,
        ].join(" ")
      );
      return haystack.includes(normalizedSearch);
    },
    [
      debouncedSearchTerm,
      partnerByCode,
      partnerFilter,
      selectedCourseSources,
      statusFilter,
    ]
  );

  const loadLeadPage = useCallback(async () => {
    if (!currentUser || selectedCourseSources.length === 0) {
      setLeads([]);
      return;
    }

    setIsLoadingLeads(true);
    try {
      if (dedupeMode === "unique_phone") {
        const snapshot = await getDocs(
          query(collection(db, "leads"), orderBy("createdAt", "desc"))
        );
        const allMatchedLeads = sortLeadsNewestFirst(
          applyLeadDedupeMode(
            snapshot.docs
              .map(mapLeadDoc)
              .filter((lead) => selectedCourseSources.includes(lead.source)),
            dedupeMode
          ).filter(matchesLeadFilters)
        );
        const startIndex = (currentPage - 1) * pageSize;

        setLeads(allMatchedLeads.slice(startIndex, startIndex + pageSize));
        setPageEndCursor(null);
        setHasNextPage(allMatchedLeads.length > startIndex + pageSize);
        return;
      }

      const matchedLeads = [];
      const scanSize = Math.max(pageSize * 2, 50);
      let cursor = pageCursors[currentPage] || null;
      let endCursor = cursor;
      let nextPageExists = false;
      let exhausted = false;

      while (!exhausted && !nextPageExists) {
        const constraints = [];
        constraints.push(orderBy("createdAt", "desc"));
        if (cursor) constraints.push(startAfter(cursor));
        constraints.push(limit(scanSize));

        const snapshot = await getDocs(
          query(collection(db, "leads"), ...constraints)
        );

        if (snapshot.empty) {
          exhausted = true;
          break;
        }

        for (const leadDoc of snapshot.docs) {
          const lead = mapLeadDoc(leadDoc);

          if (matchesLeadFilters(lead)) {
            if (matchedLeads.length < pageSize) {
              matchedLeads.push(lead);
              endCursor = leadDoc;
            } else {
              nextPageExists = true;
              break;
            }
          }
        }

        cursor = snapshot.docs[snapshot.docs.length - 1];
        if (snapshot.size < scanSize) exhausted = true;
      }

      setLeads(matchedLeads);
      setPageEndCursor(endCursor);
      setHasNextPage(nextPageExists);
    } catch (error) {
      console.error("Lỗi tải trang khách hàng:", error);
      toast.error("Không thể tải trang khách hàng.");
      setLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  }, [
    currentPage,
    currentUser,
    dedupeMode,
    matchesLeadFilters,
    pageCursors,
    pageSize,
    selectedCourseSources,
  ]);

  useEffect(() => {
    loadLeadPage();
  }, [loadLeadPage]);

  useEffect(() => {
    if (!currentUser || selectedCourseSources.length === 0) return;
    const selectedReferralCodes = selectedPartnerFilter
      ? getPartnerReferralCodes(selectedPartnerFilter)
      : undefined;

    if (partnerFilter !== "all" && !selectedPartnerFilter) {
      setLeadStats({ total: 0, contacted: 0, registered: 0 });
      return;
    }

    let isCancelled = false;
    const loadStats = async () => {
      try {
        if (dedupeMode === "unique_phone") {
          const snapshot = await getDocs(
            query(collection(db, "leads"), orderBy("createdAt", "desc"))
          );
          const dedupedLeads = applyLeadDedupeMode(
            snapshot.docs
              .map(mapLeadDoc)
              .filter((lead) => selectedCourseSources.includes(lead.source)),
            dedupeMode
          ).filter((lead) => {
            if (!selectedPartnerFilter) return true;
            return leadBelongsToPartner(lead, selectedPartnerFilter);
          });
          const contactedStatuses = ["contacted", "interested", "registered"];

          if (!isCancelled) {
            setLeadStats({
              total: dedupedLeads.length,
              contacted: dedupedLeads.filter((lead) =>
                contactedStatuses.includes(lead.status)
              ).length,
              registered: dedupedLeads.filter((lead) => lead.status === "registered").length,
            });
          }
          return;
        }

        const [total, contacted, interested, registered] = await Promise.all([
          countLeads({ sources: selectedCourseSources, referralCodes: selectedReferralCodes }),
          countLeads({ sources: selectedCourseSources, referralCodes: selectedReferralCodes, status: "contacted" }),
          countLeads({ sources: selectedCourseSources, referralCodes: selectedReferralCodes, status: "interested" }),
          countLeads({ sources: selectedCourseSources, referralCodes: selectedReferralCodes, status: "registered" }),
        ]);
        if (!isCancelled) {
          setLeadStats({
            total,
            contacted: contacted + interested + registered,
            registered,
          });
        }
      } catch (error) {
        console.error("Lỗi tải thống kê lead:", error);
      }
    };
    loadStats();
    return () => {
      isCancelled = true;
    };
  }, [
    countLeads,
    currentUser,
    dedupeMode,
    partnerFilter,
    selectedPartnerFilter,
    selectedCourseSources,
  ]);

  useEffect(() => {
    if (activeView !== "partners" || !isSuperAdmin || partners.length === 0) return;
    const sources =
      COURSE_OPTIONS.find((course) => course.id === linkCourseId)?.sources || [];
    let isCancelled = false;

    const loadPartnerStats = async () => {
      const stats = await Promise.all(
        partners.map(async (partner) => {
          const referralCodes = getPartnerReferralCodes(partner);
          const [leadCount, registeredCount] = await Promise.all([
            countLeads({ sources, referralCodes }),
            countLeads({ sources, referralCodes, status: "registered" }),
          ]);
          return { ...partner, leadCount, registeredCount };
        })
      );
      if (!isCancelled) setPartnerStats(stats);
    };

    loadPartnerStats().catch((error) => {
      console.error("Lỗi tải thống kê nhân viên:", error);
    });
    return () => {
      isCancelled = true;
    };
  }, [activeView, countLeads, isSuperAdmin, linkCourseId, partners]);

  const getReferralLink = (code, courseId = linkCourseId) => {
    const baseUrl =
      typeof window === "undefined" ? "https://luathapdan.vn" : window.location.origin;
    const course =
      COURSE_OPTIONS.find((item) => item.id === courseId) || COURSE_OPTIONS[0];
    const url = new URL(course.path, baseUrl);
    if (code !== COMPANY_PARTNER.code) {
      url.searchParams.set("ref", code);
    }
    return url.toString();
  };

  const copyReferralLink = async (code, courseId = linkCourseId) => {
    await navigator.clipboard.writeText(getReferralLink(code, courseId));
    const course = COURSE_OPTIONS.find((item) => item.id === courseId);
    toast.success(`Đã copy link ${course?.name || "khóa học"}.`);
  };

  const handleUserSelection = (userId) => {
    const selectedUser = webUsers.find((item) => item.id === userId);
    if (!selectedUser) {
      setPartnerForm({ userId: "", name: "", email: "", code: "" });
      return;
    }

    const name = selectedUser.displayName || selectedUser.email?.split("@")[0] || "";
    setPartnerForm({
      userId,
      name,
      email: selectedUser.email || "",
      code: normalizeReferralCode(name),
    });
  };

  const handleSavePartner = async (event) => {
    event.preventDefault();
    const code = normalizeReferralCode(partnerForm.code || partnerForm.name);
    const name = partnerForm.name.trim();
    const email = partnerForm.email.trim().toLowerCase();

    if (!partnerForm.userId || !name || !email || !code) {
      toast.error("Vui lòng chọn tài khoản và nhập đủ thông tin.");
      return;
    }

    const duplicate = partners.find(
      (item) => item.code === code || item.userId === partnerForm.userId
    );
    if (duplicate) {
      toast.error("Tài khoản hoặc mã giới thiệu này đã tồn tại.");
      return;
    }

    setIsSavingPartner(true);
    try {
      await Promise.all([
        setDoc(doc(db, "referral_partners", code), {
          code,
          name,
          email,
          userId: partnerForm.userId,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(
          doc(db, "users", partnerForm.userId),
          {
            referralCode: code,
            referralName: name,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
      ]);

      toast.success("Đã tạo mã giới thiệu.");
      setPartnerForm({ userId: "", name: "", email: "", code: "" });
      await loadData(isSuperAdmin);
    } catch (error) {
      console.error("Lỗi tạo mã giới thiệu:", error);
      toast.error("Không thể tạo mã giới thiệu.");
    } finally {
      setIsSavingPartner(false);
    }
  };

  const handleStatusChange = async (leadId, status) => {
    const previousStatus = leads.find((lead) => lead.id === leadId)?.status || "new";
    setLeads((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
    );
    const contactedStatuses = ["contacted", "interested", "registered"];
    setLeadStats((current) => ({
      ...current,
      contacted:
        current.contacted -
        (contactedStatuses.includes(previousStatus) ? 1 : 0) +
        (contactedStatuses.includes(status) ? 1 : 0),
      registered:
        current.registered -
        (previousStatus === "registered" ? 1 : 0) +
        (status === "registered" ? 1 : 0),
    }));
    try {
      await updateDoc(doc(db, "leads", leadId), {
        status,
        updatedAt: Date.now(),
        updatedBy: currentUser?.email || "",
      });
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      toast.error("Không thể cập nhật trạng thái.");
      setLeadStats((current) => ({
        ...current,
        contacted:
          current.contacted -
          (contactedStatuses.includes(status) ? 1 : 0) +
          (contactedStatuses.includes(previousStatus) ? 1 : 0),
        registered:
          current.registered -
          (status === "registered" ? 1 : 0) +
          (previousStatus === "registered" ? 1 : 0),
      }));
      await loadLeadPage();
    }
  };

  const handleNoteSave = async (leadId, note) => {
    const currentLead = leads.find((lead) => lead.id === leadId);
    if (String(currentLead?.note || "") === String(note || "")) return;

    setLeads((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, note } : lead))
    );
    try {
      await updateDoc(doc(db, "leads", leadId), {
        note: String(note || "").trim(),
        updatedAt: Date.now(),
        updatedBy: currentUser?.email || "",
      });
      toast.success("Đã lưu ghi chú.");
    } catch (error) {
      console.error("Lỗi lưu ghi chú:", error);
      toast.error("Không thể lưu ghi chú.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-secret-wax" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight md:text-3xl">
                <Sheet className="h-8 w-8 text-secret-wax" />
                Khách hàng giới thiệu
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Theo dõi số khách và kết quả giới thiệu của từng nhân viên.
              </p>
            </div>

            <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => setActiveView("customers")}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition ${
                  activeView === "customers"
                    ? "bg-white text-secret-wax shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <Users className="h-4 w-4" />
                Khách hàng
              </button>
              {isSuperAdmin ? (
                <button
                  type="button"
                  onClick={() => setActiveView("partners")}
                  className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition ${
                    activeView === "partners"
                      ? "bg-white text-secret-wax shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  Nhân viên
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [
                  selectedPartnerFilter
                    ? `Tổng khách của ${selectedPartnerFilter.name}`
                    : "Tổng khách giới thiệu",
                  leadStats.total,
                  <Users key="users" className="h-5 w-5" />,
                  "text-blue-600 bg-blue-50",
                ],
                ["Đã liên hệ", leadStats.contacted, <Check key="check" className="h-5 w-5" />, "text-amber-600 bg-amber-50"],
                ["Đã đăng ký", leadStats.registered, <UserPlus key="user-plus" className="h-5 w-5" />, "text-emerald-600 bg-emerald-50"],
                [
                  "Nhân viên có mã",
                  partners.filter((partner) => !partner.isCompany).length,
                  <Link2 key="link" className="h-5 w-5" />,
                  "text-violet-600 bg-violet-50",
                ],
              ].map(([label, value, icon, tone]) => (
                <article key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                    {icon}
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
                  <p className="mt-1 break-all text-2xl font-black text-slate-900">{value}</p>
                </article>
              ))}
            </section>

            {!isSuperAdmin && ownPartner ? (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-black uppercase tracking-wider text-emerald-700">
                    Link giới thiệu của bạn
                  </p>
                  <select
                    value={linkCourseId}
                    onChange={(event) => setLinkCourseId(event.target.value)}
                    className="min-h-10 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-bold text-slate-700"
                  >
                    {COURSE_OPTIONS.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row">
                  <input
                    readOnly
                    value={getReferralLink(ownPartner.code, linkCourseId)}
                    className="min-h-12 flex-1 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => copyReferralLink(ownPartner.code, linkCourseId)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 font-black text-white"
                  >
                    <ClipboardCopy className="h-5 w-5" />
                    Copy link
                  </button>
                </div>
              </section>
            ) : null}

            {activeView === "customers" ? (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 lg:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm theo tên, số điện thoại, ghi chú..."
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-secret-wax"
                    />
                  </div>
                  <select
                    value={courseFilter}
                    onChange={(event) => {
                      setCourseFilter(event.target.value);
                      resetPagination();
                    }}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
                  >
                    <option value="all">Tất cả khóa học</option>
                    {COURSE_OPTIONS.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      resetPagination();
                    }}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={partnerFilter}
                    onChange={(event) => {
                      setPartnerFilter(event.target.value);
                      resetPagination();
                    }}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
                  >
                    <option value="all">Tất cả nhân viên</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.code}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={dedupeMode}
                    onChange={(event) => {
                      setDedupeMode(event.target.value);
                      resetPagination();
                    }}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
                  >
                    {DEDUPE_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex min-h-11 items-center justify-center rounded-xl border border-secret-wax/20 bg-secret-wax/5 px-4 text-sm font-black text-secret-wax">
                    {isLoadingLeads
                      ? "Đang tải..."
                      : `${filteredLeads.length} dòng • Trang ${currentPage}`}
                  </div>
                </div>

                <div className="relative hidden overflow-x-auto lg:block">
                  {isLoadingLeads ? (
                    <div className="absolute inset-0 z-20 flex min-h-[180px] items-center justify-center bg-white/75 backdrop-blur-[1px]">
                      <Loader2 className="h-8 w-8 animate-spin text-secret-wax" />
                    </div>
                  ) : null}
                  <table className="w-full min-w-[1400px] table-fixed border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        <th className="w-[210px] border-r border-slate-200 px-4 py-3">Họ tên</th>
                        <th className="w-[145px] border-r border-slate-200 px-4 py-3">Số điện thoại</th>
                        <th className="w-[190px] border-r border-slate-200 px-4 py-3">Khóa học</th>
                        <th className="w-[180px] border-r border-slate-200 px-4 py-3">Người giới thiệu</th>
                        <th className="w-[150px] border-r border-slate-200 px-4 py-3">Ngày đăng ký</th>
                        <th className="w-[165px] border-r border-slate-200 px-4 py-3">Trạng thái</th>
                        <th className="border-r border-slate-200 px-4 py-3">Ghi chú</th>
                        <th className="w-[150px] px-4 py-3">Nguồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead, index) => {
                        const partner = partnerByCode.get(lead.referralCode);
                        const course = COURSE_OPTIONS.find((item) => item.id === lead.courseId);
                        const statusMeta = getStatusMeta(lead.status);
                        return (
                          <tr
                            key={lead.id}
                            className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"} border-t border-slate-200`}
                          >
                            <td className="border-r border-slate-200 px-4 py-3 font-black text-slate-800">
                              {lead.name}
                            </td>
                            <td className="border-r border-slate-200 px-4 py-3 font-mono text-sm font-bold">
                              {lead.phone}
                            </td>
                            <td className="border-r border-slate-200 px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-700">
                                <GraduationCap className="h-3.5 w-3.5" />
                                {course?.name || lead.courseName || "Chưa xác định"}
                              </span>
                            </td>
                            <td className="border-r border-slate-200 px-4 py-3">
                              <p className="font-bold text-slate-800">{partner?.name || lead.referralCode}</p>
                              <p className="mt-0.5 text-[11px] text-slate-400">{lead.referralCode}</p>
                            </td>
                            <td className="border-r border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">
                              {formatDateTime(lead.createdAt)}
                            </td>
                            <td className="border-r border-slate-200 px-3 py-2">
                              <select
                                value={lead.status || "new"}
                                onChange={(event) =>
                                  handleStatusChange(lead.id, event.target.value)
                                }
                                className={`w-full rounded-lg border px-2 py-2 text-xs font-black outline-none ${statusMeta.className}`}
                              >
                                {STATUS_OPTIONS.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border-r border-slate-200 p-0">
                              <input
                                defaultValue={lead.note || ""}
                                onBlur={(event) => handleNoteSave(lead.id, event.target.value)}
                                placeholder="Nhập ghi chú..."
                                className="min-h-[52px] w-full bg-transparent px-4 text-sm outline-none focus:bg-amber-50"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-black text-indigo-700">
                                {lead.utmSource || lead.source || "Landing"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="relative space-y-3 p-3 lg:hidden">
                  {isLoadingLeads ? (
                    <div className="flex min-h-[160px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-secret-wax" />
                    </div>
                  ) : null}
                  {filteredLeads.map((lead) => {
                    const partner = partnerByCode.get(lead.referralCode);
                    const course = COURSE_OPTIONS.find((item) => item.id === lead.courseId);
                    const statusMeta = getStatusMeta(lead.status);
                    return (
                      <article key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{lead.name}</h3>
                            <a href={`tel:${lead.phone}`} className="mt-1 block font-mono font-bold text-blue-700">
                              {lead.phone}
                            </a>
                          </div>
                          <select
                            value={lead.status || "new"}
                            onChange={(event) => handleStatusChange(lead.id, event.target.value)}
                            className={`max-w-[145px] rounded-lg border px-2 py-2 text-xs font-black ${statusMeta.className}`}
                          >
                            {STATUS_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="col-span-2">
                            <p className="text-xs font-bold uppercase text-slate-400">Khóa học</p>
                            <p className="mt-1 font-bold text-rose-700">
                              {course?.name || lead.courseName || "Chưa xác định"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-400">Người giới thiệu</p>
                            <p className="mt-1 font-bold">{partner?.name || lead.referralCode}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-400">Ngày đăng ký</p>
                            <p className="mt-1 font-semibold">{formatDateTime(lead.createdAt)}</p>
                          </div>
                        </div>
                        <textarea
                          defaultValue={lead.note || ""}
                          onBlur={(event) => handleNoteSave(lead.id, event.target.value)}
                          placeholder="Ghi chú về khách hàng..."
                          rows={2}
                          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-secret-wax focus:bg-white"
                        />
                      </article>
                    );
                  })}
                </div>

                {!isLoadingLeads && filteredLeads.length === 0 ? (
                  <div className="px-6 py-16 text-center text-slate-400">
                    Chưa có khách hàng phù hợp với bộ lọc.
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    Hiển thị
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        resetPagination();
                      }}
                      className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 font-black text-slate-800"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    dòng / trang
                  </label>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1 || isLoadingLeads}
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </button>
                    <span className="min-w-20 text-center text-sm font-black text-slate-700">
                      Trang {currentPage}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (dedupeMode === "unique_phone") {
                          setCurrentPage((page) => page + 1);
                          return;
                        }
                        if (!pageEndCursor) return;
                        setPageCursors((current) => ({
                          ...current,
                          [currentPage + 1]: pageEndCursor,
                        }));
                        setCurrentPage((page) => page + 1);
                      }}
                      disabled={!hasNextPage || isLoadingLeads}
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {activeView === "partners" && isSuperAdmin ? (
              <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
                <form
                  onSubmit={handleSavePartner}
                  className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="flex items-center gap-2 text-xl font-black">
                    <UserPlus className="h-5 w-5 text-secret-wax" />
                    Tạo mã cho nhân viên
                  </h2>
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Tài khoản nhân viên
                      </label>
                      <select
                        value={partnerForm.userId}
                        onChange={(event) => handleUserSelection(event.target.value)}
                        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3"
                      >
                        <option value="">Chọn tài khoản...</option>
                        {webUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.displayName || user.email} — {user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Tên hiển thị
                      </label>
                      <input
                        value={partnerForm.name}
                        onChange={(event) =>
                          setPartnerForm((current) => ({
                            ...current,
                            name: event.target.value,
                            code: normalizeReferralCode(event.target.value),
                          }))
                        }
                        className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Email
                      </label>
                      <input
                        readOnly
                        value={partnerForm.email}
                        className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Mã giới thiệu
                      </label>
                      <input
                        value={partnerForm.code}
                        onChange={(event) =>
                          setPartnerForm((current) => ({
                            ...current,
                            code: normalizeReferralCode(event.target.value),
                          }))
                        }
                        className="min-h-12 w-full rounded-xl border border-slate-200 px-4 font-mono font-bold"
                        placeholder="vi-du: lan-anh"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingPartner}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-secret-wax px-5 font-black text-white disabled:opacity-60"
                    >
                      {isSavingPartner ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                      Tạo mã giới thiệu
                    </button>
                  </div>
                </form>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-black">Danh sách nguồn giới thiệu</h2>
                    <select
                      value={linkCourseId}
                      onChange={(event) => setLinkCourseId(event.target.value)}
                      className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
                    >
                      {COURSE_OPTIONS.map((course) => (
                        <option key={course.id} value={course.id}>
                          Khóa: {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {partnerStats.map((partner) => (
                      <article key={partner.id} className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="text-lg font-black">{partner.name}</h3>
                            {partner.email ? (
                              <p className="text-sm text-slate-500">{partner.email}</p>
                            ) : (
                              <p className="text-sm font-bold text-blue-600">
                                Khách vào landing trực tiếp
                              </p>
                            )}
                            <p className="mt-1 font-mono text-xs font-bold text-violet-700">
                              ref={partner.code}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700">
                              {partner.leadCount} khách
                            </span>
                            <span className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                              {partner.registeredCount} đăng ký
                            </span>
                            <button
                              type="button"
                              onClick={() => copyReferralLink(partner.code, linkCourseId)}
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 hover:border-secret-wax hover:text-secret-wax"
                            >
                              <ClipboardCopy className="h-4 w-4" />
                              Copy link
                            </button>
                            <a
                              href={getReferralLink(partner.code, linkCourseId)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Mở
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
        </>
      </div>
    </div>
  );
};

export default AdminReferralCustomers;
