"use client";

import { useEffect, useRef } from "react";

// Full-bleed, muted, looping background video. Visitors who prefer reduced
// motion get the first frame as a still image instead of playback.
export default function CoverVideo({ src, position = "center center" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (query.matches) video.pause();
      else video.play().catch(() => {});
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    <video
      ref={videoRef}
      className="cover-image cover-video"
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      style={{ objectFit: "cover", objectPosition: position }}
    />
  );
}
