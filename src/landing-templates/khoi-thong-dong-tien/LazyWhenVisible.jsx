import { useEffect, useRef, useState } from "react";

/**
 * Chỉ mount children khi khối gần vào viewport → dynamic import trong children
 * mới bắt đầu tải, giảm JS parse trên màn hình đầu tiên.
 */
export default function LazyWhenVisible({
  children,
  minHeight = "14rem",
  rootMargin = "280px 0px",
  className = "",
}) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} className={className} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}
