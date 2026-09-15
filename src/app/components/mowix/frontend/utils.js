// Shared helpers for the Mowix front-end handlers (ports of Elementor's frontend utilities).

// Elementor kit breakpoints: mobile <= 767px, tablet <= 1024px.
export const BREAKPOINTS = { mobile: 767, tablet: 1024 };
const DEVICE_ORDER = ["mobile", "tablet", "desktop"];

export function getDevice() {
  const width = window.innerWidth;
  if (width <= BREAKPOINTS.mobile) return "mobile";
  if (width <= BREAKPOINTS.tablet) return "tablet";
  return "desktop";
}

export function readSettings(element) {
  try {
    return JSON.parse(element.getAttribute("data-settings") || "{}");
  } catch {
    return {};
  }
}

// Elementor slider controls are stored as { unit, size, sizes }; handlers read `sizes` when set, otherwise `size`.
export function controlValue(value) {
  if (value && typeof value === "object" && "sizes" in value) {
    return Object.keys(value.sizes).length ? value.sizes : value.size;
  }
  return value;
}

// Responsive setting lookup: mobile falls back to tablet, tablet to desktop (Elementor's inheritance).
export function responsiveValue(settings, key, device = getDevice()) {
  for (let i = DEVICE_ORDER.indexOf(device); i < DEVICE_ORDER.length; i++) {
    const name = DEVICE_ORDER[i] === "desktop" ? key : `${key}_${DEVICE_ORDER[i]}`;
    const value = controlValue(settings[name]);
    if (value !== undefined && value !== "" && value !== null) return value;
  }
  return undefined;
}

// jQuery .height(): content height, unaffected by transforms.
export function contentHeight(element) {
  const style = getComputedStyle(element);
  let height = parseFloat(style.height) || 0;
  if (style.boxSizing === "border-box") {
    height -= parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  }
  return height;
}

export function contentWidth(element) {
  const style = getComputedStyle(element);
  let width = parseFloat(style.width) || 0;
  if (style.boxSizing === "border-box") {
    width -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
  }
  return width;
}

// jQuery .outerWidth()/.outerHeight() (and jquery.sticky's getElementOuterSize): border-box size, fractional.
export function outerSize(element, dimension, includeMargins = false) {
  const style = getComputedStyle(element);
  const sides = dimension === "height" ? ["Top", "Bottom"] : ["Left", "Right"];
  let size = parseFloat(style[dimension]) || 0;
  const add = [];
  if (style.boxSizing !== "border-box") add.push("padding", "border");
  if (includeMargins) add.push("margin");
  for (const property of add) {
    for (const side of sides) size += parseFloat(style[property === "border" ? `border${side}Width` : `${property}${side}`]) || 0;
  }
  return size;
}

// Same as Elementor's scrollObserver: fires once the element intersects the viewport.
export function onceInViewport(element, callback) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        callback();
      }
    }
  });
  observer.observe(element);
  return () => observer.disconnect();
}

// Run `fn` for every element in `root` whose data-settings match `predicate`.
export function forEachWithSettings(root, predicate, fn) {
  const cleanups = [];
  for (const element of root.querySelectorAll("[data-settings]")) {
    const settings = readSettings(element);
    if (predicate(settings, element)) {
      const cleanup = fn(element, settings);
      if (cleanup) cleanups.push(cleanup);
    }
  }
  return () => cleanups.reverse().forEach((cleanup) => cleanup());
}
