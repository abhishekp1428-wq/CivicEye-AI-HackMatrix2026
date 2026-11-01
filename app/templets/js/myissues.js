const API_BASE = "https://civiceye-ai-hackmatrix2026-1.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    loadIssues();

    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const closeModal = document.getElementById("closeModal");

    if (searchInput) searchInput.addEventListener("input", debounce(loadIssues, 300));
    if (statusFilter) statusFilter.addEventListener("change", loadIssues);

    if (closeModal) {
        closeModal.addEventListener("click", () => {
            document.getElementById("timelineModal").style.display = "none";
        });
    }
});

function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

async function loadIssues() {

    const searchVal = document.getElementById("searchInput")?.value || "";
    const statusVal = document.getElementById("statusFilter")?.value || "All";
    const token = localStorage.getItem("token");

    const url = new URL(`${API_BASE}/complaints`);
    if (searchVal) url.searchParams.append("search", searchVal);
    if (statusVal && statusVal !== "All") url.searchParams.append("status", statusVal);

    try {

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            renderTable(data);
            renderIssueCharts(data);
        }

    } catch (error) {
        console.error("Error fetching issues:", error);
    }
}

function renderIssueCharts(issues) {
    renderIssueBreakdown("issueStatusChart", issues, issue => issue.status || "Pending", {
        "Pending": "#F59E0B",
        "In Progress": "#3B82F6",
        "Resolved": "#10B981",
        "Rejected": "#EF4444"
    });
    renderIssueBreakdown("issueDepartmentChart", issues, issue => issue.department || "Unknown", {});
    renderIssueBreakdown("issueSeverityChart", issues, issue => issue.severity || "Unknown", {
        "High": "#EF4444",
        "Medium": "#F59E0B",
        "Low": "#10B981"
    });
}

function renderIssueBreakdown(containerId, issues, getLabel, colors) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.replaceChildren();

    if (issues.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "issue-chart-empty";
        emptyMessage.textContent = "No complaints match the current filters.";
        container.appendChild(emptyMessage);
        return;
    }

    const counts = new Map();
    issues.forEach(issue => {
        const label = String(getLabel(issue));
        counts.set(label, (counts.get(label) || 0) + 1);
    });

    const entries = [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const visibleEntries = entries.slice(0, 6);
    if (entries.length > visibleEntries.length) {
        const remainingCount = entries.slice(6).reduce((total, entry) => total + entry[1], 0);
        visibleEntries.push(["Other", remainingCount]);
    }

    const maxCount = Math.max(...visibleEntries.map(([, count]) => count));
    visibleEntries.forEach(([label, count]) => {
        const row = document.createElement("div");
        row.className = "issue-chart-row";

        const heading = document.createElement("div");
        heading.className = "issue-chart-heading";

        const labelElement = document.createElement("span");
        labelElement.textContent = label;

        const countElement = document.createElement("span");
        countElement.textContent = String(count);
        heading.append(labelElement, countElement);

        const track = document.createElement("div");
        track.className = "issue-chart-track";

        const bar = document.createElement("div");
        bar.className = "issue-chart-bar";
        bar.style.width = `${(count / maxCount) * 100}%`;
        bar.style.backgroundColor = colors[label] || "#3B82F6";
        track.appendChild(bar);

        row.append(heading, track);
        container.appendChild(row);
    });
}

function renderTable(issues) {
    const tbody = document.getElementById("issuesTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!issues || issues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #6b7280;">No complaints found.</td></tr>`;
        return;
    }

    issues.forEach(issue => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f3f4f6";

        const titleText = issue.title || 'N/A';
        const statusText = issue.status || 'Pending';
        const severityText = issue.severity || 'Not Available';

        tr.innerHTML = `
            <td style="padding: 12px 16px;">#${issue.id}</td>
            <td style="padding: 12px 16px;"><strong>${escapeHtml(titleText)}</strong></td>
            <td style="padding: 12px 16px;">${escapeHtml(issue.department || 'N/A')}</td>
            <td style="padding: 12px 16px;">${escapeHtml(issue.location || 'N/A')}</td>
            <td style="padding: 12px 16px;"><span class="severity" style="padding: 2px 8px; border-radius: 4px; background: #f3f4f6; font-size: 12px;">${escapeHtml(severityText)}</span></td>
            <td style="padding: 12px 16px;"><span class="status-badge" style="padding: 4px 10px; border-radius: 12px; font-weight: 500; font-size: 12px; background: #e0f2fe; color: #0369a1;">${escapeHtml(statusText)}</span></td>
            <td style="padding: 12px 16px;"><button onclick="openTimelineModal('${titleText.replace(/'/g, "\\'")}', '${statusText}')" style="padding: 5px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">Track Status</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function openTimelineModal(title, status) {
    const modalTitle = document.getElementById("modalIssueTitle");
    const container = document.getElementById("timelineContainer");
    const modal = document.getElementById("timelineModal");

    if (modalTitle) modalTitle.innerText = title;

    const stages = ["Pending", "In Progress", "Resolved"];
    let currentStageIndex = stages.indexOf(status);

    if (status === "Rejected") {
        container.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px;">
                <p style="color: #dc2626; margin: 0; font-weight: 600;">❌ Status: Rejected</p>
                <p style="color: #7f1d1d; margin: 4px 0 0 0; font-size: 13px;">This complaint has been rejected by the administrator.</p>
            </div>
        `;
    } else {
        if (currentStageIndex === -1) currentStageIndex = 0;

        let html = "";
        stages.forEach((stage, index) => {
            if (index <= currentStageIndex) {
                html += `<div style="display: flex; align-items: center; gap: 8px; color: #16a34a; font-weight: 600; font-size: 14px;">✅ <span>${stage}</span></div>`;
            } else {
                html += `<div style="display: flex; align-items: center; gap: 8px; color: #9ca3af; font-size: 14px;">⚪ <span>${stage}</span></div>`;
            }
        });
        container.innerHTML = html;
    }

    if (modal) modal.style.display = "flex";
}