import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

const FormDangKy = lazy(() => import("./sections/FormDangKy"));

const RegistrationModalContext = createContext(null);

function RegistrationModalPortal({ open, onClose, targetFunnel, source_key }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Đóng lớp phủ"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-modal-title"
        className="relative z-[101] w-full sm:max-w-xl max-h-[min(92vh,880px)] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-[#8B6010]/50"
      >
        <Suspense fallback={<div className="min-h-[240px] flex items-center justify-center bg-[#1A0A02] text-[#B89060] text-sm">Đang tải form…</div>}>
          <FormDangKy
            targetFunnel={targetFunnel}
            source_key={source_key}
            variant="modal"
            onDismiss={onClose}
          />
        </Suspense>
      </div>
    </div>,
    document.body
  );
}

export function RegistrationModalProvider({ children, targetFunnel, source_key }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({
      openRegistrationModal: () => setOpen(true),
      closeRegistrationModal: () => setOpen(false),
      isRegistrationModalOpen: open,
    }),
    [open]
  );

  return (
    <RegistrationModalContext.Provider value={value}>
      {children}
      <RegistrationModalPortal
        open={open}
        onClose={() => setOpen(false)}
        targetFunnel={targetFunnel}
        source_key={source_key}
      />
    </RegistrationModalContext.Provider>
  );
}

export function useRegistrationModal() {
  const ctx = useContext(RegistrationModalContext);
  if (!ctx) {
    throw new Error("useRegistrationModal must be used within RegistrationModalProvider");
  }
  return ctx;
}
