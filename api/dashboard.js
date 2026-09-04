// api/dashboard.js - Student Dashboard
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT) || 4000,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_NAME,
  ssl: process.env.MYSQL_SSL === "1" ? { rejectUnauthorized: true } : false,
};

async function getRecentApplications() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT l.*, s.full_name, s.index_number, s.department 
       FROM loan_applications l 
       JOIN students s ON l.student_id = s.id 
       ORDER BY l.applied_at DESC LIMIT 5`
    );
    return rows;
  } catch (error) {
    console.error("Database error:", error);
    return [];
  } finally {
    if (connection) await connection.end();
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(num) {
  return "GHS " + parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = async (req, res) => {
  const message = "";
  const applications = await getRecentApplications();

  const appsHtml = applications.length === 0
    ? `<tr><td colspan="3" class="py-4 text-center text-gray-400">No loan applications found yet.</td></tr>`
    : applications.map(app => `<tr>
        <td class="py-3"><p class="font-semibold text-[#2C3E50]">${escapeHtml(app.full_name)}</p><p class="text-xs text-gray-400">${escapeHtml(app.index_number)}</p></td>
        <td class="py-3 font-medium">${formatCurrency(app.amount_requested)}</td>
        <td class="py-3"><span class="px-2.5 py-1 text-xs rounded-full font-semibold bg-amber-100 text-amber-800">${escapeHtml(app.status)}</span></td>
      </tr>`).join("");

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
            <a href="/" class="block py-2.5 px-4 rounded hover:bg-blue-800 transition">Home</a>
        </nav>
    </aside>
    <main class="flex-1 p-8">
        <header class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-bold text-[#1B365D]">Student Financial Dashboard</h2>
            <span class="text-sm font-semibold bg-emerald-100 text-[#00875A] px-3 py-1 rounded-full">System Active</span>
        </header>
        ${message ? `<div class="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-[#00875A] font-medium">${escapeHtml(message)}</div>` : ""}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-sm text-gray-500 font-medium">Active Applications</p>
                <h3 class="text-2xl font-bold text-[#1B365D] mt-2">${applications.length}</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-sm text-gray-500 font-medium">Under Review</p>
                <h3 class="text-2xl font-bold text-amber-600 mt-2">${applications.filter(a => a.status === "Under Review").length}</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-sm text-gray-500 font-medium">Total Disbursed</p>
                <h3 class="text-2xl font-bold text-[#00875A] mt-2">${formatCurrency(applications.reduce((sum, a) => sum + parseFloat(a.amount_requested || 0), 0))}</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-sm text-gray-500 font-medium">Avg. Processing</p>
                <h3 class="text-2xl font-bold text-[#1B365D] mt-2">3 Days</h3>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-[#1B365D] mb-4">New Loan Application</h3>
                <form action="/api/applications" method="POST" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Index Number</label>
                        <input type="text" name="index_number" required placeholder="UPSA-2024-001" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" name="full_name" required placeholder="John Doe" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input type="text" name="department" required placeholder="Information Technology Studies" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Amount Requested (GHS)</label>
                        <input type="number" step="0.01" name="amount" required placeholder="500.00" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Expected Graduation Year</label>
                        <input type="number" name="grad_year" required value="2027" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Reason / Purpose</label>
                        <textarea name="reason" rows="2" required placeholder="Semester registration fees..." class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"></textarea>
                    </div>
                    <button type="submit" class="w-full bg-[#1B365D] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition">Submit Application</button>
                </form>
            </section>
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-[#1B365D] mb-4">Recent Applications Tracker</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead><tr class="border-b text-sm text-gray-500"><th class="py-2">Student</th><th class="py-2">Amount</th><th class="py-2">Status</th></tr></thead>
                        <tbody class="divide-y text-sm">${appsHtml}</tbody>
                    </table>
                </div>
            </section>
        </div>
    </main>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
};
