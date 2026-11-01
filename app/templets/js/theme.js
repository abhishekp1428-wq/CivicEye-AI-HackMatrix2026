/*==================================================
        CIVICEYE AI — SHARED THEME SCRIPT
        Include this on every page, ideally in <head>
        so the theme applies before the page paints.
==================================================*/

(function () {
    const savedTheme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
})();

function setTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", selectedTheme);
    localStorage.setItem("theme", selectedTheme);
    syncThemeControls();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    return next;
}

function syncThemeControls() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const themeToggle = document.getElementById("themeToggle");
    const themeToggleButton = document.getElementById("themeToggleButton");

    if (themeToggle) {
        themeToggle.checked = isDark;
    }

    if (themeToggleButton) {
        themeToggleButton.setAttribute("aria-pressed", String(isDark));
        themeToggleButton.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
        themeToggleButton.textContent = isDark ? "☀ Light mode" : "☾ Dark mode";
    }
}

// Keep theme controls on the page in sync with the current theme.
document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        syncThemeControls();

        themeToggle.addEventListener("change", () => {
            setTheme(themeToggle.checked ? "dark" : "light");
        });
    }

    const themeToggleButton = document.getElementById("themeToggleButton");
    if (themeToggleButton) {
        syncThemeControls();
        themeToggleButton.addEventListener("click", toggleTheme);
    }
});