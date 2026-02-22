const shot = document.querySelector(".shot");
const set = (e) => {
  const r = shot.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  shot.style.setProperty("--x", x.toFixed(2) + "%");
  shot.style.setProperty("--y", y.toFixed(2) + "%");
};
shot.addEventListener("pointermove", set);
shot.addEventListener("pointerenter", set);
