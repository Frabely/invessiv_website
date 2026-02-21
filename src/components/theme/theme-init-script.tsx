export function ThemeInitScript() {
  const script = `
    (function () {
      try {
        var storedTheme = localStorage.getItem("invessiv_theme");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = storedTheme === "dark" || storedTheme === "light"
          ? storedTheme
          : (prefersDark ? "dark" : "light");
        document.documentElement.dataset.theme = theme;
      } catch (error) {
        document.documentElement.dataset.theme = "light";
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
