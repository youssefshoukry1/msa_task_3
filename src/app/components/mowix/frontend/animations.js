// Entrance animations (Elementor "Motion Effects > Entrance Animation").
import { forEachWithSettings, getDevice, onceInViewport } from "./utils";

function animationFor(settings) {
  const device = getDevice();
  const suffix = device === "desktop" ? "" : `_${device}`;
  return settings[`_animation${suffix}`] || settings[`animation${suffix}`] || settings._animation || settings.animation;
}

export default function initAnimations(root) {
  return forEachWithSettings(root, (settings) => Boolean(settings._animation || settings.animation), (element, settings) => {
    const animation = animationFor(settings);
    if (!animation || animation === "none") {
      element.classList.remove("elementor-invisible");
      return null;
    }
    let timer;
    const stop = onceInViewport(element, () => {
      const delay = settings._animation_delay || settings.animation_delay || 0;
      timer = setTimeout(() => {
        element.classList.remove("elementor-invisible");
        element.classList.add("animated", animation);
      }, delay);
    });
    return () => {
      stop();
      clearTimeout(timer);
    };
  });
}
