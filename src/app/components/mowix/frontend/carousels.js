// Nested Carousel widget (Elementor Pro), on Swiper 8 — the version Elementor bundles and styles.
import Swiper, { A11y, Autoplay, Navigation, Pagination } from "swiper";
import { BREAKPOINTS, forEachWithSettings, responsiveValue } from "./utils";

function swiperOptions(widget, settings) {
  const slidesToShow = +settings.slides_to_show || 3;
  const isSingleSlide = slidesToShow === 1;
  const perView = {
    desktop: slidesToShow,
    tablet: +settings.slides_to_show_tablet || (isSingleSlide ? 1 : 2),
    mobile: +settings.slides_to_show_mobile || 1,
  };
  const perGroup = (device) => (device === "desktop" && isSingleSlide ? 1 : +settings[device === "desktop" ? "slides_to_scroll" : `slides_to_scroll_${device}`] || 1);
  const spacing = (device) => +responsiveValue(settings, "image_spacing_custom", device) || 0;
  const device = (name) => ({ slidesPerView: perView[name], slidesPerGroup: perGroup(name), spaceBetween: spacing(name) });

  // Swiper breakpoints are min-widths; Elementor's are max-widths.
  const options = {
    modules: [A11y, Autoplay, Navigation, Pagination],
    ...device("mobile"),
    breakpoints: { [BREAKPOINTS.mobile + 1]: device("tablet"), [BREAKPOINTS.tablet + 1]: device("desktop") },
    loop: settings.infinite === "yes",
    speed: settings.speed,
    observer: true,
    observeParents: true, // re-measure when a hidden tab panel becomes visible
    a11y: { enabled: true },
  };
  if (settings.autoplay === "yes") {
    options.autoplay = { delay: settings.autoplay_speed, disableOnInteraction: settings.pause_on_interaction === "yes" };
  }
  const prevEl = widget.querySelector(".elementor-swiper-button-prev");
  const nextEl = widget.querySelector(".elementor-swiper-button-next");
  if (settings.arrows === "yes" && prevEl && nextEl) options.navigation = { prevEl, nextEl };
  const paginationEl = widget.querySelector(".swiper-pagination");
  if (settings.pagination && paginationEl) options.pagination = { el: paginationEl, type: settings.pagination, clickable: true };
  return options;
}

// Hide slides outside the visible window from assistive tech and keyboard, like Elementor does.
function updateSlideVisibility(swiper) {
  const perView = Math.ceil(swiper.params.slidesPerView) || 1;
  Array.from(swiper.slides).forEach((slide, index) => {
    const visible = index >= swiper.activeIndex && index < swiper.activeIndex + perView;
    slide.toggleAttribute("inert", !visible);
    if (visible) slide.removeAttribute("aria-hidden");
    else slide.setAttribute("aria-hidden", "true");
  });
}

export default function initCarousels(root) {
  return forEachWithSettings(
    root,
    (settings, element) => element.classList.contains("elementor-widget-n-carousel"),
    (widget, settings) => {
      const container = widget.querySelector(".e-n-carousel.swiper");
      if (!container) return null;
      const notifyDomChanged = () => root.dispatchEvent(new CustomEvent("mowix:dom-changed"));
      const swiper = new Swiper(container, {
        ...swiperOptions(widget, settings),
        on: {
          afterInit: (s) => { updateSlideVisibility(s); notifyDomChanged(); },
          slideChange: updateSlideVisibility,
          breakpoint: (s) => requestAnimationFrame(() => { updateSlideVisibility(s); notifyDomChanged(); }),
        },
      });
      widget.classList.add("e-widget-swiper");

      const pause = () => swiper.autoplay.stop();
      const resume = () => swiper.autoplay.start();
      if (settings.pause_on_hover === "yes" && settings.autoplay === "yes") {
        container.addEventListener("mouseenter", pause);
        container.addEventListener("mouseleave", resume);
      }
      return () => {
        container.removeEventListener("mouseenter", pause);
        container.removeEventListener("mouseleave", resume);
        swiper.destroy(true, true);
        widget.classList.remove("e-widget-swiper");
        container.querySelectorAll(".swiper-slide").forEach((slide) => { slide.removeAttribute("inert"); slide.removeAttribute("aria-hidden"); });
      };
    },
  );
}
