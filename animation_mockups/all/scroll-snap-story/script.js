(() => {
  const box = document.getElementById("snapBox");
  const panels = Array.from(document.querySelectorAll(".panel"));

  if (!box || panels.length === 0) {
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    return;
  }

  let ticking = false;

  const update = () => {
    const r = box.getBoundingClientRect();
    panels.forEach((panel) => {
      const pr = panel.getBoundingClientRect();
      const mid = pr.top + pr.height / 2;
      const rel = (mid - r.top) / r.height - 0.5;
      panel.style.setProperty("--py", `${rel * 16}px`);
    });
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };

  box.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
