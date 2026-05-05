/**
 * Runs before React hydrates. Values must stay aligned with `src/FSD/shared/lib/theme/constants.ts`.
 */
(function themeInit() {
  try {
    var STORAGE_KEY = "dots-theme";
    var THEME_LIGHT = "light";
    var THEME_DARK = "dark";
    var stored = localStorage.getItem(STORAGE_KEY);
    var root = document.documentElement;

    if (stored === THEME_LIGHT || stored === THEME_DARK) {
      root.setAttribute("data-theme", stored);
      return;
    }

    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    root.setAttribute("data-theme", prefersLight ? THEME_LIGHT : THEME_DARK);
  } catch (_err) {
    /* Storage unavailable (private mode, etc.) */
  }
})();
