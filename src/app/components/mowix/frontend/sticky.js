// Sticky containers (Elementor Pro "Motion Effects > Sticky"), a port of elementor-pro's jquery.sticky.
import { forEachWithSettings, getDevice, outerSize, responsiveValue } from "./utils";

const CLASSES = {
  sticky: ["elementor-sticky"],
  active: ["elementor-sticky--active", "elementor-section--handles-inside"],
  effects: ["elementor-sticky--effects"],
  spacer: "elementor-sticky__spacer",
};
const STICK_PROPS = ["position", "width", "margin-top", "margin-bottom", "top", "bottom", "inset-inline-start"];
const FOLLOW_PROPS = ["position", "inset-inline-start", "top", "bottom"];

const backup = (element, props) => Object.fromEntries(props.map((p) => [p, element.style.getPropertyValue(p)]));
const restore = (element, css) => Object.entries(css).forEach(([p, v]) => element.style.setProperty(p, v));

function viewportOffset(element) {
  const top = element.getBoundingClientRect().top;
  const height = outerSize(element, "height");
  return { top: { fromTop: top, fromBottom: top - window.innerHeight }, bottom: { fromTop: top + height, fromBottom: top - window.innerHeight + height } };
}

function createSticky(element, settings) {
  const to = settings.sticky;
  const isTop = to === "top";
  const parent = settings.sticky_parent ? element.parentElement.closest(".e-con, .e-con-inner, .elementor-widget-wrap") : null;
  let offset = 0;
  let effectsOffset = 0;
  let isSticky = false;
  let isFollowingParent = false;
  let isReachedEffectsPoint = false;
  let spacer = null;
  let unstickyCss = null;
  let notFollowingCss = null;
  let parentCss = null;

  const readOffsets = () => {
    offset = Number(responsiveValue(settings, "sticky_offset")) || 0;
    effectsOffset = Number(responsiveValue(settings, "sticky_effects_offset")) || 0;
  };

  const stickElement = () => {
    unstickyCss = backup(element, STICK_PROPS);
    // Measure while still in flow; once fixed, percentage widths resolve against the viewport.
    const left = element.getBoundingClientRect().left;
    const width = outerSize(element, "width");
    element.style.position = "fixed";
    element.style.width = `${width}px`;
    element.style.marginTop = "0px";
    element.style.marginBottom = "0px";
    element.style.setProperty(to, `${offset}px`);
    element.style.setProperty(isTop ? "bottom" : "top", "");
    element.style.setProperty("inset-inline-start", `${left}px`);
    element.classList.add(...CLASSES.active);
  };
  const unstickElement = () => {
    restore(element, unstickyCss);
    element.classList.remove(...CLASSES.active);
  };
  const followParent = () => {
    parentCss = backup(parent, ["position"]);
    parent.style.position = "relative";
    notFollowingCss = backup(element, FOLLOW_PROPS);
    element.style.position = "absolute";
    element.style.setProperty("inset-inline-start", "0px");
    element.style.setProperty(isTop ? "bottom" : "top", "0px");
    element.style.setProperty(to, "");
    isFollowingParent = true;
  };
  const unfollowParent = () => {
    restore(parent, parentCss);
    restore(element, notFollowingCss);
    isFollowingParent = false;
  };
  const stick = () => {
    spacer = element.cloneNode(true);
    spacer.classList.add(CLASSES.spacer);
    spacer.style.visibility = "hidden";
    spacer.style.transition = "none";
    spacer.style.animation = "none";
    element.after(spacer);
    isSticky = true;
    stickElement();
  };
  const unstick = () => {
    isSticky = false;
    unstickElement();
    spacer.remove();
    spacer = null;
  };
  const checkParent = () => {
    const elementOffset = viewportOffset(element);
    if (isFollowingParent) {
      const needUnfollow = isTop ? elementOffset.top.fromTop > offset : elementOffset.bottom.fromBottom < -offset;
      if (needUnfollow) unfollowParent();
    } else {
      const parentOffset = viewportOffset(parent);
      const parentStyle = getComputedStyle(parent);
      const border = parseFloat(isTop ? parentStyle.borderBottomWidth : parentStyle.borderTopWidth);
      const distance = isTop ? parentOffset.bottom.fromTop - border : parentOffset.top.fromBottom + border;
      const needFollow = isTop ? distance <= elementOffset.bottom.fromTop : distance >= elementOffset.top.fromBottom;
      if (needFollow) followParent();
    }
  };
  const checkEffectsPoint = (distance) => {
    if (isReachedEffectsPoint && -distance < effectsOffset) {
      element.classList.remove(...CLASSES.effects);
      isReachedEffectsPoint = false;
    } else if (!isReachedEffectsPoint && -distance >= effectsOffset) {
      element.classList.add(...CLASSES.effects);
      isReachedEffectsPoint = true;
    }
  };
  const checkPosition = () => {
    let distance;
    if (isSticky) {
      const spacerOffset = viewportOffset(spacer);
      distance = isTop ? spacerOffset.top.fromTop - offset : -spacerOffset.bottom.fromBottom - offset;
      if (parent) checkParent();
      if (distance > 0) {
        if (isFollowingParent) unfollowParent();
        unstick();
      }
    } else {
      const elementOffset = viewportOffset(element);
      distance = isTop ? elementOffset.top.fromTop - offset : -elementOffset.bottom.fromBottom - offset;
      if (distance <= 0) {
        stick();
        if (parent) checkParent();
      }
    }
    checkEffectsPoint(distance);
  };
  const onResize = () => {
    readOffsets();
    if (!isSticky) return checkPosition();
    if (isFollowingParent) unfollowParent();
    unstickElement();
    // Measure the in-flow spacer so the re-stuck element takes the new width and left edge.
    spacer.style.visibility = "";
    element.style.display = "none";
    const rect = spacer.getBoundingClientRect();
    element.style.display = "";
    spacer.style.visibility = "hidden";
    stickElement();
    element.style.width = `${rect.width}px`;
    element.style.setProperty("inset-inline-start", `${rect.left}px`);
    if (parent) checkParent();
  };

  readOffsets();
  element.classList.add(...CLASSES.sticky);
  window.addEventListener("scroll", checkPosition, { passive: true });
  window.addEventListener("resize", onResize);
  checkPosition();

  return () => {
    window.removeEventListener("scroll", checkPosition);
    window.removeEventListener("resize", onResize);
    if (isFollowingParent) unfollowParent();
    if (isSticky) unstick();
    element.classList.remove(...CLASSES.sticky, ...CLASSES.effects);
  };
}

export default function initSticky(root) {
  return forEachWithSettings(
    root,
    (settings) => Boolean(settings.sticky) && (!settings.sticky_on || settings.sticky_on.includes(getDevice())),
    createSticky,
  );
}
