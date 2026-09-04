// api/repayments/page.js - Repayment Schedule View Page
const { getConnection } = require("../../lib/db");
const { getCurrentUser } = require("../../lib/auth");
const { isValidInt, escapeAttr } = require("../../lib/security");
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
  if (!user) {
    res.writeHead(302, { Location: "/login" });
    return res.end();
  }

  // SECURITY (P1 #6): Validate loan_id as integer, use req.query only
  const loanId = req.query.loan_id;
  if (!loanId || !isValidInt(loanId, 1, Number.MAX_SAFE_INTEGER)) {
    return res.status(400).send("<p>Loan ID required. <a href='/dashboard'>Go to Dashboard</a></p>");
  }

  const connection = await getConnection();
  try {
    const [loans] = await connection.execute(
      `SELECT l.*, s.full_name, s.index_number FROM loan_applications l JOIN students s ON l.student_id = s.id WHERE l.id = ? AND s.id = ?`,
      [loanId, user.student_id]
    );

    if (loans.length === 0 && user.role !== "admin") {
      return res.status(404).send("<p>Loan not found. <a href='/dashboard'>Go to Dashboard</a></p>");
    }

    const loan = loans[0];
    const [schedule] = await connection.execute(
      "SELECT * FROM repayment_schedules WHERE loan_application_id = ? ORDER BY installment_number",
      [loanId]
    );

    const scheduleRows = schedule.length === 0
      ? `<tr><td colspan="7" class="py-4 text-center text-gray-400">No repayment schedule generated yet.</td></tr>`
      : schedule.map(s => `<tr>
          <td class="py-2">${s.installment_number}</td>
          <td class="py-2">${formatCurrency(s.principal_amount)}</td>
          <td class="py-2">${formatCurrency(s.interest_amount)}</td>
          <td class="py-2 font-medium">${formatCurrency(s.total_payment)}</td>
          <td class="py-2">${formatCurrency(s.remaining_balance)}</td>
          <td class="py-2">${s.due_date}</td>
          <td class="py-2"><span class="px-2 py-1 text-xs rounded-full ${s.status === "paid" ? "bg-green-100 text-green-800" : s.status === "overdue" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}">${s.status}</span></td>
        </tr>`).join("");

    const totalPrincipal = schedule.reduce((sum, s) => sum + parseFloat(s.principal_amount), 0);
    const totalInterest = schedule.reduce((sum, s) => sum + parseFloat(s.interest_amount), 0);
    const totalPayable = schedule.reduce((sum, s) => sum + parseFloat(s.total_payment), 0);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repayment Schedule - Campus Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans">
    <nav class="bg-[#1B365D] text-white shadow-md"><div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center"><h1 class="text-xl font-bold">CampusLoan Portal</h1><a href="/dashboard" class="text-sm hover:underline">Back to Dashboard</a></div></nav>
    <main class="max-w-7xl mx-auto px-6 py-8">
        <h2 class="text-2xl font-bold text-[#1B365D] mb-2">Repayment Schedule</h2>
        <p class="text-gray-500 mb-6">Loan #${escapeAttr(loanId)} - ${escapeHtml(loan?.full_name || "")} (${escapeHtml(loan?.index_number || "")})</p>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p class="text-xs text-gray-500">Loan Amount</p><p class="text-lg font-bold text-[#1B365D]">${formatCurrency(loan?.amount_requested || 0)}</p></div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p class="text-xs text-gray-500">Total Principal</p><p class="text-lg font-bold text-[#1B365D]">${formatCurrency(totalPrincipal)}</p></div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p class="text-xs text-gray-500">Total Interest</p><p class="text-lg font-bold text-amber-600">${formatCurrency(totalInterest)}</p></div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p class="text-xs text-gray-500">Total Payable</p><p class="text-lg font-bold text-[#00875A]">${formatCurrency(totalPayable)}</p></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 border-b"><h3 class="font-bold text-[#1B365D]">Monthly Installments</h3></div>
            <div class="overflow-x-auto"><table class="w-full text-left border-collapse text-sm"><thead><tr class="border-b text-gray-500 bg-gray-50"><th class="p-3">#</th><th class="p-3">Principal</th><th class="p-3">Interest</th><th class="p-3">Total</th><th class="p-3">Balance</th><th class="p-3">Due Date</th><th class="p-3">Status</th></tr></thead><tbody class="divide-y">${scheduleRows}</tbody></table></div>
        </div>
    </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
  setSecurityHeaders(res); // SECURITY (P3 #20)
    res.send(html);
  } finally {
    await connection.end();
  }
};
