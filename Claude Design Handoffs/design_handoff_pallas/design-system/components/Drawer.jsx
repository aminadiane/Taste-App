import React from "react";
import { Label } from "../core/Label.jsx";
import { TextLink } from "../core/TextLink.jsx";

export function Drawer({ open = false, onClose, title, children, footer, side = "right", width = 440, style }) {
  React.useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  const off = side === "right" ? "translateX(100%)" : "translateX(-100%)";
  return (
    <div aria-hidden={!open} style={{ position: "fixed", inset: 0, zIndex: 100, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "var(--overlay-scrim)", backdropFilter: "blur(2px)", opacity: open ? 1 : 0, transition: "opacity var(--dur-base) var(--ease-out)" }} />
      <aside role="dialog" style={{ position: "absolute", top: 0, bottom: 0, [side]: 0, width: `min(${width}px, 100vw)`, background: "var(--surface-page)", borderLeft: side === "right" ? "1px solid var(--rule)" : 0, borderRight: side === "left" ? "1px solid var(--rule)" : 0,
        display: "flex", flexDirection: "column", transform: open ? "none" : off, transition: "transform var(--dur-base) var(--ease-out)", ...style }}>
        <div style={{ height: "var(--header-h)", padding: "0 var(--edge)", display: "flex", alignItems: "center", justifyContent: "space-between", flex: "none" }}>
          <Label>{title}</Label>
          <TextLink onClick={(e) => { e.preventDefault(); onClose && onClose(); }}>Close</TextLink>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 var(--edge)" }}>{children}</div>
        {footer && <div style={{ padding: "var(--edge)", borderTop: "1px solid var(--rule)", flex: "none" }}>{footer}</div>}
      </aside>
    </div>
  );
}
