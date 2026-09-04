// api/notifications/page.js - Notifications Page
const { getCurrentUser } = require("../../lib/auth");
const { getNotifications, markAllAsRead } = require("../../lib/notifications");

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

module.exports = async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.writeHead(302, { Location: "/login" });
    return res.end();
  }

  try {
    const notifications = await getNotifications(user.id);
    await markAllAsRead(user.id);

    const notifHtml = notifications.length === 0
      ? `<div class="text-center py-12"><p class="text-gray-400">No notifications yet</p></div>`
      : notifications.map(n => `
        <div class="p-4 rounded-lg border ${n.is_read ? "bg-white border-gray-100" : "bg-blue-50 border-blue-100"} mb-3">
          <div class="flex justify-between items-start">
            <div>
              <span class="inline-block px-2 py-0.5 text-xs rounded font-semibold ${n.type === "status_update" ? "bg-purple-100 text-purple-700" : n.type === "payment_due" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"} mb-2">${n.type.replace(/_/g, " ")}</span>
              <p class="text-[#2C3E50]">${escapeHtml(n.message)}</p>
            </div>
            <span class="text-xs text-gray-400 whitespace-nowrap ml-4">${new Date(n.created_at).toLocaleString()}</span>
          </div>
        </div>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notifications - Campus Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans">
    <nav class="bg-[#1B365D] text-white shadow-md"><div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center"><h1 class="text-xl font-bold">CampusLoan Portal</h1><a href="/dashboard" class="text-sm hover:underline">Back to Dashboard</a></div></nav>
    <main class="max-w-3xl mx-auto px-6 py-8">
        <h2 class="text-2xl font-bold text-[#1B365D] mb-6">Notifications</h2>
        <div class="space-y-2">${notifHtml}</div>
    </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Notifications page error:", error);
    res.status(500).send("Error loading notifications");
  }
};
