import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Check,
  ClipboardCopy,
  ExternalLink,
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

const LANDING_PATH = "/dao-tao/chinh-phuc-muc-tieu";
const COMPANY_PARTNER = {
  id: "cong-ty",
  code: "cong-ty",
  name: "Công ty",
  email: "",
  userId: "",
  isCompany: true,
  isActive: true,
};

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

const AdminReferralCustomers = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [partners, setPartners] = useState([]);
  const [webUsers, setWebUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [activeView, setActiveView] = useState("customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [partnerForm, setPartnerForm] = useState({
    userId: "",
    name: "",
    email: "",
    code: "",
  });

  const loadData = useCallback(async (user, superAdmin) => {
    setIsLoading(true);
    try {
      const partnerSnapshot = await getDocs(
        superAdmin
          ? query(collection(db, "referral_partners"), orderBy("name", "asc"))
          : query(
              collection(db, "referral_partners"),
              where("userId", "==", user.uid)
            )
      );
      const storedPartnerList = partnerSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      const partnerList = superAdmin
        ? [
            COMPANY_PARTNER,
            ...storedPartnerList.filter((item) => item.code !== COMPANY_PARTNER.code),
          ]
        : storedPartnerList;
      setPartners(partnerList);

      const ownPartner = partnerList.find(
        (item) =>
          item.userId === user.uid ||
          String(item.email || "").toLowerCase() === String(user.email || "").toLowerCase()
      );

      let leadSnapshot;
      if (superAdmin) {
        leadSnapshot = await getDocs(
          query(
            collection(db, "leads"),
            where("source", "==", "chinh-phuc-muc-tieu")
          )
        );
      } else if (ownPartner?.code) {
        leadSnapshot = await getDocs(
          query(
            collection(db, "leads"),
            where("referralCode", "==", ownPartner.code)
          )
        );
      }

      setLeads(
        leadSnapshot
          ? leadSnapshot.docs
              .map((item) => ({
                id: item.id,
                ...item.data(),
                referralCode: item.data().referralCode || COMPANY_PARTNER.code,
              }))
              .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt))
          : []
      );

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
      await loadData(user, superAdmin);
    });

    return unsubscribe;
  }, [loadData]);

  const partnerByCode = useMemo(
    () => new Map(partners.map((partner) => [partner.code, partner])),
    [partners]
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

  const filteredLeads = useMemo(() => {
    const normalizedSearch = normalizeLeadSearchText(searchTerm);

    return leads.filter((lead) => {
      const partner = partnerByCode.get(lead.referralCode);
      const haystack = normalizeLeadSearchText(
        [lead.name, lead.phone, lead.note, partner?.name, lead.referralCode].join(" ")
      );
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesPartner =
        partnerFilter === "all" || lead.referralCode === partnerFilter;
      return matchesSearch && matchesStatus && matchesPartner;
    });
  }, [leads, partnerByCode, partnerFilter, searchTerm, statusFilter]);

  const partnerStats = useMemo(
    () =>
      partners.map((partner) => {
        const partnerLeads = leads.filter((lead) => lead.referralCode === partner.code);
        return {
          ...partner,
          leadCount: partnerLeads.length,
          registeredCount: partnerLeads.filter((lead) => lead.status === "registered").length,
        };
      }),
    [leads, partners]
  );

  const totalRegistered = leads.filter((lead) => lead.status === "registered").length;
  const totalContacted = leads.filter((lead) =>
    ["contacted", "interested", "registered"].includes(lead.status)
  ).length;

  const getReferralLink = (code) => {
    const baseUrl =
      typeof window === "undefined" ? "https://luathapdan.vn" : window.location.origin;
    const url = new URL(LANDING_PATH, baseUrl);
    if (code !== COMPANY_PARTNER.code) {
      url.searchParams.set("ref", code);
    }
    return url.toString();
  };

  const copyReferralLink = async (code) => {
    await navigator.clipboard.writeText(getReferralLink(code));
    toast.success("Đã copy link giới thiệu.");
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
      await loadData(currentUser, isSuperAdmin);
    } catch (error) {
      console.error("Lỗi tạo mã giới thiệu:", error);
      toast.error("Không thể tạo mã giới thiệu.");
    } finally {
      setIsSavingPartner(false);
    }
  };

  const handleStatusChange = async (leadId, status) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
    );
    try {
      await updateDoc(doc(db, "leads", leadId), {
        status,
        updatedAt: Date.now(),
        updatedBy: currentUser?.email || "",
      });
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      toast.error("Không thể cập nhật trạng thái.");
      await loadData(currentUser, isSuperAdmin);
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

        {!isSuperAdmin && !ownPartner ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
            <Link2 className="mx-auto h-12 w-12 text-amber-600" />
            <h2 className="mt-4 text-2xl font-black text-amber-900">
              Tài khoản chưa có mã giới thiệu
            </h2>
            <p className="mt-2 text-amber-800">
              Vui lòng liên hệ quản trị viên để được cấp link giới thiệu riêng.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Tổng khách giới thiệu", leads.length, <Users key="users" className="h-5 w-5" />, "text-blue-600 bg-blue-50"],
                ["Đã liên hệ", totalContacted, <Check key="check" className="h-5 w-5" />, "text-amber-600 bg-amber-50"],
                ["Đã đăng ký", totalRegistered, <UserPlus key="user-plus" className="h-5 w-5" />, "text-emerald-600 bg-emerald-50"],
                [
                  isSuperAdmin ? "Nhân viên có mã" : "Mã của bạn",
                  isSuperAdmin
                    ? partners.filter((partner) => !partner.isCompany).length
                    : ownPartner?.code || "---",
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
                <p className="text-sm font-black uppercase tracking-wider text-emerald-700">
                  Link giới thiệu của bạn
                </p>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row">
                  <input
                    readOnly
                    value={getReferralLink(ownPartner.code)}
                    className="min-h-12 flex-1 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => copyReferralLink(ownPartner.code)}
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
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {isSuperAdmin ? (
                    <select
                      value={partnerFilter}
                      onChange={(event) => setPartnerFilter(event.target.value)}
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
                    >
                      <option value="all">Tất cả nhân viên</option>
                      {partners.map((partner) => (
                        <option key={partner.id} value={partner.code}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <div className="flex min-h-11 items-center justify-center rounded-xl border border-secret-wax/20 bg-secret-wax/5 px-4 text-sm font-black text-secret-wax">
                    {filteredLeads.length} khách hàng
                  </div>
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1250px] table-fixed border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        <th className="w-[210px] border-r border-slate-200 px-4 py-3">Họ tên</th>
                        <th className="w-[145px] border-r border-slate-200 px-4 py-3">Số điện thoại</th>
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

                <div className="space-y-3 p-3 lg:hidden">
                  {filteredLeads.map((lead) => {
                    const partner = partnerByCode.get(lead.referralCode);
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

                {filteredLeads.length === 0 ? (
                  <div className="px-6 py-16 text-center text-slate-400">
                    Chưa có khách hàng phù hợp với bộ lọc.
                  </div>
                ) : null}
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
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <h2 className="text-lg font-black">Danh sách nguồn giới thiệu</h2>
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
                              onClick={() => copyReferralLink(partner.code)}
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 hover:border-secret-wax hover:text-secret-wax"
                            >
                              <ClipboardCopy className="h-4 w-4" />
                              Copy link
                            </button>
                            <a
                              href={getReferralLink(partner.code)}
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
        )}
      </div>
    </div>
  );
};

export default AdminReferralCustomers;
