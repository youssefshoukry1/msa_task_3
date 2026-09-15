// Nav Menu widget (Elementor Pro): SmartMenus-style submenus plus the burger dropdown.
import { forEachWithSettings, outerSize } from "./utils";

// SmartMenus defaults used by Elementor.
const SHOW_TIMEOUT = 250;
const HIDE_TIMEOUT = 500;

// Inline styles SmartMenus applies to an open first-level submenu of the horizontal (desktop) menu.
const DESKTOP_SUBMENU_CSS = { "z-index": "3", "min-width": "10em", "max-width": "1000px", top: "auto", left: "0px", "margin-left": "0px", "margin-top": "0px" };

function setSubmenu(link, open, { desktop = false } = {}) {
  const sub = link.nextElementSibling;
  if (!sub || !sub.matches("ul")) return;
  link.classList.toggle("highlighted", open);
  link.setAttribute("aria-expanded", String(open));
  sub.setAttribute("aria-expanded", String(open));
  sub.setAttribute("aria-hidden", String(!open));
  sub.style.width = open ? "auto" : "";
  sub.style.display = open ? "block" : "";
  if (desktop) {
    for (const [property, value] of Object.entries(DESKTOP_SUBMENU_CSS)) sub.style.setProperty(property, open ? value : "");
  }
}

// Desktop horizontal menu: open on hover (with SmartMenus' delays) and on keyboard focus.
function initMainMenu(nav) {
  const cleanups = [];
  for (const item of nav.querySelectorAll(".menu-item-has-children")) {
    const link = item.querySelector(":scope > a.has-submenu");
    if (!link) continue;
    let timer;
    const toggle = (target, open) => setSubmenu(target, open, { desktop: true });
    const open = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        item.parentElement.querySelectorAll(":scope > li > a.highlighted").forEach((other) => other !== link && toggle(other, false));
        toggle(link, true);
      }, SHOW_TIMEOUT);
    };
    const close = () => {
      clearTimeout(timer);
      timer = setTimeout(() => toggle(link, false), HIDE_TIMEOUT);
    };
    const onFocusIn = () => { clearTimeout(timer); toggle(link, true); };
    const onFocusOut = (event) => { if (!item.contains(event.relatedTarget)) toggle(link, false); };
    // SmartMenus mouse mode: clicking a parent opens its submenu; it never closes it.
    const onClick = (event) => {
      if (link.getAttribute("href") === "#") event.preventDefault();
      clearTimeout(timer);
      toggle(link, true);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") { toggle(link, false); link.focus(); }
    };
    item.addEventListener("mouseenter", open);
    item.addEventListener("mouseleave", close);
    item.addEventListener("focusin", onFocusIn);
    item.addEventListener("focusout", onFocusOut);
    item.addEventListener("keydown", onKeyDown);
    link.addEventListener("click", onClick);
    cleanups.push(() => {
      clearTimeout(timer);
      item.removeEventListener("mouseenter", open);
      item.removeEventListener("mouseleave", close);
      item.removeEventListener("focusin", onFocusIn);
      item.removeEventListener("focusout", onFocusOut);
      item.removeEventListener("keydown", onKeyDown);
      link.removeEventListener("click", onClick);
      toggle(link, false);
    });
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}

// Burger toggle + full-width ("stretch") dropdown for tablet and mobile.
function initDropdown(widget, settings) {
  const toggle = widget.querySelector(".elementor-menu-toggle");
  const dropdown = widget.querySelector("nav.elementor-nav-menu--dropdown");
  if (!toggle || !dropdown) return () => {};
  const links = () => dropdown.querySelectorAll("a");

  const stretch = () => {
    if (settings.full_width !== "stretch") return;
    dropdown.style.width = "";
    dropdown.style.left = "";
    const left = dropdown.getBoundingClientRect().left + window.scrollX;
    dropdown.style.width = `${document.documentElement.clientWidth}px`;
    dropdown.style.left = `${-left}px`;
    dropdown.style.top = `${outerSize(toggle, "height")}px`;
  };
  const setOpen = (open) => {
    toggle.classList.toggle("elementor-active", open);
    toggle.setAttribute("aria-expanded", String(open));
    dropdown.setAttribute("aria-hidden", String(!open));
    dropdown.style.setProperty("--menu-height", open ? "1000vmax" : "0");
    links().forEach((a) => a.setAttribute("tabindex", open ? "0" : "-1"));
    if (!open) dropdown.querySelectorAll("a.highlighted").forEach((a) => setSubmenu(a, false));
  };
  const isOpen = () => toggle.classList.contains("elementor-active");

  const onToggle = () => setOpen(!isOpen());
  const onToggleKey = (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(); }
  };
  const onDropdownClick = (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    if (link.classList.contains("has-submenu")) {
      // Collapsible submenus: first tap opens, a second tap on "#" items closes.
      if (link.getAttribute("href") === "#" || !link.classList.contains("highlighted")) event.preventDefault();
      setSubmenu(link, !link.classList.contains("highlighted"));
    } else {
      setOpen(false);
    }
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape" && isOpen()) { setOpen(false); toggle.focus(); }
  };

  stretch();
  toggle.addEventListener("click", onToggle);
  toggle.addEventListener("keydown", onToggleKey);
  dropdown.addEventListener("click", onDropdownClick);
  widget.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", stretch);
  return () => {
    toggle.removeEventListener("click", onToggle);
    toggle.removeEventListener("keydown", onToggleKey);
    dropdown.removeEventListener("click", onDropdownClick);
    widget.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", stretch);
    setOpen(false);
    dropdown.style.removeProperty("--menu-height");
  };
}

export default function initNavMenus(root) {
  return forEachWithSettings(
    root,
    (settings, element) => element.classList.contains("elementor-widget-nav-menu"),
    (widget, settings) => {
      const main = widget.querySelector("nav.elementor-nav-menu--main");
      const cleanupMain = main ? initMainMenu(main) : () => {};
      const cleanupDropdown = initDropdown(widget, settings);
      return () => { cleanupMain(); cleanupDropdown(); };
    },
  );
}
