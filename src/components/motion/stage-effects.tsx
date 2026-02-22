"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

export function StageEffects() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [meshOffset, setMeshOffset] = useState(0);
  const [pointer, setPointer] = useState({ x: 50, y: 40, active: false });

  useEffect(() => {
    function onScroll() {
      const root = document.documentElement;
      const max = Math.max(root.scrollHeight - window.innerHeight, 1);
      const percent = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      setScrollProgress(percent);
      setMeshOffset(window.scrollY * 0.08);
    }

    function onPointerMove(event: PointerEvent) {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      setPointer({ x, y, active: true });
    }

    function onPointerLeave() {
      setPointer((prev) => ({ ...prev, active: false }));
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="stage-layer">
        <div
          className="stage-mesh"
          style={{ transform: `translate3d(0, ${meshOffset}px, 0)` }}
        />
        <div className="stage-grain" />
      </div>
      <div
        aria-hidden="true"
        className={`stage-spotlight ${pointer.active ? "opacity-100" : "opacity-0"}`}
        style={
          {
            "--cx": `${pointer.x}%`,
            "--cy": `${pointer.y}%`,
          } as CSSProperties
        }
      />
      <div aria-hidden="true" className="stage-scrollbar">
        <i style={{ width: `${scrollProgress}%` }} />
      </div>
    </>
  );
}
