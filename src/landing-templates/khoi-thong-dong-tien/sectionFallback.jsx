/** Skeleton nhẹ cho Suspense section below-the-fold */
export function SectionFallback({ className = "" }) {
  return (
    <div
      className={`w-full rounded-2xl bg-gradient-to-b from-stone-200/50 to-stone-100/30 animate-pulse ${className}`}
      aria-hidden
    />
  );
}
