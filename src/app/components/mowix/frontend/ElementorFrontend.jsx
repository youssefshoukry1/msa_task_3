"use client";
// Replaces Elementor's jQuery front-end: attaches widget behaviour to the server-rendered Mowix markup.
// The page markup stays in Server Components; this component renders nothing.
import { useEffect } from "react";
import initAccordions from "./accordions";
import initAnimations from "./animations";
import initBackgroundVideos from "./backgroundVideos";
import initCarousels from "./carousels";
import initCounters from "./counters";
import initMotionFx from "./motionFx";
import initNavMenus from "./navMenu";
import initSticky from "./sticky";
import initTabs from "./tabs";

// Carousels run first: their loop clones must exist before motion effects and animations scan the DOM.
const HANDLERS = [initCarousels, initTabs, initAccordions, initNavMenus, initSticky, initMotionFx, initAnimations, initCounters, initBackgroundVideos];

export default function ElementorFrontend({ rootSelector = ".elementor-kit-3" }) {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return undefined;
    const cleanups = HANDLERS.map((init) => init(root));
    return () => cleanups.reverse().forEach((cleanup) => cleanup());
  }, [rootSelector]);

  return null;
}
