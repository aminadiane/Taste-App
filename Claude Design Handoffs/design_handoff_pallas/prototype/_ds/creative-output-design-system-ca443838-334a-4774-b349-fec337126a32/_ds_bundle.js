/* @ds-bundle: {"format":4,"namespace":"CreativeOutputDesignSystem_ca4438","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Label","sourcePath":"components/core/Label.jsx"},{"name":"TextLink","sourcePath":"components/core/TextLink.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"OptionGroup","sourcePath":"components/forms/OptionGroup.jsx"},{"name":"Figure","sourcePath":"components/media/Figure.jsx"},{"name":"HeroMotion","sourcePath":"components/media/HeroMotion.jsx"},{"name":"Pair","sourcePath":"components/media/Pair.jsx"},{"name":"ProductTile","sourcePath":"components/media/ProductTile.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"Header","sourcePath":"components/navigation/Header.jsx"},{"name":"Drawer","sourcePath":"components/overlay/Drawer.jsx"}],"sourceHashes":{"components/core/Button.jsx":"fc954a858e39","components/core/Label.jsx":"44a0c146166d","components/core/TextLink.jsx":"bcbbd8ed3cde","components/forms/Input.jsx":"4d65a88c477b","components/forms/OptionGroup.jsx":"760d87ef6ebc","components/media/Figure.jsx":"b6a10bdf32b5","components/media/HeroMotion.jsx":"c0273af7319f","components/media/Pair.jsx":"4ac68cc97c56","components/media/ProductTile.jsx":"bb96040afa4e","components/navigation/Footer.jsx":"557c213edd74","components/navigation/Header.jsx":"dd599c438cb3","components/overlay/Drawer.jsx":"b1e6d06e6558","ui_kits/website/Bag.jsx":"b37f7eb4438a","ui_kits/website/Home.jsx":"c6f24211c11c","ui_kits/website/Product.jsx":"959bbd621a35","ui_kits/website/Shop.jsx":"03a9214ed277","ui_kits/website/data.js":"3030d5381613","ui_kits/website/tweaks-panel.jsx":"d259e3a86f73"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CreativeOutputDesignSystem_ca4438 = window.CreativeOutputDesignSystem_ca4438 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  children,
  variant = "solid",
  size = "md",
  full = false,
  disabled = false,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const h = size === "sm" ? 36 : 48;
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--space-2)",
    height: variant === "text" ? "auto" : h,
    padding: variant === "text" ? "2px 0" : size === "sm" ? "0 16px" : "0 28px",
    width: full ? "100%" : "auto",
    border: "1px solid transparent",
    borderRadius: 0,
    cursor: disabled ? "default" : "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--weight-medium)",
    letterSpacing: "var(--tracking-label)",
    textTransform: "uppercase",
    lineHeight: 1,
    transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
    opacity: disabled ? 0.35 : down ? 0.6 : 1,
    WebkitTapHighlightColor: "transparent"
  };
  const v = {
    solid: {
      background: hover && !disabled ? "var(--graphite)" : "var(--ink)",
      color: "var(--white)",
      borderColor: "transparent"
    },
    outline: {
      background: hover && !disabled ? "var(--ink)" : "transparent",
      color: hover && !disabled ? "var(--white)" : "var(--ink)",
      borderColor: "var(--ink)"
    },
    inverse: {
      background: hover && !disabled ? "transparent" : "var(--white)",
      color: hover && !disabled ? "var(--white)" : "var(--ink)",
      borderColor: "var(--white)"
    },
    text: {
      background: "transparent",
      color: "var(--ink)",
      borderColor: "transparent",
      borderBottomColor: hover && !disabled ? "var(--ink)" : "transparent"
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({}, rest, {
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    style: {
      ...base,
      ...v,
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Label.jsx
try { (() => {
const sizes = {
  "2xs": "var(--text-2xs)",
  xs: "var(--text-xs)",
  sm: "var(--text-sm)",
  md: "var(--text-md)"
};
const tones = {
  primary: "var(--text-primary)",
  secondary: "var(--text-secondary)",
  inverse: "var(--text-inverse)",
  inherit: "inherit"
};
function Label({
  children,
  as = "span",
  size = "xs",
  tone = "primary",
  tracking = "label",
  expanded = false,
  weight = "medium",
  caps = true,
  style,
  ...rest
}) {
  const Tag = as;
  return React.createElement(Tag, {
    ...rest,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: sizes[size] || size,
      fontWeight: weight === "regular" ? "var(--weight-regular)" : weight === "bold" ? "var(--weight-bold)" : "var(--weight-medium)",
      lineHeight: "var(--leading-label)",
      letterSpacing: caps ? tracking === "wide" ? "var(--tracking-wide)" : tracking === "none" ? "0" : "var(--tracking-label)" : "var(--tracking-body)",
      textTransform: caps ? "uppercase" : "none",
      fontVariationSettings: `"wdth" ${expanded ? "var(--width-expanded)" : "var(--width-normal)"}`,
      fontVariantNumeric: "tabular-nums",
      color: tones[tone] || tone,
      margin: 0,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Label });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Label.jsx", error: String((e && e.message) || e) }); }

// components/core/TextLink.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TextLink({
  children,
  href = "#",
  active = false,
  tone = "primary",
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const color = tone === "inverse" ? "var(--text-inverse)" : tone === "secondary" ? "var(--text-secondary)" : tone === "inherit" ? "inherit" : "var(--text-primary)";
  const on = active || hover;
  return /*#__PURE__*/React.createElement("a", _extends({}, rest, {
    href: href,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: "relative",
      display: "inline-block",
      color,
      textDecoration: "none",
      opacity: 1,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      lineHeight: "var(--leading-label)",
      backgroundImage: "linear-gradient(currentColor,currentColor)",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "0 100%",
      backgroundSize: on ? "100% 1px" : "0% 1px",
      paddingBottom: 2,
      transition: "background-size var(--dur-base) var(--ease-out)",
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { TextLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TextLink.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  type = "text",
  action,
  onAction,
  error,
  done,
  style
}) {
  const [v, setV] = React.useState(defaultValue || "");
  const [focus, setFocus] = React.useState(false);
  const val = value != null ? value : v;
  const set = e => {
    setV(e.target.value);
    onChange && onChange(e.target.value);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "grid",
      gap: "var(--space-2)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement(__ds_scope.Label, {
    tone: error ? "var(--state-error)" : "secondary",
    size: "2xs",
    tracking: "wide"
  }, error || label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      borderBottom: `1px solid ${error ? "var(--state-error)" : focus ? "var(--ink)" : "var(--rule)"}`,
      transition: "border-color var(--dur-fast) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: type,
    value: done ? "" : val,
    placeholder: done || placeholder,
    onChange: set,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    onKeyDown: e => {
      if (e.key === "Enter" && onAction) {
        e.preventDefault();
        onAction(val);
      }
    },
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 0,
      background: "transparent",
      padding: "10px 0",
      font: "var(--body-font)",
      fontSize: "var(--text-md)",
      color: "var(--ink)",
      borderRadius: 0
    }
  }), action && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: e => {
      e.preventDefault();
      onAction && onAction(val);
    },
    style: {
      border: 0,
      background: "none",
      padding: "10px 0",
      cursor: "pointer",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      color: "var(--ink)"
    }
  }, action)));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/OptionGroup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function OptionGroup({
  label,
  options = [],
  value,
  onChange,
  variant = "text",
  style
}) {
  const [hover, setHover] = React.useState(null);
  const opts = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  const current = opts.find(o => o.value === value);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-3)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Label, {
    tone: "secondary",
    size: "2xs",
    tracking: "wide"
  }, label), variant === "swatch" && current && /*#__PURE__*/React.createElement(__ds_scope.Label, {
    size: "2xs",
    tracking: "wide"
  }, current.label)), /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: variant === "swatch" ? "var(--space-2)" : "var(--space-5)"
    }
  }, opts.map(o => {
    const on = o.value === value;
    const common = {
      key: o.value,
      role: "radio",
      "aria-checked": on,
      disabled: o.disabled,
      onClick: () => !o.disabled && onChange && onChange(o.value),
      onMouseEnter: () => setHover(o.value),
      onMouseLeave: () => setHover(null)
    };
    if (variant === "swatch") return /*#__PURE__*/React.createElement("button", _extends({}, common, {
      title: o.label,
      style: {
        width: 28,
        height: 28,
        padding: 3,
        border: `1px solid ${on ? "var(--ink)" : hover === o.value ? "var(--rule)" : "transparent"}`,
        background: "none",
        borderRadius: 0,
        cursor: o.disabled ? "default" : "pointer",
        opacity: o.disabled ? .35 : 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        width: "100%",
        height: "100%",
        background: o.swatch
      }
    }));
    return /*#__PURE__*/React.createElement("button", _extends({}, common, {
      style: {
        border: 0,
        background: "none",
        padding: "2px 0",
        cursor: o.disabled ? "default" : "pointer",
        borderBottom: `1px solid ${on ? "var(--ink)" : "transparent"}`,
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-medium)",
        letterSpacing: "var(--tracking-label)",
        textTransform: "uppercase",
        color: o.disabled ? "var(--stone)" : "var(--ink)",
        textDecoration: o.disabled ? "line-through" : "none",
        opacity: !on && hover === o.value ? "var(--hover-dim)" : 1,
        transition: "opacity var(--dur-fast)"
      }
    }), o.label);
  })));
}
Object.assign(__ds_scope, { OptionGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/OptionGroup.jsx", error: String((e && e.message) || e) }); }

// components/media/Figure.jsx
try { (() => {
const bgs = {
  white: "var(--white)",
  paper: "var(--paper)",
  fog: "var(--fog)",
  none: "transparent"
};
const corner = {
  tl: {
    top: "var(--edge)",
    left: "var(--edge)"
  },
  tr: {
    top: "var(--edge)",
    right: "var(--edge)",
    textAlign: "right"
  },
  bl: {
    bottom: "var(--edge)",
    left: "var(--edge)"
  },
  br: {
    bottom: "var(--edge)",
    right: "var(--edge)",
    textAlign: "right"
  }
};
function Figure({
  src,
  alt = "",
  hoverSrc,
  video,
  poster,
  ratio = "4/5",
  height,
  fit = "cover",
  position = "center",
  bg = "fog",
  labels = {},
  labelTone = "primary",
  placeholder,
  onClick,
  children,
  style
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const media = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: fit,
    objectPosition: position
  };
  const fade = on => ({
    opacity: on ? 1 : 0,
    transition: "opacity var(--dur-slow) var(--ease-out)"
  });
  return /*#__PURE__*/React.createElement("figure", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: "relative",
      margin: 0,
      overflow: "hidden",
      background: bgs[bg] || bg,
      aspectRatio: height ? undefined : ratio,
      height,
      cursor: onClick ? "pointer" : "default",
      ...style
    }
  }, video ? /*#__PURE__*/React.createElement("video", {
    src: video,
    poster: poster,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    onLoadedData: () => setLoaded(true),
    style: {
      ...media,
      ...fade(loaded || poster)
    }
  }) : src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    onLoad: () => setLoaded(true),
    style: {
      ...media,
      ...fade(loaded)
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      ...media,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Label, {
    tone: "secondary",
    size: "2xs",
    tracking: "wide"
  }, placeholder || "Image")), hoverSrc && /*#__PURE__*/React.createElement("img", {
    src: hoverSrc,
    alt: "",
    "aria-hidden": "true",
    style: {
      ...media,
      opacity: hover ? 1 : 0,
      transition: "opacity var(--dur-base) var(--ease-out)"
    }
  }), Object.entries(labels).map(([k, v]) => v && corner[k] ? /*#__PURE__*/React.createElement(__ds_scope.Label, {
    key: k,
    tone: labelTone,
    size: "2xs",
    tracking: "wide",
    style: {
      position: "absolute",
      maxWidth: "45%",
      ...corner[k]
    }
  }, v) : null), children);
}
Object.assign(__ds_scope, { Figure });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/Figure.jsx", error: String((e && e.message) || e) }); }

// components/media/HeroMotion.jsx
try { (() => {
function HeroMotion({
  video,
  poster,
  images = [],
  interval = 5200,
  height = "100svh",
  labels = {},
  labelTone = "inverse",
  children,
  style
}) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (video || images.length < 2) return;
    const t = setInterval(() => setI(n => (n + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [video, images.length, interval]);
  const fill = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover"
  };
  const pos = {
    tl: {
      top: "var(--edge)",
      left: "var(--edge)"
    },
    tr: {
      top: "var(--edge)",
      right: "var(--edge)",
      textAlign: "right"
    },
    bl: {
      bottom: "var(--edge)",
      left: "var(--edge)"
    },
    br: {
      bottom: "var(--edge)",
      right: "var(--edge)",
      textAlign: "right"
    }
  };
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: "relative",
      height,
      minHeight: 420,
      overflow: "hidden",
      background: "var(--fog)",
      ...style
    }
  }, video ? /*#__PURE__*/React.createElement("video", {
    src: video,
    poster: poster,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    style: fill
  }) : images.map((src, n) => /*#__PURE__*/React.createElement("img", {
    key: src + n,
    src: src,
    alt: "",
    style: {
      ...fill,
      objectPosition: "center 30%",
      opacity: n === i ? 1 : 0,
      transform: n === i ? "scale(1.06)" : "scale(1)",
      transition: `opacity 1400ms var(--ease-inout), transform ${interval + 1400}ms linear`
    }
  })), Object.entries(labels).map(([k, v]) => v && pos[k] ? /*#__PURE__*/React.createElement(__ds_scope.Label, {
    key: k,
    tone: labelTone,
    size: "2xs",
    tracking: "wide",
    style: {
      position: "absolute",
      ...pos[k]
    }
  }, v) : null), !video && images.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      bottom: "var(--edge)",
      transform: "translateX(-50%)",
      display: "flex",
      gap: 6
    }
  }, images.map((_, n) => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      width: 18,
      height: 1,
      background: labelTone === "inverse" ? "var(--white)" : "var(--ink)",
      opacity: n === i ? 1 : 0.35,
      transition: "opacity var(--dur-base)"
    }
  }))), children);
}
Object.assign(__ds_scope, { HeroMotion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/HeroMotion.jsx", error: String((e && e.message) || e) }); }

// components/media/Pair.jsx
try { (() => {
const splits = {
  "1:1": [1, 1],
  "2:1": [2, 1],
  "1:2": [1, 2],
  "3:2": [3, 2],
  "2:3": [2, 3]
};
function Pair({
  children,
  split = "1:1",
  align = "stretch",
  min = 320,
  style
}) {
  const kids = React.Children.toArray(children);
  const [a, b] = splits[split] || [1, 1];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "var(--gutter)",
      alignItems: align,
      ...style
    }
  }, kids.map((k, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: `${i === 0 ? a : b} 1 ${min}px`,
      minWidth: 0,
      display: "flex",
      flexDirection: "column"
    }
  }, k)));
}
Object.assign(__ds_scope, { Pair });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/Pair.jsx", error: String((e && e.message) || e) }); }

// components/media/ProductTile.jsx
try { (() => {
function ProductTile({
  src,
  hoverSrc,
  name,
  price,
  note,
  ratio = "4/5",
  fit = "contain",
  bg = "white",
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)",
      cursor: onClick ? "pointer" : "default",
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Figure, {
    src: src,
    hoverSrc: hoverSrc,
    ratio: ratio,
    fit: fit,
    bg: bg,
    labels: note ? {
      tl: note
    } : {}
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      padding: "0 var(--space-1)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Label, null, name), price != null && /*#__PURE__*/React.createElement(__ds_scope.Label, {
    tone: "secondary"
  }, price)));
}
Object.assign(__ds_scope, { ProductTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/ProductTile.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function Footer({
  brand = "Cultural Capital",
  links = [],
  note,
  onSubscribe,
  style
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      padding: "var(--space-8) var(--edge) var(--edge)",
      display: "grid",
      gap: "var(--space-8)",
      background: "var(--surface-page)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "var(--space-7)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "0 1 360px",
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Input, {
    label: "Newsletter",
    placeholder: "Email address",
    action: "Subscribe",
    onAction: onSubscribe
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "var(--space-5)"
    }
  }, links.map(l => /*#__PURE__*/React.createElement(__ds_scope.TextLink, {
    key: l.label || l,
    href: l.href || "#"
  }, l.label || l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "var(--space-5)",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Label, {
    expanded: true,
    weight: "bold",
    tracking: "none",
    style: {
      fontSize: "var(--text-display)",
      lineHeight: .9,
      letterSpacing: "var(--tracking-display)"
    }
  }, brand), /*#__PURE__*/React.createElement(__ds_scope.Label, {
    tone: "secondary",
    size: "2xs",
    tracking: "wide"
  }, note || `© ${new Date().getFullYear()}`)));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Header.jsx
try { (() => {
const css = `.co-hdr-nav{display:flex}.co-hdr-menu{display:none}@media (max-width:720px){.co-hdr-nav{display:none}.co-hdr-menu{display:inline-block}}`;
function Header({
  brand = "Cultural Capital",
  items = [],
  bagCount,
  onBrand,
  onBag,
  onMenu,
  overlay = false,
  position = "fixed",
  style
}) {
  const tone = overlay ? "inherit" : "primary";
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      height: "var(--header-h)",
      padding: "0 var(--edge)",
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      gap: "var(--space-5)",
      color: overlay ? "var(--white)" : "var(--ink)",
      mixBlendMode: overlay ? "difference" : "normal",
      background: overlay ? "transparent" : "var(--surface-page)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, css), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onBrand && onBrand();
    },
    style: {
      color: "inherit",
      justifySelf: "start"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Label, {
    tone: "inherit",
    expanded: true,
    weight: "bold",
    size: "sm",
    tracking: "none",
    style: {
      letterSpacing: "-.01em"
    }
  }, brand)), /*#__PURE__*/React.createElement("nav", {
    className: "co-hdr-nav",
    style: {
      gap: "var(--space-6)",
      justifySelf: "center"
    }
  }, items.map(it => /*#__PURE__*/React.createElement(__ds_scope.TextLink, {
    key: it.label,
    href: it.href || "#",
    active: it.active,
    tone: tone,
    onClick: e => {
      if (it.onClick) {
        e.preventDefault();
        it.onClick();
      }
    }
  }, it.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      justifySelf: "end",
      display: "flex",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "co-hdr-menu"
  }, /*#__PURE__*/React.createElement(__ds_scope.TextLink, {
    tone: tone,
    onClick: e => {
      e.preventDefault();
      onMenu && onMenu();
    }
  }, "Menu")), bagCount != null && /*#__PURE__*/React.createElement(__ds_scope.TextLink, {
    tone: tone,
    onClick: e => {
      e.preventDefault();
      onBag && onBag();
    }
  }, "Bag (", bagCount, ")")));
}
Object.assign(__ds_scope, { Header });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Header.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Drawer.jsx
try { (() => {
function Drawer({
  open = false,
  onClose,
  title,
  children,
  footer,
  side = "right",
  width = 440,
  style
}) {
  React.useEffect(() => {
    if (!open) return;
    const k = e => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  const off = side === "right" ? "translateX(100%)" : "translateX(-100%)";
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": !open,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 100,
      pointerEvents: open ? "auto" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--overlay-scrim)",
      backdropFilter: "blur(2px)",
      opacity: open ? 1 : 0,
      transition: "opacity var(--dur-base) var(--ease-out)"
    }
  }), /*#__PURE__*/React.createElement("aside", {
    role: "dialog",
    style: {
      position: "absolute",
      top: 0,
      bottom: 0,
      [side]: 0,
      width: `min(${width}px, 100vw)`,
      background: "var(--surface-page)",
      borderLeft: side === "right" ? "1px solid var(--rule)" : 0,
      borderRight: side === "left" ? "1px solid var(--rule)" : 0,
      display: "flex",
      flexDirection: "column",
      transform: open ? "none" : off,
      transition: "transform var(--dur-base) var(--ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "var(--header-h)",
      padding: "0 var(--edge)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Label, null, title), /*#__PURE__*/React.createElement(__ds_scope.TextLink, {
    onClick: e => {
      e.preventDefault();
      onClose && onClose();
    }
  }, "Close")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: "auto",
      padding: "0 var(--edge)"
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--edge)",
      borderTop: "1px solid var(--rule)",
      flex: "none"
    }
  }, footer)));
}
Object.assign(__ds_scope, { Drawer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Drawer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Bag.jsx
try { (() => {
function Bag({
  open,
  onClose,
  items,
  remove
}) {
  const {
    Drawer,
    Button,
    Label,
    TextLink,
    Figure
  } = window.CreativeOutputDesignSystem_ca4438;
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (!open) setDone(false);
  }, [open]);
  const total = items.reduce((s, it) => s + Number(String(it.price).replace(/[^\d]/g, "")), 0);
  return /*#__PURE__*/React.createElement(Drawer, {
    open: open,
    onClose: onClose,
    title: `Bag (${items.length})`,
    footer: items.length > 0 && !done ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: "var(--space-4)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement(Label, null, "Subtotal"), /*#__PURE__*/React.createElement(Label, null, "\u20AC", total.toLocaleString("en"))), /*#__PURE__*/React.createElement(Label, {
      tone: "secondary",
      size: "2xs",
      tracking: "wide"
    }, "Shipping calculated at checkout"), /*#__PURE__*/React.createElement(Button, {
      full: true,
      onClick: () => setDone(true)
    }, "Checkout")) : null
  }, done ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-7) 0",
      display: "grid",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Label, null, "Thank you"), /*#__PURE__*/React.createElement(Label, {
    tone: "secondary",
    caps: false,
    weight: "regular",
    size: "md"
  }, "This is a prototype \u2014 no order was placed.")) : items.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-7) 0"
    }
  }, /*#__PURE__*/React.createElement(Label, {
    tone: "secondary"
  }, "Your bag is empty")) : items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "88px 1fr",
      gap: "var(--space-4)",
      padding: "var(--space-4) 0",
      borderBottom: "1px solid var(--rule)"
    }
  }, /*#__PURE__*/React.createElement(Figure, {
    src: it.src,
    ratio: "4/5",
    bg: "white",
    position: it.pos
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Label, null, it.name), /*#__PURE__*/React.createElement(Label, {
    tone: "secondary"
  }, it.colour, " \u2014 ", it.strap), /*#__PURE__*/React.createElement(Label, {
    tone: "secondary"
  }, it.price), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto"
    }
  }, /*#__PURE__*/React.createElement(TextLink, {
    tone: "secondary",
    onClick: e => {
      e.preventDefault();
      remove(i);
    }
  }, "Remove"))))));
}
function MobileMenu({
  open,
  onClose,
  go,
  items
}) {
  const {
    Drawer,
    Label
  } = window.CreativeOutputDesignSystem_ca4438;
  return /*#__PURE__*/React.createElement(Drawer, {
    open: open,
    onClose: onClose,
    side: "left",
    title: "Menu"
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "grid",
      gap: "var(--space-5)",
      padding: "var(--space-7) 0"
    }
  }, items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it.label,
    href: "#",
    onClick: e => {
      e.preventDefault();
      it.onClick();
      onClose();
    }
  }, /*#__PURE__*/React.createElement(Label, {
    expanded: true,
    weight: "bold",
    tracking: "none",
    style: {
      fontSize: "var(--text-xl)",
      letterSpacing: "-.01em"
    }
  }, it.label)))));
}
window.Bag = Bag;
window.MobileMenu = MobileMenu;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Bag.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
function SectionLabel({
  children,
  right
}) {
  const {
    Label
  } = window.CreativeOutputDesignSystem_ca4438;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "var(--space-7) var(--edge) var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Label, {
    size: "2xs",
    tracking: "wide"
  }, children), right && /*#__PURE__*/React.createElement(Label, {
    size: "2xs",
    tracking: "wide",
    tone: "secondary"
  }, right));
}
function Home({
  go
}) {
  const {
    HeroMotion,
    Figure,
    Pair,
    ProductTile
  } = window.CreativeOutputDesignSystem_ca4438;
  const P = window.CO_PRODUCTS,
    I = window.CO_IMG;
  const tile = p => /*#__PURE__*/React.createElement(ProductTile, {
    key: p.id,
    src: p.src,
    hoverSrc: p.hover,
    name: p.name,
    price: p.price,
    note: p.note,
    fit: "cover",
    onClick: () => go("product", p.id)
  });
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement(HeroMotion, {
    images: [I + "street-bag.png", I + "flip-phone-ad.jpg", I + "poster-collage.jpg"],
    labels: {
      bl: "SS27 — Film",
      br: "Scroll"
    }
  }), /*#__PURE__*/React.createElement(SectionLabel, {
    right: "01"
  }, "Objects"), /*#__PURE__*/React.createElement("div", {
    className: "co-grid3",
    style: {
      padding: "0 var(--frame)"
    }
  }, P.slice(0, 3).map(tile)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-8) var(--frame) 0"
    }
  }, /*#__PURE__*/React.createElement(Pair, null, /*#__PURE__*/React.createElement(Figure, {
    src: I + "shoes-on-white.png",
    bg: "white",
    position: "center 60%",
    ratio: "4/5",
    labels: {
      bl: "Lace-up 02"
    },
    onClick: () => go("product", "lace-02")
  }), /*#__PURE__*/React.createElement(Figure, {
    src: I + "compact-mirror.jpg",
    ratio: "4/5",
    labels: {
      bl: "Look 02"
    },
    labelTone: "inverse"
  }))), /*#__PURE__*/React.createElement(SectionLabel, {
    right: "02"
  }, "Objects"), /*#__PURE__*/React.createElement("div", {
    className: "co-grid3",
    style: {
      padding: "0 var(--frame)"
    }
  }, P.slice(3, 6).map(tile)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-8) var(--frame) 0"
    }
  }, /*#__PURE__*/React.createElement(Figure, {
    src: I + "poster-collage.jpg",
    height: "100svh",
    position: "center 25%",
    labels: {
      tr: "Look 03 — Studio",
      bl: "Campaign"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--gutter) var(--frame) 0"
    }
  }, /*#__PURE__*/React.createElement(Pair, {
    split: "1:2"
  }, /*#__PURE__*/React.createElement(Figure, {
    src: I + "leather-jacket.jpg",
    ratio: "2/3",
    labels: {
      bl: "Lambskin, crinkled"
    },
    labelTone: "inverse"
  }), /*#__PURE__*/React.createElement(Figure, {
    src: I + "street-bag.png",
    ratio: "auto",
    style: {
      flex: 1
    },
    labels: {
      bl: "Chain bag 01"
    },
    labelTone: "inverse",
    onClick: () => go("product", "chain-01")
  }))));
}
window.Home = Home;
window.SectionLabel = SectionLabel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Product.jsx
try { (() => {
function Product({
  id,
  go,
  addToBag
}) {
  const {
    Figure,
    Label,
    Button,
    TextLink,
    OptionGroup,
    ProductTile
  } = window.CreativeOutputDesignSystem_ca4438;
  const p = window.CO_PRODUCTS.find(x => x.id === id) || window.CO_PRODUCTS[0];
  const [colour, setColour] = React.useState("blk");
  const [strap, setStrap] = React.useState("Chain");
  const [tab, setTab] = React.useState(null);
  const [added, setAdded] = React.useState(false);
  React.useEffect(() => {
    setAdded(false);
    setTab(null);
  }, [id]);
  const more = window.CO_PRODUCTS.filter(x => x.id !== p.id).slice(0, 3);
  const colourLabel = window.CO_COLOURS.find(c => c.value === colour).label;
  const info = {
    Details: "Glazed calf, steel hardware, suede lining. 18 × 11 × 6 cm.",
    Care: "Wipe with a dry cloth. Store in the dust bag, away from sun."
  };
  return /*#__PURE__*/React.createElement("main", {
    style: {
      paddingTop: "var(--header-h)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "co-pdp",
    style: {
      padding: "0 var(--frame)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--gutter)"
    }
  }, p.gallery.map((src, i) => /*#__PURE__*/React.createElement(Figure, {
    key: src + i,
    src: src,
    ratio: "4/5",
    bg: i === 0 ? "white" : "fog",
    position: i === 0 ? p.pos : "center"
  }))), /*#__PURE__*/React.createElement("aside", {
    className: "co-pdp-info"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Label, {
    size: "sm"
  }, p.name), /*#__PURE__*/React.createElement(Label, {
    tone: "secondary"
  }, p.price)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: "var(--measure)",
      font: "var(--body-font)",
      color: "var(--text-body)"
    }
  }, p.desc), /*#__PURE__*/React.createElement(OptionGroup, {
    variant: "swatch",
    label: "Colour",
    options: window.CO_COLOURS,
    value: colour,
    onChange: setColour
  }), /*#__PURE__*/React.createElement(OptionGroup, {
    label: "Strap",
    options: ["Chain", "Leather", {
      value: "None",
      label: "None",
      disabled: true
    }],
    value: strap,
    onChange: setStrap
  }), /*#__PURE__*/React.createElement(Button, {
    full: true,
    onClick: () => {
      addToBag({
        ...p,
        colour: colourLabel,
        strap
      });
      setAdded(true);
    }
  }, added ? "Added — view bag" : "Add to bag"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-5)"
    }
  }, Object.keys(info).map(k => /*#__PURE__*/React.createElement(TextLink, {
    key: k,
    active: tab === k,
    onClick: e => {
      e.preventDefault();
      setTab(tab === k ? null : k);
    }
  }, k))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: "var(--measure)",
      font: "var(--body-font)",
      color: "var(--text-body)",
      minHeight: "3em",
      opacity: tab ? 1 : 0,
      transition: "opacity var(--dur-base) var(--ease-out)"
    }
  }, tab ? info[tab] : "")))), /*#__PURE__*/React.createElement(window.SectionLabel, null, "More objects"), /*#__PURE__*/React.createElement("div", {
    className: "co-grid3",
    style: {
      padding: "0 var(--frame)"
    }
  }, more.map(m => /*#__PURE__*/React.createElement(ProductTile, {
    key: m.id,
    src: m.src,
    hoverSrc: m.hover,
    name: m.name,
    price: m.price,
    fit: "cover",
    onClick: () => go("product", m.id)
  }))));
}
window.Product = Product;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Product.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Shop.jsx
try { (() => {
function Shop({
  go
}) {
  const {
    ProductTile,
    Figure,
    TextLink,
    Label
  } = window.CreativeOutputDesignSystem_ca4438;
  const [cat, setCat] = React.useState("All");
  const cats = ["All", "Bags", "Small leather", "Shoes", "Leather"];
  const list = window.CO_PRODUCTS.filter(p => cat === "All" || p.cat === cat);
  const tile = p => /*#__PURE__*/React.createElement(ProductTile, {
    key: p.id,
    src: p.src,
    hoverSrc: p.hover,
    name: p.name,
    price: p.price,
    note: p.note,
    fit: "cover",
    onClick: () => go("product", p.id)
  });
  return /*#__PURE__*/React.createElement("main", {
    style: {
      paddingTop: "var(--header-h)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: "var(--space-4)",
      padding: "var(--space-7) var(--edge) var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "var(--space-5)"
    }
  }, cats.map(c => /*#__PURE__*/React.createElement(TextLink, {
    key: c,
    active: c === cat,
    onClick: e => {
      e.preventDefault();
      setCat(c);
    }
  }, c))), /*#__PURE__*/React.createElement(Label, {
    tone: "secondary",
    size: "2xs",
    tracking: "wide"
  }, list.length, " objects")), /*#__PURE__*/React.createElement("div", {
    className: "co-grid3",
    style: {
      padding: "0 var(--frame)"
    }
  }, list.slice(0, 3).map(tile)), list.length > 3 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-7) var(--frame)"
    }
  }, /*#__PURE__*/React.createElement(Figure, {
    src: window.CO_IMG + "street-bag.png",
    ratio: "16/9",
    position: "center 55%",
    labels: {
      bl: "Worn — Chain bag 01"
    },
    labelTone: "inverse"
  })), /*#__PURE__*/React.createElement("div", {
    className: "co-grid3",
    style: {
      padding: "0 var(--frame)"
    }
  }, list.slice(3).map(tile))));
}
window.Shop = Shop;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Shop.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
// Stand-in catalogue. Images are from the reference board until real product photography exists.
const IMG = "../../assets/reference/";
window.CO_PRODUCTS = [{
  id: "chain-01",
  name: "Chain bag 01",
  price: "€640",
  cat: "Bags",
  note: "New",
  src: IMG + "street-bag.png",
  hover: IMG + "hand-can.jpg",
  pos: "62% 60%",
  desc: "Small shoulder bag in glazed calf. Steel plate, doubled chain. Made in a run of forty.",
  gallery: [IMG + "street-bag.png", IMG + "leather-jacket.jpg", IMG + "hand-can.jpg"]
}, {
  id: "lace-02",
  name: "Lace-up 02",
  price: "€420",
  cat: "Shoes",
  src: IMG + "shoes-on-white.png",
  hover: IMG + "leather-jacket.jpg",
  pos: "center 60%",
  desc: "Square-toe lace-up in polished oxblood calf. Leather sole, stacked heel.",
  gallery: [IMG + "shoes-on-white.png", IMG + "lips-closeup.jpg", IMG + "leather-jacket.jpg"]
}, {
  id: "compact",
  name: "Compact case",
  price: "€180",
  cat: "Small leather",
  src: IMG + "compact-mirror.jpg",
  hover: IMG + "lips-closeup.jpg",
  desc: "Hinged case for a mirror or cards. Polished steel frame, calf lining.",
  gallery: [IMG + "compact-mirror.jpg", IMG + "lips-closeup.jpg"]
}, {
  id: "jacket-01",
  name: "Jacket 01",
  price: "€1,200",
  cat: "Leather",
  src: IMG + "leather-jacket.jpg",
  hover: IMG + "poster-collage.jpg",
  desc: "Fitted jacket in crinkled lambskin. Covered buttons, high collar.",
  gallery: [IMG + "leather-jacket.jpg", IMG + "poster-collage.jpg"]
}, {
  id: "pouch-03",
  name: "Flip pouch 03",
  price: "€260",
  cat: "Small leather",
  src: IMG + "flip-phone-ad.jpg",
  hover: IMG + "hand-can.jpg",
  pos: "center 30%",
  desc: "Phone pouch with a snap flap and a long strap.",
  gallery: [IMG + "flip-phone-ad.jpg", IMG + "hand-can.jpg"]
}, {
  id: "study",
  name: "Gloss study",
  price: "€90",
  cat: "Small leather",
  note: "Made to order",
  src: IMG + "lips-closeup.jpg",
  hover: IMG + "compact-mirror.jpg",
  desc: "Lip case in patent calf, sized for one stick.",
  gallery: [IMG + "lips-closeup.jpg", IMG + "compact-mirror.jpg"]
}];
window.CO_IMG = IMG;
window.CO_COLOURS = [{
  value: "blk",
  label: "Black",
  swatch: "#0B0B0B"
}, {
  value: "ox",
  label: "Oxblood",
  swatch: "#6B1420"
}, {
  value: "tan",
  label: "Tan",
  swatch: "#B66E55"
}, {
  value: "chk",
  label: "Chalk",
  swatch: "#EDEBE6"
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

// ui_kits/website/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // data-om-starter: inert presence marker — Claude Design's starter-usage
  // probe reads it. The closed panel renders nothing, so the marker rides
  // the <html> element as an attribute instead of a rendered node — zero
  // elements added, so page CSS (even structural selectors like
  // :nth-child) can never observe it. It records that the page WIRES a
  // tweaks panel, whether or not the panel is open. Keep this effect.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-om-starter', 'tweaks-panel');
    return () => document.documentElement.removeAttribute('data-om-starter');
  }, []);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Label = __ds_scope.Label;

__ds_ns.TextLink = __ds_scope.TextLink;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.OptionGroup = __ds_scope.OptionGroup;

__ds_ns.Figure = __ds_scope.Figure;

__ds_ns.HeroMotion = __ds_scope.HeroMotion;

__ds_ns.Pair = __ds_scope.Pair;

__ds_ns.ProductTile = __ds_scope.ProductTile;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Header = __ds_scope.Header;

__ds_ns.Drawer = __ds_scope.Drawer;

})();
