(() => {
  const pages = {
    home: document.getElementById("home"),
    pricing: document.getElementById("pricing"),
  };
  const tabs = Array.from(document.querySelectorAll(".tab[data-route]"));
  let current = "home";

  Object.values(pages).forEach((page) => {
    if (page) {
      page.style.viewTransitionName = "pageView";
    }
  });

  const show = (route) => {
    Object.entries(pages).forEach(([key, page]) => {
      if (page) {
        page.dataset.on = key === route ? "1" : "0";
      }
    });
    current = route;
  };

  const setRoute = (route) => {
    if (!pages[route] || route === current) {
      return;
    }

    if (document.startViewTransition) {
      document.startViewTransition(() => show(route));
      return;
    }

    const currentPage = pages[current];
    if (!currentPage) {
      show(route);
      return;
    }

    currentPage.style.opacity = "0";
    setTimeout(() => {
      show(route);
      const nextPage = pages[route];
      if (nextPage) {
        nextPage.style.opacity = "0";
        nextPage.style.transition = "opacity 220ms ease";
        window.requestAnimationFrame(() => {
          nextPage.style.opacity = "1";
          setTimeout(() => {
            nextPage.style.transition = "";
          }, 240);
        });
      }
    }, 140);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setRoute(tab.dataset.route));
  });
})();
