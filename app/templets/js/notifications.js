const API_BASE = "https://civiceye-ai-hackmatrix2026-1.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("notificationList");
    const summary = document.getElementById("notificationSummary");
    const markAllReadBtn = document.getElementById("markAllReadBtn");
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    async function loadNotifications() {
        summary.textContent = "Loading notifications...";
        list.replaceChildren();

        try {
            const response = await fetch(`${API_BASE}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }
            if (!response.ok) {
                throw new Error(`Could not load notifications (${response.status})`);
            }

            const data = await response.json();
            renderNotifications(data.items || []);
            summary.textContent = data.unread_count
                ? `${data.unread_count} unread notification${data.unread_count === 1 ? "" : "s"}`
                : "You’re all caught up.";
            markAllReadBtn.hidden = data.unread_count === 0;
        } catch (error) {
            console.error("Could not load notifications:", error);
            summary.textContent = "Notifications could not be loaded.";
            const retryButton = document.createElement("button");
            retryButton.type = "button";
            retryButton.className = "notification-action";
            retryButton.textContent = "Try again";
            retryButton.addEventListener("click", loadNotifications, { once: true });
            list.append(retryButton);
        }
    }

    function renderNotifications(notifications) {
        list.replaceChildren();

        if (notifications.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "panel-card notification-empty";
            emptyState.textContent = "No notifications yet. Updates about your complaints will appear here.";
            list.append(emptyState);
            return;
        }

        notifications.forEach(notification => {
            const card = document.createElement("article");
            card.className = `panel-card notification-item${notification.is_read ? "" : " unread"}`;

            const heading = document.createElement("div");
            heading.className = "notification-heading";

            const title = document.createElement("h3");
            title.textContent = notification.complaint_title;

            const status = document.createElement("span");
            status.className = `notification-status status-${notification.status.toLowerCase().replaceAll(" ", "-")}`;
            status.textContent = notification.status;
            heading.append(title, status);

            const message = document.createElement("p");
            message.textContent = notification.message;

            const footer = document.createElement("div");
            footer.className = "notification-footer";

            const date = document.createElement("time");
            date.dateTime = notification.created_at || "";
            const parsedDate = notification.created_at && new Date(notification.created_at);
            date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleString()
                : "Date unavailable";
            footer.append(date);

            if (notification.complaint_id) {
                const link = document.createElement("a");
                link.href = "my-issues.html";
                link.textContent = "View my issues";
                footer.append(link);
            }

            if (!notification.is_read) {
                const readButton = document.createElement("button");
                readButton.type = "button";
                readButton.className = "notification-action";
                readButton.textContent = "Mark as read";
                readButton.addEventListener("click", async () => {
                    readButton.disabled = true;
                    try {
                        const response = await fetch(`${API_BASE}/notifications/${notification.id}/read`, {
                            method: "PATCH",
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!response.ok) {
                            throw new Error(`Could not mark notification as read (${response.status})`);
                        }
                        await loadNotifications();
                    } catch (error) {
                        console.error("Could not mark notification as read:", error);
                        readButton.disabled = false;
                        summary.textContent = "Could not update notification. Please try again.";
                    }
                });
                footer.append(readButton);
            }

            card.append(heading, message, footer);
            list.append(card);
        });
    }

    markAllReadBtn.addEventListener("click", async () => {
        markAllReadBtn.disabled = true;
        try {
            const response = await fetch(`${API_BASE}/notifications/read-all`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error(`Could not mark notifications as read (${response.status})`);
            }
            await loadNotifications();
        } catch (error) {
            console.error("Could not mark notifications as read:", error);
            summary.textContent = "Could not update notifications. Please try again.";
        } finally {
            markAllReadBtn.disabled = false;
        }
    });

    loadNotifications();
});
