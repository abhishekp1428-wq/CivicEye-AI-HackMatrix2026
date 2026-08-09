/*==================================================
        CIVICEYE AI — SHARED THEME SCRIPT
        Include this on every page, ideally in <head>
        so the theme applies before the page paints.
==================================================*/

(function () {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
})();

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    return next;
}

// Keep any theme toggle switch on the page in sync with the current theme
document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        themeToggle.checked = current === "dark";

        themeToggle.addEventListener("change", () => {
            setTheme(themeToggle.checked ? "dark" : "light");
        });
    }
});