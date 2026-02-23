const track = document.getElementById("track");

let x = 0;
let vx = 0;
let dragging = false;
let startX = 0;
let startOffset = 0;
let lastX = 0;
let lastT = 0;
let w = 0;
let rafCommit = 0;

function measure() {
  const first = track.children[0];
  if (!first) {
    return;
  }
  const rect = first.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(track).gap || "0");
  w = rect.width + gap;
}

function recycle() {
  if (!w) {
    return;
  }
  while (x >= w) {
    x -= w;
    track.appendChild(track.firstElementChild);
  }
  while (x < 0) {
    x += w;
    track.insertBefore(track.lastElementChild, track.firstElementChild);
  }
}

function commit() {
  rafCommit = 0;
  recycle();
  track.style.transform = `translate3d(${-Math.round(x)}px,0,0)`;
}

function scheduleCommit() {
  if (rafCommit) {
    return;
  }
  rafCommit = requestAnimationFrame(commit);
}

function onDown(e) {
  dragging = true;
  startX = e.clientX;
  startOffset = x;
  lastX = e.clientX;
  lastT = performance.now();
  vx = 0;
  track.setPointerCapture(e.pointerId);
}

function onMove(e) {
  if (!dragging) {
    return;
  }
  const dx = e.clientX - startX;
  x = startOffset - dx;

  const now = performance.now();
  const dt = Math.max(8, now - lastT);
  vx = (e.clientX - lastX) / dt;
  lastX = e.clientX;
  lastT = now;

  scheduleCommit();
}

function onUp(e) {
  dragging = false;
  try {
    track.releasePointerCapture(e.pointerId);
  } catch {
    // no-op
  }
}

function tick() {
  if (!dragging) {
    if (Math.abs(vx) > 0.0001) {
      x -= vx * 16 * 1.15;
      vx *= 0.92;
      scheduleCommit();
    } else {
      vx = 0;
    }
  }
  requestAnimationFrame(tick);
}

track.addEventListener("pointerdown", onDown, { passive: true });
track.addEventListener("pointermove", onMove, { passive: true });
track.addEventListener("pointerup", onUp, { passive: true });
track.addEventListener("pointercancel", onUp, { passive: true });

window.addEventListener("resize", () => {
  measure();
  x = 0;
  scheduleCommit();
});

measure();
scheduleCommit();
tick();