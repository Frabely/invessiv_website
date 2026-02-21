"use client";

import { useEffect, useState } from "react";

export function ParallaxOrbs() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function onScroll() {
      setOffset(window.scrollY);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-[color:rgba(20,184,166,0.2)] blur-3xl"
        style={{ transform: `translateY(${offset * 0.08}px)` }}
      />
      <div
        className="absolute right-[-6rem] top-[28rem] h-72 w-72 rounded-full bg-[color:rgba(245,158,11,0.16)] blur-3xl"
        style={{ transform: `translateY(${-offset * 0.06}px)` }}
      />
      <div
        className="absolute left-[42%] top-[62rem] h-52 w-52 rounded-full bg-[color:rgba(20,184,166,0.14)] blur-3xl"
        style={{ transform: `translateY(${offset * 0.05}px)` }}
      />
    </div>
  );
}
