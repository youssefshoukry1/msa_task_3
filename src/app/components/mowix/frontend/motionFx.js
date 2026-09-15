// Scrolling motion effects (Elementor Pro "Motion Effects > Scrolling Effects"), for elements and backgrounds.
// Port of elementor-pro/modules/motion-fx: same settings, same maths, same classes and CSS variables.
import { contentHeight, contentWidth, controlValue, getDevice, outerSize, readSettings } from "./utils";

const SUPPORTED_EFFECTS = ["translateX", "translateY", "rotateZ", "scale"];

// Collect the scroll effects configured under `name` ("motion_fx" or "background_motion_fx"), in settings order.
function effectsFor(settings, name) {
  const effects = {};
  for (const [key, value] of Object.entries(settings)) {
    const match = key.match(new RegExp(`^${name}_([a-zA-Z]+)_effect$`));
    if (!match || !value || !SUPPORTED_EFFECTS.includes(match[1])) continue;
    const effect = match[1];
    const options = {};
    for (const [subKey, subValue] of Object.entries(settings)) {
      const sub = subKey.match(new RegExp(`^${name}_${effect}_(.+)$`));
      if (sub && sub[1] !== "effect") options[sub[1]] = controlValue(subValue);
    }
    effects[effect] = options;
  }
  return effects;
}

function viewportPercentage(element) {
  const rect = element.getBoundingClientRect();
  const y1 = rect.top - window.innerHeight;
  const y2 = rect.top + contentHeight(element);
  const percent = Math.max(0, Math.min(-y1 / (y2 - y1), 1));
  return percent * 100;
}

function pageScrollPercentage() {
  const pageHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  return ((document.documentElement.scrollTop + document.body.scrollTop) / pageHeight) * 100;
}

const movePointFromPassed = (movableRange, passed) => +((passed / movableRange) * 100).toFixed(2);

function directionMovePoint(passed, direction, range) {
  let movePoint;
  if (passed < range.start) {
    if (direction === "out-in") movePoint = 0;
    else if (direction === "in-out") movePoint = 100;
    else {
      movePoint = movePointFromPassed(range.start, passed);
      if (direction === "in-out-in") movePoint = 100 - movePoint;
    }
  } else if (passed < range.end) {
    if (direction === "in-out-in") movePoint = 0;
    else if (direction === "out-in-out") movePoint = 100;
    else {
      movePoint = movePointFromPassed(range.end - range.start, passed - range.start);
      if (direction === "in-out") movePoint = 100 - movePoint;
    }
  } else if (direction === "in-out") movePoint = 0;
  else if (direction === "out-in") movePoint = 100;
  else {
    movePoint = movePointFromPassed(100 - range.end, 100 - passed);
    if (direction === "in-out-in") movePoint = 100 - movePoint;
  }
  return movePoint;
}

class MotionFx {
  constructor(element, { type, effects, range }) {
    this.type = type;
    this.effects = effects;
    this.range = range;
    // Widgets animate their inner container when there is one; containers animate themselves.
    const widgetContainer = type === "element" && element.classList.contains("elementor-widget") ? element.querySelector(":scope > .elementor-widget-container") : null;
    this.element = widgetContainer || element;
    this.dimensionsElement = widgetContainer ? element : this.element;
    this.parent = this.element.parentElement;
    this.rules = {};

    this.parent.classList.add("elementor-motion-effects-parent");
    this.element.classList.add("elementor-motion-effects-element");
    if (type === "background") {
      this.element.classList.add("elementor-motion-effects-element-type-background");
      // Carousel loop clones copy an existing layer; reuse it instead of stacking a second one.
      this.container = this.element.querySelector(":scope > .elementor-motion-effects-container");
      this.createdContainer = !this.container;
      if (!this.container) {
        this.container = document.createElement("div");
        this.container.className = "elementor-motion-effects-container";
        this.container.appendChild(document.createElement("div")).className = "elementor-motion-effects-layer";
        this.element.prepend(this.container);
      }
      this.layer = this.container.firstElementChild;
      this.layer.removeAttribute("style");
      this.updateLayerSize();
    }
    this.target = type === "element" ? this.element : this.layer;
    this.target.style.transform = "";
    this.defineDimensions();
  }

  updateLayerSize() {
    const speedX = this.effects.translateX ? this.effects.translateX.speed * 10 : 0;
    const speedY = this.effects.translateY ? this.effects.translateY.speed * 10 : 0;
    this.layer.style.width = `${100 + speedX}%`;
    this.layer.style.height = `${100 + speedY}%`;
  }

  defineDimensions() {
    if (this.type !== "background") return;
    this.movable = {
      x: contentWidth(this.layer) - outerSize(this.dimensionsElement, "width"),
      y: contentHeight(this.layer) - outerSize(this.dimensionsElement, "height"),
    };
  }

  update() {
    if (!this.element.isConnected) return;
    const passed = this.range === "page" ? pageScrollPercentage() : viewportPercentage(this.parent);
    for (const [effect, options] of Object.entries(this.effects)) {
      let percent = passed;
      if (options.affectedRange) percent = Math.min(Math.max(percent, options.affectedRange.start), options.affectedRange.end);
      if (effect === "scale") {
        const movePoint = directionMovePoint(percent, options.direction, options.range);
        this.setRulePart("scale", 1 + (options.speed * movePoint) / 1000);
      } else {
        const axis = effect === "translateX" ? "x" : "y";
        const unit = effect === "rotateZ" ? "deg" : "px";
        if (options.direction) percent = 100 - percent;
        const step = this.type === "element" ? -(percent - 50) * options.speed : -((this.movable[axis] * percent) / 100);
        this.setRulePart(effect, step + unit);
      }
    }
    this.element.style.setProperty("--e-transform-transition-duration", "100ms");
  }

  setRulePart(key, value) {
    if (!this.rules[key]) {
      this.rules[key] = true;
      this.target.style.transform = Object.keys(this.rules).map((k) => `${k}(var(--${k}))`).join("");
    }
    this.target.style.setProperty(`--${key}`, value);
  }

  destroy() {
    this.parent.classList.remove("elementor-motion-effects-parent");
    this.element.classList.remove("elementor-motion-effects-element", "elementor-motion-effects-element-type-background");
    this.element.style.removeProperty("--e-transform-transition-duration");
    if (this.type === "element") {
      this.target.style.transform = "";
      Object.keys(this.rules).forEach((key) => this.target.style.removeProperty(`--${key}`));
    } else if (this.createdContainer) {
      this.container.remove();
    }
  }
}

function createInstances(root, instances) {
  const device = getDevice();
  for (const element of root.querySelectorAll("[data-settings]")) {
    if (instances.has(element) || element.closest(".elementor-sticky__spacer")) continue;
    const settings = readSettings(element);
    const created = [];
    for (const [name, type] of [["motion_fx", "element"], ["background_motion_fx", "background"]]) {
      if (settings[`${name}_motion_fx_scrolling`] !== "yes") continue;
      const devices = settings[`${name}_devices`];
      if (devices && !devices.includes(device)) continue;
      const effects = effectsFor(settings, name);
      if (!Object.keys(effects).length) continue;
      created.push(new MotionFx(element, { type, effects, range: settings[`${name}_range`] }));
    }
    if (created.length) instances.set(element, created);
  }
}

export default function initMotionFx(root) {
  let instances = new Map();
  let device = getDevice();
  let frame;
  const all = () => [...instances.values()].flat();

  // Viewport-range effects depend only on their parent's position, which is clamped to 0% / 100% once the
  // parent is off-screen — so they are skipped while it is, after one last update as it leaves.
  // This also keeps off-screen carousel slides still, as on the Elementor site.
  const visibleParents = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visibleParents.add(entry.target);
      } else {
        visibleParents.delete(entry.target);
        all().forEach((fx) => fx.parent === entry.target && fx.update());
      }
    }
    schedule();
  });
  const isActive = (fx) => fx.range === "page" || visibleParents.has(fx.parent);

  const updateAll = () => {
    frame = null;
    all().forEach((fx) => isActive(fx) && fx.update());
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(updateAll);
  };
  const observeAll = () => {
    all().forEach((fx) => {
      observer.observe(fx.parent);
      fx.update(); // initial position, as Elementor applies on init
    });
  };
  const destroyAll = () => {
    all().forEach((fx) => fx.destroy());
    observer.disconnect();
    visibleParents.clear();
    instances = new Map();
  };
  const onResize = () => {
    if (getDevice() !== device) {
      device = getDevice();
      destroyAll();
      createInstances(root, instances);
      observeAll();
    } else {
      for (const list of instances.values()) list.forEach((fx) => fx.defineDimensions());
    }
    schedule();
  };
  // Carousels clone slides for looping; pick up motion effects inside the new clones.
  const onDomChanged = () => {
    for (const [element, list] of [...instances]) {
      if (!element.isConnected) {
        list.forEach((fx) => { observer.unobserve(fx.parent); visibleParents.delete(fx.parent); });
        instances.delete(element);
      }
    }
    createInstances(root, instances);
    observeAll();
  };

  createInstances(root, instances);
  observeAll();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", onResize);
  root.addEventListener("mowix:dom-changed", onDomChanged);

  return () => {
    cancelAnimationFrame(frame);
    frame = null;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("load", onResize);
    root.removeEventListener("mowix:dom-changed", onDomChanged);
    destroyAll();
  };
}
