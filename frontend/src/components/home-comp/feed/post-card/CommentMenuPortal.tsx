import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface CommentMenuPortalProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children?: ReactNode;
}

export default function CommentMenuPortal({ anchorEl, onClose, children }: CommentMenuPortalProps) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right - window.scrollX,
    });
  }, [anchorEl]);

  if (!pos) return null;

  return createPortal(
    <>
      {/* backdrop to close on outside click */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
        className="min-w-[130px] rounded-md border border-[#e4e6eb] bg-white py-1 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
