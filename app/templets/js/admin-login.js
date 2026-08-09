const API_BASE = "http://127.0.0.1:8000";

document.getElementById("adminLoginForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const err = document.getElementById("errorMsg");

    err.textContent = "";

    try {

        const response = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            err.textContent = data.detail || "Login failed";
            return;
        }

        if (!data.user.is_admin) {
            err.textContent = "This account does not have admin access.";
            return;
        }

        localStorage.setItem("admin_token", data.access_token);
        localStorage.setItem("admin_name", data.user.user_name);

        window.location.href = "admin-dashboard.html";

    } catch (error) {
        console.error(error);
        err.textContent = "Unable to connect to server.";
    }

});