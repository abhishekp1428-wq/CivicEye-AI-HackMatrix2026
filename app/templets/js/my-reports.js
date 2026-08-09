const API_BASE = "http://127.0.0.1:8000";

const BAR_COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("user_name");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const nameEl = document.getElementById("userName");
    if (nameEl && userName) nameEl.textContent = userName;

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
                localStorage.removeItem("user_name");
                localStorage.removeItem("email");
                localStorage.removeItem("mobile");
                window.location.href = "login.html";
            }
        });
    }

    loadReports();

});


async function loadReports() {

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(`${API_BASE}/reports/summary`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            console.error("Failed to load reports:", response.status);
            return;
        }

        const data = await response.json();

        document.getElementById("totalCount").textContent = data.total;

        renderBarChart("departmentChart", data.department_breakdown, "department");
        renderBarChart("monthChart", data.month_breakdown, "month");
        renderBarChart("statusChart", data.status_breakdown, "status");

    } catch (error) {
        console.error("Error loading reports:", error);
    }

}


function renderBarChart(containerId, items, labelKey) {

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = `<p style="color:#94A3B8; font-size:13.5px;">No data yet.</p>`;
        return;
    }

    const maxCount = Math.max(...items.map(i => i.count));

    items.forEach((item, index) => {

        const label = item[labelKey] || "Unknown";
        const count = item.count;
        const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const color = BAR_COLORS[index % BAR_COLORS.length];

        const row = document.createElement("div");

        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                <span style="color:#374151; font-weight:500;">${escapeHtml(String(label))}</span>
                <span style="color:#6B7280;">${count}</span>
            </div>
            <div style="background:#F3F4F6; border-radius:6px; height:10px; overflow:hidden;">
                <div style="background:${color}; width:${pct}%; height:100%; border-radius:6px;"></div>
            </div>
        `;

        container.appendChild(row);

    });

}


function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}