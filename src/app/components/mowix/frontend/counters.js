// Counter widget: counts from data-from-value to data-to-value when scrolled into view (jquery-numerator port).
import { onceInViewport } from "./utils";

const swing = (p) => 0.5 - Math.cos(p * Math.PI) / 2;

function format(value, rounding, delimiter) {
  const [integer, decimals] = value.toFixed(rounding).split(".");
  const grouped = delimiter ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, delimiter) : integer;
  return decimals ? `${grouped}.${decimals}` : grouped;
}

export default function initCounters(root) {
  const cleanups = [];
  for (const number of root.querySelectorAll(".elementor-counter-number[data-to-value]")) {
    const toRaw = number.getAttribute("data-to-value");
    const to = parseFloat(toRaw);
    const from = parseFloat(number.getAttribute("data-from-value")) || 0;
    const duration = parseFloat(number.getAttribute("data-duration")) || 2000;
    const delimiter = number.getAttribute("data-delimiter") || "";
    const rounding = (toRaw.split(".")[1] || "").length;
    let frame;

    const stop = onceInViewport(number, () => {
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        number.textContent = format(from + (to - from) * swing(progress), rounding, delimiter);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    cleanups.push(() => {
      stop();
      cancelAnimationFrame(frame);
    });
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}
