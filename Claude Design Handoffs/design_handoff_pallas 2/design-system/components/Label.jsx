import React from "react";

const sizes = { "2xs": "var(--text-2xs)", xs: "var(--text-xs)", sm: "var(--text-sm)", md: "var(--text-md)" };
const tones = { primary: "var(--text-primary)", secondary: "var(--text-secondary)", inverse: "var(--text-inverse)", inherit: "inherit" };

export function Label({ children, as = "span", size = "xs", tone = "primary", tracking = "label", expanded = false, weight = "medium", caps = true, style, ...rest }) {
  const Tag = as;
  return React.createElement(Tag, {
    ...rest,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: sizes[size] || size,
      fontWeight: weight === "regular" ? "var(--weight-regular)" : weight === "bold" ? "var(--weight-bold)" : "var(--weight-medium)",
      lineHeight: "var(--leading-label)",
      letterSpacing: caps ? (tracking === "wide" ? "var(--tracking-wide)" : tracking === "none" ? "0" : "var(--tracking-label)") : "var(--tracking-body)",
      textTransform: caps ? "uppercase" : "none",
      fontVariationSettings: `"wdth" ${expanded ? "var(--width-expanded)" : "var(--width-normal)"}`,
      fontVariantNumeric: "tabular-nums",
      color: tones[tone] || tone,
      margin: 0,
      ...style,
    },
  }, children);
}
