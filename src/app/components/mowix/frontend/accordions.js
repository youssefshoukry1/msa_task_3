// Nested Accordion widget: animated <details>, optionally one item open at a time.
import { controlValue, forEachWithSettings } from "./utils";

export default function initAccordions(root) {
  return forEachWithSettings(
    root,
    (settings, element) => element.classList.contains("elementor-widget-n-accordion"),
    (widget, settings) => {
      const items = Array.from(widget.querySelectorAll(":scope > .e-n-accordion > details.e-n-accordion-item"));
      const duration = Number(controlValue(settings.n_accordion_animation_duration)) || 400;
      const onlyOne = settings.max_items_expended === "one";
      const animations = new Map();

      const summaryOf = (item) => item.querySelector(":scope > summary");
      const animate = (item, open) => {
        animations.get(item)?.cancel();
        const summary = summaryOf(item);
        const startHeight = item.offsetHeight;
        item.style.overflow = "hidden";
        if (open) item.open = true;
        const endHeight = open ? item.scrollHeight : summary.offsetHeight;
        summary.setAttribute("aria-expanded", String(open));
        const animation = item.animate({ height: [`${startHeight}px`, `${endHeight}px`] }, { duration, easing: "ease-out" });
        animations.set(item, animation);
        animation.onfinish = () => {
          if (!open) item.open = false;
          item.style.overflow = "";
          animations.delete(item);
        };
      };

      const onClick = (event) => {
        event.preventDefault();
        const item = event.currentTarget.parentElement;
        // aria-expanded reflects the target state, also while an animation is still running.
        const isOpening = summaryOf(item).getAttribute("aria-expanded") !== "true";
        if (isOpening && onlyOne) {
          items.forEach((other) => {
            if (other !== item && summaryOf(other).getAttribute("aria-expanded") === "true") animate(other, false);
          });
        }
        animate(item, isOpening);
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape" && event.currentTarget.parentElement.open) {
          event.preventDefault();
          animate(event.currentTarget.parentElement, false);
        }
      };

      const summaries = items.map(summaryOf);
      summaries.forEach((summary) => {
        summary.addEventListener("click", onClick);
        summary.addEventListener("keydown", onKeyDown);
      });
      return () => {
        animations.forEach((animation) => animation.finish());
        summaries.forEach((summary) => {
          summary.removeEventListener("click", onClick);
          summary.removeEventListener("keydown", onKeyDown);
        });
      };
    },
  );
}
