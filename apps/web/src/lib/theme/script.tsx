const THEME_STORAGE_KEY = "gst_billing.theme";
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function ThemeScript() {
  const script = `
    (function () {
      try {
        var key = ${JSON.stringify(THEME_STORAGE_KEY)};
        var stored = window.localStorage.getItem(key) || "system";
        var media = window.matchMedia(${JSON.stringify(THEME_MEDIA_QUERY)});
        var resolved = stored === "system" ? (media.matches ? "dark" : "light") : stored;
        var root = document.documentElement;
        root.dataset.theme = resolved;
        root.style.colorScheme = resolved;
      } catch (error) {
        document.documentElement.dataset.theme = "light";
        document.documentElement.style.colorScheme = "light";
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
