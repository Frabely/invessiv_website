(() => {
  const canvas = document.getElementById("bg3d");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const points = [];
  const count = 180;
  let pointerX = 0;
  let pointerY = 0;
  let dpr = 1;

  const fit = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);
  };

  const seed = () => {
    points.length = 0;
    for (let i = 0; i < count; i += 1) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
      });
    }
  };

  canvas.addEventListener("pointermove", (event) => {
    const r = canvas.getBoundingClientRect();
    pointerX = (event.clientX - r.left) / r.width - 0.5;
    pointerY = (event.clientY - r.top) / r.height - 0.5;
  });

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = performance.now() * 0.0006;

    points.forEach((p) => {
      p.x += p.vx + pointerX * (reduced ? 0.03 : 0.22) * (p.z + 0.2);
      p.y += p.vy + pointerY * (reduced ? 0.03 : 0.22) * (p.z + 0.2);

      if (p.x < -30) p.x = canvas.width + 30;
      if (p.x > canvas.width + 30) p.x = -30;
      if (p.y < -30) p.y = canvas.height + 30;
      if (p.y > canvas.height + 30) p.y = -30;

      const wobble = Math.sin(t + p.z * 12) * 0.8;
      const size = (1 + p.z * 3.4) * dpr;
      const alpha = 0.16 + p.z * 0.45;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.beginPath();
      ctx.arc(p.x + wobble * 9, p.y + wobble * 5, size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    window.requestAnimationFrame(draw);
  };

  fit();
  seed();
  window.addEventListener("resize", () => {
    fit();
    seed();
  });
  window.requestAnimationFrame(draw);
})();
