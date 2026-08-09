const API_BASE = "http://127.0.0.1:8000";

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
        }

    } catch (error) {
        console.error("Error fetching issues:", error);
    }
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