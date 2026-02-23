export function buildProcessJourneyPathD(
  stepCards: HTMLElement[],
  stepsContainer: HTMLElement,
) {
  const width = Math.max(960, Math.round(stepsContainer.clientWidth));
  const height = Math.max(760, Math.round(stepsContainer.scrollHeight + 24));
  const sidePadding = Math.max(46, Math.min(84, Math.round(width * 0.06)));
  const leftX = sidePadding;
  const rightX = width - sidePadding;
  const edgeShift = Math.max(12, Math.round(sidePadding * 0.26));
  const startX = Math.max(8, leftX - edgeShift * 4);
  const endX = Math.min(width - 8, rightX + edgeShift * 4);

  if (stepCards.length === 0) {
    return `M${startX} 30 C ${startX} 260, ${rightX} 260, ${endX} ${height - 40}`;
  }

  const firstCard = stepCards[0];
  const lastCard = stepCards[stepCards.length - 1];
  const startY = firstCard.offsetTop + firstCard.offsetHeight * 0.5;
  let d = `M${startX} ${startY}`;

  let currentX = startX;
  let currentY = startY;

  for (let index = 0; index < stepCards.length - 1; index += 1) {
    const currentCard = stepCards[index];
    const nextCard = stepCards[index + 1];
    const currentBottom = currentCard.offsetTop + currentCard.offsetHeight;
    const nextTop = nextCard.offsetTop;
    const availableGap = Math.max(0, nextTop - currentBottom);
    const laneY = currentBottom + availableGap * 0.5;
    const targetX = index % 2 === 0 ? rightX : leftX;
    d += ` L ${currentX} ${laneY}`;
    d += ` L ${targetX} ${laneY}`;

    currentX = targetX;
    currentY = laneY;
  }

  if (currentX !== rightX) {
    d += ` L ${rightX} ${currentY}`;
    currentX = rightX;
  }

  const endY = Math.min(
    height - 22,
    lastCard.offsetTop + lastCard.offsetHeight + 18,
  );
  d += ` L ${currentX} ${endY}`;
  d += ` L ${endX} ${endY}`;

  return d;
}

export function setupProcessJourney({
  dot,
  isMobile,
  path,
  reducedMotion,
  section,
  stepsContainer,
  stepCards,
}: {
  dot: SVGCircleElement;
  isMobile: boolean;
  path: SVGPathElement;
  reducedMotion: boolean;
  section: HTMLElement;
  stepsContainer: HTMLElement;
  stepCards: HTMLElement[];
}) {
  let pathLength = 0;
  let lastVisibleCount = 0;
  let pulseTimeout: number | null = null;

  const recalculatePath = () => {
    const svg = path.ownerSVGElement;
    if (svg) {
      const width = Math.max(960, Math.round(stepsContainer.clientWidth));
      const height = Math.max(
        760,
        Math.round(stepsContainer.scrollHeight + 24),
      );
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    const nextPath = buildProcessJourneyPathD(stepCards, stepsContainer);
    path.setAttribute("d", nextPath);
    pathLength = path.getTotalLength();
    path.style.strokeDasharray = String(pathLength);
  };

  recalculatePath();

  const setProgress = (progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    path.style.strokeDashoffset = String(pathLength - pathLength * clamped);
    const point = path.getPointAtLength(pathLength * clamped);
    dot.setAttribute("cx", point.x.toFixed(2));
    dot.setAttribute("cy", point.y.toFixed(2));

    let visibleCount = 0;
    stepCards.forEach((card) => {
      const cardMidY = card.offsetTop + card.offsetHeight * 0.5;
      const isVisible = point.y >= cardMidY;
      card.classList.toggle("is-visible", isVisible);
      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (visibleCount > lastVisibleCount) {
      dot.classList.remove("process-journey-dot--pulse-final");
      dot.classList.remove("process-journey-dot--pulse");
      void dot.getBoundingClientRect();
      dot.classList.add("process-journey-dot--pulse");
      if (pulseTimeout) {
        window.clearTimeout(pulseTimeout);
      }
      pulseTimeout = window.setTimeout(() => {
        dot.classList.remove("process-journey-dot--pulse");
      }, 320);
    }
    lastVisibleCount = visibleCount;

    const lastCard = stepCards[stepCards.length - 1];
    const finalStopY = lastCard
      ? lastCard.offsetTop + lastCard.offsetHeight * 0.5
      : Infinity;
    const isAtFinalStop = clamped >= 0.999 && point.y >= finalStopY - 1;
    if (isAtFinalStop) {
      if (pulseTimeout) {
        window.clearTimeout(pulseTimeout);
        pulseTimeout = null;
      }
      dot.classList.remove("process-journey-dot--pulse");
      dot.classList.add("process-journey-dot--pulse-final");
    } else {
      dot.classList.remove("process-journey-dot--pulse-final");
    }

    section.style.setProperty("--process-glow-x", `${point.x.toFixed(2)}px`);
    section.style.setProperty("--process-glow-y", `${point.y.toFixed(2)}px`);
    return clamped;
  };

  if (reducedMotion) {
    setProgress(1);
    stepCards.forEach((card) => card.classList.add("is-visible"));
    return () => {};
  }

  if (isMobile) {
    setProgress(1);

    if (!("IntersectionObserver" in window)) {
      stepCards.forEach((card) => card.classList.add("is-visible"));
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    stepCards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }

  let rafId = 0;

  const update = () => {
    const stepsRect = stepsContainer.getBoundingClientRect();
    const start = window.innerHeight * 0.9;
    const end = window.innerHeight * 0.24;
    const fullRange = stepsRect.height + (start - end);
    const progress = (start - stepsRect.top) / Math.max(1, fullRange);
    const acceleratedProgress = progress * 1.75;
    setProgress(acceleratedProgress);
    rafId = 0;
  };

  const requestUpdate = () => {
    if (rafId !== 0) {
      return;
    }
    rafId = window.requestAnimationFrame(update);
  };

  const handleResize = () => {
    recalculatePath();
    requestUpdate();
  };

  requestUpdate();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", handleResize);

  return () => {
    if (rafId !== 0) {
      window.cancelAnimationFrame(rafId);
    }
    if (pulseTimeout) {
      window.clearTimeout(pulseTimeout);
    }
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", handleResize);
  };
}
