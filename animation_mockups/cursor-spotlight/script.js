for (const card of document.querySelectorAll(".card")) {
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
