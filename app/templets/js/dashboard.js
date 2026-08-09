const API_BASE = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {

    const userName = localStorage.getItem("user_name");
    const token = localStorage.getItem("token");

    if (userName && token) {

        const name = document.getElementById("userName");
        const welcome = document.getElementById("welcomeText");

        if (name) name.textContent = userName;
        if (welcome) welcome.textContent = `Welcome, ${userName}! 👋`;

    } else {

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
                localStorage.removeItem("user_name");
                localStorage.removeItem("email");
                localStorage.removeItem("mobile");
                window.location.href = "login.html";
            }
        });
    }

    loadDashboardData();

});


async function loadDashboardData() {

    const token = localStorage.getItem("token");

    try {

        const response = await fetch(`${API_BASE}/dashboard`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            console.log("Failed to load dashboard:", response.status);
            return;
        }

        const data = await response.json();

        renderStats(data);
        renderIssuesChart(data.month_breakdown);
        renderRecentIssues(data.recent);

    } catch (error) {
        console.log("Error loading dashboard data:", error);
    }

}


function renderStats(data) {

    document.querySelectorAll(".stat-card").forEach(card => {

        const valueEl = card.querySelector(".value");
        if (!valueEl) return;

        if (card.classList.contains("total")) {
            valueEl.textContent = data.total;
        } else if (card.classList.contains("progress")) {
            valueEl.textContent = data.progress;
        } else if (card.classList.contains("resolved")) {
            valueEl.textContent = data.resolved;
        } else if (card.classList.contains("rejected")) {
            valueEl.textContent = data.rejected;
        }

    });

}


const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function renderIssuesChart(monthData) {

    // Find the "Issues Overview" panel and its chart container
    const panels = document.querySelectorAll(".panel-card");
    let chartWrap = null;

    panels.forEach(panel => {
        const heading = panel.querySelector(".head h3");
        if (heading && heading.textContent.trim() === "Issues Overview") {
            chartWrap = panel.querySelector(".chart-wrap");
        }
    });

    if (!chartWrap) return;

    if (!monthData || monthData.length === 0) {
        chartWrap.innerHTML = `<p style="color:#94A3B8; padding:20px; text-align:center;">No complaint history yet to chart.</p>`;
        return;
    }

    // width/height match the original static chart's viewBox
    const width = 560;
    const height = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 10;
    const paddingBottom = 30;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const counts = monthData.map(m => m.count);
    const maxCount = Math.max(...counts, 1);
    // Round the axis max up to a nice number
    const axisMax = Math.ceil(maxCount / 5) * 5 || 5;

    const points = monthData.map((m, i) => {
        const x = paddingLeft + (monthData.length === 1 ? plotWidth / 2 : (i / (monthData.length - 1)) * plotWidth);
        const y = paddingTop + plotHeight - (m.count / axisMax) * plotHeight;
        return { x, y, count: m.count, label: formatMonthLabel(m.month) };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L${points[points.length - 1].x} ${paddingTop + plotHeight} L${points[0].x} ${paddingTop + plotHeight} Z`;

    const maxPoint = points.reduce((max, p) => p.count > max.count ? p : max, points[0]);

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => {
        const y = paddingTop + plotHeight * (1 - frac);
        const value = Math.round(axisMax * frac);
        return `
            <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#EEF1F6" stroke-width="1"/>
            <text x="${paddingLeft - 8}" y="${y + 4}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="10" fill="#94A3B8">${value}</text>
        `;
    }).join("");

    const dots = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#3B82F6"/>`).join("");

    const labels = points.map(p =>
        `<text x="${p.x}" y="${height - 8}" text-anchor="middle" font-family="Hind, sans-serif" font-size="11.5" fill="#94A3B8">${p.label}</text>`
    ).join("");

    chartWrap.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <g>${gridLines}</g>
            <path d="${areaPath}" fill="url(#areaFill)" stroke="none"/>
            <path d="${linePath}" fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <g>${dots}</g>
            <rect x="${maxPoint.x - 20}" y="${maxPoint.y - 30}" width="40" height="22" rx="6" fill="#3B82F6"/>
            <text x="${maxPoint.x}" y="${maxPoint.y - 15}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700" fill="#fff">${maxPoint.count}</text>
            <g>${labels}</g>
        </svg>
    `;

}

function formatMonthLabel(yyyyMm) {
    const parts = yyyyMm.split("-");
    if (parts.length !== 2) return yyyyMm;
    const monthIndex = parseInt(parts[1], 10) - 1;
    return MONTH_NAMES[monthIndex] || yyyyMm;
}


function statusBadgeClass(status) {
    switch (status) {
        case "In Progress": return "progress";
        case "Resolved": return "resolved";
        case "Rejected": return "rejected";
        default: return "progress"; // Pending
    }
}


function renderRecentIssues(recent) {

    const panelCards = document.querySelectorAll(".panel-card");
    const recentPanel = panelCards[1];

    if (!recentPanel) return;

    recentPanel.querySelectorAll(".issue-row").forEach(row => row.remove());

    if (!recent || recent.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = "No complaints submitted yet.";
        emptyMsg.style.color = "var(--muted, #94A3B8)";
        recentPanel.appendChild(emptyMsg);
        return;
    }

    recent.forEach(complaint => {

        const badgeClass = statusBadgeClass(complaint.status);

        const row = document.createElement("div");
        row.className = "issue-row";

        row.innerHTML = `
            <span class="ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19V5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
                    <path d="M14 3v6h6"/>
                </svg>
            </span>
            <div class="body">
                <div class="title">${escapeHtml(complaint.title)}</div>
                <div class="loc">${escapeHtml(complaint.location)}</div>
            </div>
            <div class="meta">
                <span class="badge ${badgeClass}">${escapeHtml(complaint.status)}</span>
            </div>
        `;

        recentPanel.appendChild(row);

    });

}


function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}