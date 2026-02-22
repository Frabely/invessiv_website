const track = document.getElementById("track");
let dur = 16;
let dir = 1;

const setDur = () => {
  track.style.setProperty(
    "--dur",
    Math.max(6, Math.min(30, dur)).toFixed(2) + "s",
  );
  track.style.animationDirection = dir === 1 ? "normal" : "reverse";
};
setDur();

addEventListener(
  "wheel",
  (e) => {
    if (Math.abs(e.deltaY) < 1) return;
    dur += (e.deltaY > 0 ? -1 : 1) * 0.8;
    if (dur < 6) {
      dur = 6;
      dir = 1;
    }
    if (dur > 30) {
      dur = 30;
      dir = -1;
    }
    setDur();
  },
  { passive: true },
);
