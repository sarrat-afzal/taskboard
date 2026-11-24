import { useEffect, useRef } from "react";

export default function Modal({ title, onClose, children, variant = "dialog" }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector("input, textarea, select, button");
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={`overlay overlay-${variant}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`sheet sheet-${variant}`} role="dialog" aria-modal="true" aria-label={title}>
        {children}
      </div>
    </div>
  );
}
