// api/admin/index.js - Admin Dashboard Page
const { getConnection } = require("../../lib/db");
const { getCurrentUser } = require("../../lib/auth");
const { setSecurityHeaders } = require("../../lib/security");

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatCurrency(num) {
  return "GHS " + parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "admin") {
    res.writeHead(302, { Location: "/login" });
    return res.end();
  }

  const connection = await getConnection();
  try {
    const [applications] = await connection.execute(
      `SELECT l.*, s.full_name, s.index_number, s.department, s.email FROM loan_applications l JOIN students s ON l.student_id = s.id ORDER BY l.applied_at DESC`
    );
    const [stats] = await connection.execute(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = "Under Review" THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = "Approved" THEN 1 ELSE 0 END) as approved, SUM(CASE WHEN status = "Rejected" THEN 1 ELSE 0 END) as rejected FROM loan_applications`
    );
    const stat = stats[0] || {};

    const appsHtml = applications.map(app => `<tr>
      <td class="py-3"><p class="font-semibold">${escapeHtml(app.full_name)}</p><p class="text-xs text-gray-400">${escapeHtml(app.index_number)}</p><p class="text-xs text-gray-400">${escapeHtml(app.email)}</p></td>
      <td class="py-3">${escapeHtml(app.department)}</td>
      <td class="py-3 font-medium">${formatCurrency(app.amount_requested)}</td>
      <td class="py-3"><span class="px-2 py-1 text-xs rounded-full font-semibold ${app.status === "Approved" ? "bg-green-100 text-green-800" : app.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}">${escapeHtml(app.status)}</span></td>
      <td class="py-3 text-sm">${new Date(app.applied_at).toLocaleDateString()}</td>
      <td class="py-3">
        <select onchange="updateStatus(${app.id}, this.value)" class="text-sm border rounded px-2 py-1">
          <option value="Under Review" ${app.status === "Under Review" ? "selected" : ""}>Under Review</option>
          <option value="Approved" ${app.status === "Approved" ? "selected" : ""}>Approved</option>
          <option value="Rejected" ${app.status === "Rejected" ? "selected" : ""}>Rejected</option>
        </select>
      </td>
    </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Campus Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans">
    <nav class="bg-[#1B365D] text-white shadow-md"><div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center"><h1 class="text-xl font-bold">CampusLoan Admin</h1><div class="flex items-center gap-4"><span class="text-sm">${escapeHtml(user.email)}</span><button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Logout</button></div></div></nav>
    <main class="max-w-7xl mx-auto px-6 py-8">
        <h2 class="text-2xl font-bold text-[#1B365D] mb-6">Loan Applications Management</h2>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p class="text-sm text-gray-500">Total Applications</p><h3 class="text-2xl font-bold text-[#1B365D] mt-2">${stat.total || 0}</h3></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p class="text-sm text-gray-500">Pending Review</p><h3 class="text-2xl font-bold text-amber-600 mt-2">${stat.pending || 0}</h3></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p class="text-sm text-gray-500">Approved</p><h3 class="text-2xl font-bold text-[#00875A] mt-2">${stat.approved || 0}</h3></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p class="text-sm text-gray-500">Rejected</p><h3 class="text-2xl font-bold text-red-600 mt-2">${stat.rejected || 0}</h3></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b"><h3 class="text-lg font-bold text-[#1B365D]">All Applications</h3></div>
            <div class="overflow-x-auto"><table class="w-full text-left border-collapse"><thead><tr class="border-b text-sm text-gray-500 bg-gray-50"><th class="p-3">Student</th><th class="p-3">Department</th><th class="p-3">Amount</th><th class="p-3">Status</th><th class="p-3">Date</th><th class="p-3">Actions</th></tr></thead><tbody class="divide-y text-sm">${appsHtml}</tbody></table></div>
        </div>
    </main>
    <script>
        async function updateStatus(id, status) {
            const interestRate = status === "Approved" ? prompt("Enter annual interest rate (%):", "5") : null;
            const years = status === "Approved" ? prompt("Enter repayment duration (years):", "2") : null;
            try {
                const res = await fetch("/api/admin/applications", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ application_id: id, status, interest_rate: interestRate, repayment_years: years }),
                });
                const data = await res.json();
                if (res.ok) { alert("Status updated!"); location.reload(); }
                else alert(data.error || "Update failed");
            } catch (err) { alert("Error updating status"); }
        }
        async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }
    </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
  setSecurityHeaders(res); // SECURITY (P3 #20)
    res.send(html);
  } finally {
    await connection.end();
  }
};
