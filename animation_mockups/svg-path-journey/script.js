(() => {
  const path = document.getElementById("journeyPath");
  const dot = document.getElementById("travelDot");
  const milestones = Array.from(document.querySelectorAll(".milestone"));

  if (!path || !dot) {
    return;
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const length = path.getTotalLength();

  path.style.strokeDasharray = String(length);
  path.style.strokeDashoffset = String(length);

  const setProgress = (progress) => {
    const clamped = Math.max(0, Math.min(1, progress));
    path.style.strokeDashoffset = String(length - length * clamped);

    const point = path.getPointAtLength(length * clamped);
    dot.setAttribute("cx", point.x.toFixed(2));
    dot.setAttribute("cy", point.y.toFixed(2));

    milestones.forEach((card, index) => {
      const threshold = (index + 1) / milestones.length;
      card.classList.toggle("is-visible", clamped >= threshold - 0.12);
    });
  };

  if (reducedMotion) {
    setProgress(1);
    return;
  }

  let ticking = false;

  const update = () => {
    const scrollRange =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? window.scrollY / scrollRange : 1;
    setProgress(progress);
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };

  setProgress(0.02);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
})();
