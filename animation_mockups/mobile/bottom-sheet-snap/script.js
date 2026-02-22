(() => {
  const sheet = document.getElementById("sheet");
  const handle = document.getElementById("handle");

  if (!sheet || !handle) {
    return;
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion) {
    sheet.dataset.state = "open";
    return;
  }

  const states = {
    open: 8,
    mid: 48,
  };

  let dragging = false;
  let startY = 0;
  let startTranslate = states.mid;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setTranslatePercent = (value) => {
    const bounded = clamp(value, states.open, states.mid);
    sheet.style.transform = `translateY(${bounded}%)`;
  };

  const commitState = (value) => {
    const next = value <= (states.open + states.mid) / 2 ? "open" : "mid";
    sheet.dataset.state = next;
    sheet.style.transform = "";
  };

  const onPointerMove = (event) => {
    if (!dragging) {
      return;
    }

    const deltaPx = event.clientY - startY;
    const deltaPercent = (deltaPx / Math.max(sheet.offsetHeight, 1)) * 100;
    const live = startTranslate + deltaPercent;
    setTranslatePercent(live);
  };

  const onPointerUp = (event) => {
    if (!dragging) {
      return;
    }

    dragging = false;
    handle.releasePointerCapture(event.pointerId);

    const matrix = window.getComputedStyle(sheet).transform;
    let currentPercent = states.mid;

    if (matrix && matrix !== "none") {
      const values = matrix.match(/matrix\(([^)]+)\)/);
      if (values) {
        const parts = values[1].split(",").map((v) => Number(v.trim()));
        const translatePx = parts[5] || 0;
        currentPercent = (translatePx / Math.max(sheet.offsetHeight, 1)) * 100;
      }
    }

    commitState(clamp(currentPercent, states.open, states.mid));
  };

  handle.addEventListener("click", () => {
    sheet.dataset.state = sheet.dataset.state === "open" ? "mid" : "open";
  });

  handle.addEventListener("pointerdown", (event) => {
    dragging = true;
    startY = event.clientY;
    startTranslate = sheet.dataset.state === "open" ? states.open : states.mid;
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", onPointerUp);
  handle.addEventListener("pointercancel", onPointerUp);

  sheet.dataset.state = "mid";
})();
