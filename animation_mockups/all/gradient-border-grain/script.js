const c = document.querySelector(".glowcard");
c.addEventListener("pointermove", (e) => {
  const r = c.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * 100;
  const py = ((e.clientY - r.top) / r.height) * 100;
  c.style.setProperty("--hx", px.toFixed(2) + "%");
  c.style.setProperty("--hy", py.toFixed(2) + "%");
});
