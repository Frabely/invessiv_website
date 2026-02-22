const t = document.getElementById("toggle");
const status = document.getElementById("status");

function set(on) {
  t.classList.toggle("on", on);
  t.setAttribute("aria-pressed", on ? "true" : "false");
  status.textContent = on ? "ON" : "OFF";
  t.style.setProperty("--sx", on ? 1.03 : 1.01);
  setTimeout(() => t.style.setProperty("--sx", on ? 1.02 : 1.0), 110);
}

let on = false;
t.addEventListener("click", () => {
  on = !on;
  set(on);
});

set(false);
