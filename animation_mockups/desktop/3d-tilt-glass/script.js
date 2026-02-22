const card = document.querySelector(".tilt");
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

let rx = 0,
  ry = 0,
  sx = 50,
  sy = 50;
let trx = 0,
  try_ = 0,
  tsx = 50,
  tsy = 50;

const set = () => {
  rx = lerp(rx, trx, 0.16);
  ry = lerp(ry, try_, 0.16);
  sx = lerp(sx, tsx, 0.12);
  sy = lerp(sy, tsy, 0.12);
  card.style.setProperty("--rx", rx.toFixed(2) + "deg");
  card.style.setProperty("--ry", ry.toFixed(2) + "deg");
  card.style.setProperty("--sx", sx.toFixed(2) + "%");
  card.style.setProperty("--sy", sy.toFixed(2) + "%");
  requestAnimationFrame(set);
};
set();

const move = (e) => {
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;

  const dx = px - 0.5;
  const dy = py - 0.5;

  try_ = clamp(dx * 14, -14, 14);
  trx = clamp(-dy * 12, -12, 12);

  tsx = clamp(px * 100, 0, 100);
  tsy = clamp(py * 100, 0, 100);
};

card.addEventListener("pointermove", move);
card.addEventListener("pointerenter", () => {
  card.querySelector(".shine").style.opacity = 1;
});
const reset = () => {
  trx = 0;
  try_ = 0;
  tsx = 45;
  tsy = 30;
  card.querySelector(".shine").style.opacity = 0.85;
};
card.addEventListener("pointerleave", reset);
card.addEventListener("blur", reset);
reset();
