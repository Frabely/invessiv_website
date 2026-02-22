const magneticButtons = document.querySelectorAll(".magnetic");

for (const button of magneticButtons) {
  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dx = (x - rect.width / 2) * 0.12;
    const dy = (y - rect.height / 2) * 0.2;
    button.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  button.addEventListener("pointerleave", () => {
    button.style.transform = "translate(0px, 0px)";
  });
}

const spotlightCards = document.querySelectorAll(".spotlight-card");

for (const card of spotlightCards) {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--mx", "-999px");
    card.style.setProperty("--my", "-999px");
  });
}

const lines = document.querySelectorAll(".mask-line");

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      entry.target.style.setProperty(
        "--mask",
        entry.isIntersecting ? "102%" : "0%",
      );
    }
  },
  { threshold: 0.45 },
);

for (const line of lines) {
  observer.observe(line);
}
