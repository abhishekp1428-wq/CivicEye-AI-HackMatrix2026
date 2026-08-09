const API_BASE = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
        window.location.href = "login.html";
        return;
    }

    const current = window.location.pathname.split("/").pop();
    document.querySelectorAll(".nav a").forEach(link => {
        if (link.getAttribute("href") === current) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            const ok = confirm("Logout from CivicEye AI?");
            if (ok) {
                localStorage.removeItem("token");
                localStorage.removeItem("user_id");
                localStorage.removeItem("user_name");
                localStorage.removeItem("email");
                localStorage.removeItem("mobile");
                window.location.href = "login.html";
            }
        });
    }

    loadProfile();

    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
        profileForm.addEventListener("submit", saveProfile);
    }

    const deleteBtn = document.getElementById("deleteAccountBtn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", deleteAccount);
    }

});


async function loadProfile() {

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(`${API_BASE}/users/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            console.error("Failed to load profile:", response.status);
            return;
        }

        const user = await response.json();

        document.getElementById("userName").textContent = user.user_name;
        document.getElementById("user_name").value = user.user_name;
        document.getElementById("email").value = user.email;
        document.getElementById("mobile").value = user.mobile;

    } catch (error) {
        console.error("Error loading profile:", error);
    }

}


async function saveProfile(e) {

    e.preventDefault();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    const msg = document.getElementById("profileMsg");
    const saveBtn = document.getElementById("saveProfileBtn");

    const user_name = document.getElementById("user_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const password = document.getElementById("password").value;

    const payload = { user_name, email, mobile };
    if (password) payload.password = password;

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    msg.textContent = "";
    msg.style.color = "";

    try {

        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            msg.textContent = data.detail || "Failed to update profile";
            msg.style.color = "#dc2626";
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Changes";
            return;
        }

        localStorage.setItem("user_name", data.user_name);
        localStorage.setItem("email", data.email);
        localStorage.setItem("mobile", data.mobile);

        document.getElementById("userName").textContent = data.user_name;
        document.getElementById("password").value = "";

        msg.textContent = "Profile updated successfully ✅";
        msg.style.color = "#16a34a";

    } catch (error) {
        console.error(error);
        msg.textContent = "Server connection failed";
        msg.style.color = "#dc2626";
    }

    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";

}


async function deleteAccount() {

    const confirmed = confirm(
        "Are you sure you want to permanently delete your account? This cannot be undone."
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    try {

        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.detail || "Failed to delete account");
            return;
        }

        alert("Account deleted successfully.");

        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("email");
        localStorage.removeItem("mobile");

        window.location.href = "login.html";

    } catch (error) {
        console.error(error);
        alert("Server connection failed");
    }

}