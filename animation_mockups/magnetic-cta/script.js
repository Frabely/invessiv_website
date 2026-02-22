const cta = document.querySelector(".cta");

cta?.addEventListener("pointermove", (event) => {
  const rect = cta.getBoundingClientRect();
  const dx = (event.clientX - rect.left - rect.width / 2) * 0.13;
  const dy = (event.clientY - rect.top - rect.height / 2) * 0.2;
  cta.style.transform = `translate(${dx}px, ${dy}px)`;
});

cta?.addEventListener("pointerleave", () => {
  cta.style.transform = "translate(0px, 0px)";
});
