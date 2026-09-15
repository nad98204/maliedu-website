import { useState } from "react";
import { normalizeCloudinaryImage } from "../utils/imageUtils";

const InstructorAvatar = ({ avatar, name = "Giảng viên", className = "h-14 w-14" }) => {
  const [failedSource, setFailedSource] = useState(null);
  const src = normalizeCloudinaryImage(avatar || "", "f_auto,q_auto,c_thumb,g_face,w_160,h_160");
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(-2)
    .map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("vi-VN") || "GV";

  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-secret-wax/10 bg-secret-wax/5 text-sm font-bold text-secret-wax ${className}`}>
      {src && failedSource !== src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailedSource(src)}
        />
      ) : <span aria-label={name}>{initials}</span>}
    </span>
  );
};

export default InstructorAvatar;
