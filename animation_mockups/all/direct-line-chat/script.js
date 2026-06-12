const items = Array.from(document.querySelectorAll("[data-reveal]"));
items.forEach((item, index) => {
  item.style.setProperty("--d", `${index * 160}ms`);
});

const section = document.getElementById("demo");

if (!("IntersectionObserver" in window)) {
  items.forEach((item) => {
    item.dataset.visible = "true";
  });
} else {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry || !entry.isIntersecting) {
        return;
      }
      items.forEach((item) => {
        item.dataset.visible = "true";
      });
      observer.disconnect();
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
  );
  observer.observe(section);
}
