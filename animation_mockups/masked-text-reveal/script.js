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

for (const line of document.querySelectorAll(".line")) {
  observer.observe(line);
}
