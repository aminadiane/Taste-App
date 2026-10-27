import React from "react";

export function TextLink({ children, href = "#", active = false, tone = "primary", onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const color = tone === "inverse" ? "var(--text-inverse)" : tone === "secondary" ? "var(--text-secondary)" : tone === "inherit" ? "inherit" : "var(--text-primary)";
  const on = active || hover;
  return (
    <a {...rest} href={href} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", display: "inline-block", color, textDecoration: "none", opacity: 1,
        fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)",
        letterSpacing: "var(--tracking-label)", textTransform: "uppercase", lineHeight: "var(--leading-label)",
        backgroundImage: "linear-gradient(currentColor,currentColor)", backgroundRepeat: "no-repeat",
        backgroundPosition: "0 100%", backgroundSize: on ? "100% 1px" : "0% 1px", paddingBottom: 2,
        transition: "background-size var(--dur-base) var(--ease-out)", ...style,
      }}>{children}</a>
  );
}
