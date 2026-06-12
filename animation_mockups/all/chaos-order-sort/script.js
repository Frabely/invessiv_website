const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
revealItems.forEach((item, index) => {
  item.style.setProperty("--d", `${index * 80}ms`);
});

const observer = new IntersectionObserver(
  ([entry]) => {
    if (!entry || !entry.isIntersecting) {
      return;
    }
    revealItems.forEach((item) => {
      item.setAttribute("data-visible", "true");
    });
    observer.disconnect();
  },
  { threshold: 0.2 },
);
observer.observe(document.getElementById("transform"));

const pairedItems = Array.from(document.querySelectorAll("[data-pair]"));

function setActivePair(pairIndex) {
  pairedItems.forEach((item) => {
    item.classList.toggle(
      "is-active",
      pairIndex !== null && item.dataset.pair === pairIndex,
    );
  });
}

pairedItems.forEach((item) => {
  item.addEventListener("mouseenter", () => setActivePair(item.dataset.pair));
  item.addEventListener("mouseleave", () => setActivePair(null));
});
