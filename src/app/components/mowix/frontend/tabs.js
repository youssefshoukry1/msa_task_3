// Nested Tabs widget: click / keyboard activation with roving tabindex.
export default function initTabs(root) {
  const cleanups = [];
  for (const tabs of root.querySelectorAll(".elementor-widget-n-tabs .e-n-tabs")) {
    const titles = Array.from(tabs.querySelectorAll(":scope > .e-n-tabs-heading > .e-n-tab-title"));
    const panels = Array.from(tabs.querySelectorAll(":scope > .e-n-tabs-content > .e-con"));
    if (!titles.length) continue;

    const activate = (index) => {
      titles.forEach((title, i) => {
        title.setAttribute("aria-selected", String(i === index));
        title.setAttribute("tabindex", i === index ? "0" : "-1");
      });
      panels.forEach((panel, i) => panel.classList.toggle("e-active", i === index));
    };
    const onClick = (event) => {
      const index = titles.indexOf(event.currentTarget);
      if (titles[index].getAttribute("aria-selected") !== "true") activate(index);
    };
    const onKeyDown = (event) => {
      const index = titles.indexOf(event.currentTarget);
      const moves = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: titles.length - 1 };
      if (event.key in moves) {
        event.preventDefault();
        const next = (moves[event.key] + titles.length) % titles.length;
        titles.forEach((title, i) => title.setAttribute("tabindex", i === next ? "0" : "-1"));
        titles[next].focus();
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate(index);
      }
    };

    const initial = Math.max(0, titles.findIndex((title) => title.getAttribute("aria-selected") === "true"));
    activate(initial);
    tabs.classList.add("e-activated");
    tabs.setAttribute("data-touch-mode", String(window.matchMedia("(pointer: coarse)").matches));
    titles.forEach((title) => {
      title.addEventListener("click", onClick);
      title.addEventListener("keydown", onKeyDown);
    });
    cleanups.push(() => {
      titles.forEach((title) => {
        title.removeEventListener("click", onClick);
        title.removeEventListener("keydown", onKeyDown);
      });
      tabs.classList.remove("e-activated");
    });
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}
