const API_BASE = "http://127.0.0.1:8000";
const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved", "Rejected"];

document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("admin_token");
    if (!token) {
        window.location.href = "admin-login.html";
        return;
    }

    const adminName = localStorage.getItem("admin_name");
    document.getElementById("adminName").textContent = adminName ? `Logged in as ${adminName}` : "";

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_name");
        window.location.href = "admin-login.html";
    });

    document.getElementById("searchInput").addEventListener("input", debounce(loadComplaints, 300));
    document.getElementById("statusFilter").addEventListener("change", loadComplaints);

    loadComplaints();

});


function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}


async function loadComplaints() {

    const token = localStorage.getItem("admin_token");
    const search = document.getElementById("searchInput").value;
    const status = document.getElementById("statusFilter").value;

    const url = new URL(`${API_BASE}/admin/complaints`);
    if (search) url.searchParams.append("search", search);
    if (status && status !== "All") url.searchParams.append("status", status);

    try {

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Session expired or not authorized as admin.");
            localStorage.removeItem("admin_token");
            window.location.href = "admin-login.html";
            return;
        }

        const data = await response.json();
        renderTable(data);

    } catch (error) {
        console.error("Error loading complaints:", error);
    }

}


function renderTable(complaints) {

    const tbody = document.getElementById("complaintsTableBody");
    tbody.innerHTML = "";

    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">No complaints found.</td></tr>`;
        return;
    }

    complaints.forEach(c => {

        const tr = document.createElement("tr");

        const statusOptionsHtml = STATUS_OPTIONS.map(s =>
            `<option value="${s}" ${s === c.status ? "selected" : ""}>${s}</option>`
        ).join("");

        tr.innerHTML = `
            <td>#${c.id}</td>
            <td>${escapeHtml(c.user_name)}<br><span style="color:#64748b; font-size:11.5px;">${escapeHtml(c.user_email)}</span></td>
            <td>${escapeHtml(c.title)}</td>
            <td>${escapeHtml(c.location)}</td>
            <td>${escapeHtml(c.severity || "N/A")}</td>
            <td><input type="text" class="row-select dept-input" value="${escapeHtml(c.department || '')}" style="width:110px;"></td>
            <td>
                <select class="row-select status-select">
                    ${statusOptionsHtml}
                </select>
            </td>
            <td>
                <button class="action-btn save-btn" onclick="saveComplaint(${c.id}, this)">Save</button>
                <button class="action-btn delete-btn" onclick="deleteComplaint(${c.id})">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);

    });

}


async function saveComplaint(id, btn) {

    const token = localStorage.getItem("admin_token");
    const row = btn.closest("tr");

    const status = row.querySelector(".status-select").value;
    const department = row.querySelector(".dept-input").value.trim();

    btn.disabled = true;
    btn.textContent = "Saving...";

    try {

        const response = await fetch(`${API_BASE}/admin/complaints/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status, department })
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.detail || "Failed to update complaint");
            btn.disabled = false;
            btn.textContent = "Save";
            return;
        }

        btn.textContent = "Saved ✓";
        setTimeout(() => {
            btn.textContent = "Save";
            btn.disabled = false;
        }, 1200);

    } catch (error) {
        console.error(error);
        alert("Server connection failed");
        btn.disabled = false;
        btn.textContent = "Save";
    }

}


async function deleteComplaint(id) {

    const confirmed = confirm(`Delete complaint #${id}? This cannot be undone.`);
    if (!confirmed) return;

    const token = localStorage.getItem("admin_token");

    try {

        const response = await fetch(`${API_BASE}/admin/complaints/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.detail || "Failed to delete complaint");
            return;
        }

        loadComplaints();

    } catch (error) {
        console.error(error);
        alert("Server connection failed");
    }

}


function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}