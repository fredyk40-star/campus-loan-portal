// api/dashboard.js - Student Dashboard (Updated with Auth and Notifications)
const { getConnection } = require("../../lib/db");
const { getCurrentUser } = require("../../lib/auth");
const { getNotifications } = require("../../lib/notifications");

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatCurrency(num) {
  return "GHS " + parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function getApplicationsForStudent(studentId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT l.*, s.full_name, s.index_number, s.department FROM loan_applications l JOIN students s ON l.student_id = s.id WHERE s.id = ? ORDER BY l.applied_at DESC`,
      [studentId]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

module.exports = async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.writeHead(302, { Location: "/login" });
    return res.end();
  }

  const connection = await getConnection();
  try {
    // Get student info
    const [students] = await connection.execute(
      "SELECT * FROM students WHERE id = ?", [user.student_id]
    );
    const student = students[0] || {};

    // Get applications
    const applications = await getApplicationsForStudent(user.student_id);

    // Get notifications
    const { notifications, unread_count } = await getNotifications(user.id).then(n => ({ notifications: n, unread_count: n.filter(x => !x.is_read).length })).catch(() => ({ notifications: [], unread_count: 0 }));

    const appsHtml = applications.length === 0
      ? `<tr><td colspan="4" class="py-4 text-center text-gray-400">No loan applications found yet.</td></tr>`
      : applications.map(app => `<tr>
          <td class="py-3"><p class="font-semibold text-[#2C3E50]">${escapeHtml(app.full_name)}</p><p class="text-xs text-gray-400">${escapeHtml(app.index_number)}</p></td>
          <td class="py-3 font-medium">${formatCurrency(app.amount_requested)}</td>
          <td class="py-3"><span class="px-2.5 py-1 text-xs rounded-full font-semibold ${app.status === "Approved" ? "bg-green-100 text-green-800" : app.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}">${escapeHtml(app.status)}</span></td>
          <td class="py-3 text-sm"><a href="/repayments?loan_id=${app.id}" class="text-[#1B365D] hover:underline">View Schedule</a></td>
        </tr>`).join("");

    const notifHtml = notifications.length === 0
      ? `<p class="text-gray-400 text-sm text-center py-4">No notifications</p>`
      : notifications.slice(0, 5).map(n => `<div class="p-3 rounded-lg ${n.is_read ? "bg-white" : "bg-blue-50"} border border-gray-100 mb-2"><p class="text-sm text-[#2C3E50]">${escapeHtml(n.message)}</p><p class="text-xs text-gray-400 mt-1">${new Date(n.created_at).toLocaleDateString()}</p></div>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Campus Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans flex min-h-screen">
    <aside class="w-64 bg-[#1B365D] text-white hidden md:flex flex-col p-6 shadow-lg">
        <h1 class="text-xl font-bold tracking-wide mb-8">CampusLoan</h1>
        <nav class="space-y-4">
            <a href="/dashboard" class="block py-2.5 px-4 rounded bg-blue-900 font-semibold">Dashboard</a>
            <a href="/calculator" class="block py-2.5 px-4 rounded hover:bg-blue-800 transition">Calculator</a>
            <a href="/notifications" class="block py-2.5 px-4 rounded hover:bg-blue-800 transition relative">Notifications ${unread_count > 0 ? `<span class="absolute right-2 top-2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">${unread_count}</span>` : ""}</a>
            ${user.role === "admin" ? `<a href="/admin" class="block py-2.5 px-4 rounded hover:bg-blue-800 transition">Admin Panel</a>` : ""}
            <a href="/" class="block py-2.5 px-4 rounded hover:bg-blue-800 transition">Home</a>
        </nav>
        <div class="mt-auto pt-6 border-t border-blue-800">
            <p class="text-sm text-blue-200">${escapeHtml(user.email)}</p>
            <p class="text-xs text-blue-300 capitalize">${user.role}</p>
            <button onclick="logout()" class="mt-3 text-sm text-blue-200 hover:text-white">Logout</button>
        </div>
    </aside>
    <main class="flex-1 p-8">
        <header class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-bold text-[#1B365D]">Welcome, ${escapeHtml(student.full_name || "Student")}</h2>
                <p class="text-sm text-gray-500">${escapeHtml(student.index_number || "")} - ${escapeHtml(student.department || "")}</p>
            </div>
            <span class="text-sm font-semibold bg-emerald-100 text-[#00875A] px-3 py-1 rounded-full">System Active</span>
        </header>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p class="text-sm text-gray-500 font-medium">Total Applications</p><h3 class="text-2xl font-bold text-[#1B365D] mt-2">${applications.length}</h3></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p class="text-sm text-gray-500 font-medium">Under Review</p><h3 class="text-2xl font-bold text-amber-600 mt-2">${applications.filter(a => a.status === "Under Review").length}</h3></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p class="text-sm text-gray-500 font-medium">Approved</p><h3 class="text-2xl font-bold text-[#00875A] mt-2">${applications.filter(a => a.status === "Approved").length}</h3></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p class="text-sm text-gray-500 font-medium">Total Requested</p><h3 class="text-2xl font-bold text-[#1B365D] mt-2">${formatCurrency(applications.reduce((sum, a) => sum + parseFloat(a.amount_requested || 0), 0))}</h3></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-[#1B365D] mb-4">New Loan Application</h3>
                <form action="/api/applications" method="POST" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="block text-sm font-medium text-gray-700 mb-1">Index Number</label><input type="text" name="index_number" required value="${escapeHtml(student.index_number || "")}" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"></div>
                        <div><label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" name="full_name" required value="${escapeHtml(student.full_name || "")}" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="block text-sm font-medium text-gray-700 mb-1">Department</label><input type="text" name="department" required value="${escapeHtml(student.department || "")}" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"></div>
                        <div><label class="block text-sm font-medium text-gray-700 mb-1">Amount Requested (GHS)</label><input type="number" step="0.01" name="amount" required placeholder="500.00" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="block text-sm font-medium text-gray-700 mb-1">Expected Graduation Year</label><input type="number" name="grad_year" required value="2027" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"></div>
                        <div><label class="block text-sm font-medium text-gray-700 mb-1">Supporting Document</label><input type="file" name="document" accept=".pdf,.jpg,.jpeg,.png" class="w-full px-4 py-2 border rounded-lg text-sm"></div>
                    </div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Reason / Purpose</label><textarea name="reason" rows="2" required placeholder="Semester registration fees..." class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"></textarea></div>
                    <button type="submit" class="w-full bg-[#1B365D] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition">Submit Application</button>
                </form>
            </section>
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div class="flex justify-between items-center mb-4"><h3 class="text-lg font-bold text-[#1B365D]">Notifications</h3>${unread_count > 0 ? `<span class="bg-red-500 text-xs text-white rounded-full px-2 py-1">${unread_count} new</span>` : ""}</div>
                <div class="max-h-64 overflow-y-auto">${notifHtml}</div>
            </section>
        </div>
        <div class="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 class="text-lg font-bold text-[#1B365D] mb-4">My Applications</h3>
            <div class="overflow-x-auto"><table class="w-full text-left border-collapse"><thead><tr class="border-b text-sm text-gray-500"><th class="py-2">Student</th><th class="py-2">Amount</th><th class="py-2">Status</th><th class="py-2">Actions</th></tr></thead><tbody class="divide-y text-sm">${appsHtml}</tbody></table></div>
        </div>
    </main>
    <script>
        async function logout() {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
        }
    </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Error loading dashboard");
  }
};
