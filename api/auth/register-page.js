// api/auth/register-page.js - Register Page (HTML)
const { getCurrentUser } = require("../../lib/auth");
const { setSecurityHeaders } = require("../../lib/security");

module.exports = async (req, res) => {
  const user = await getCurrentUser(req);
  if (user) {
    res.writeHead(302, { Location: "/dashboard" });
    return res.end();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Campus Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans min-h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
        <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="text-center mb-8">
                <h1 class="text-2xl font-bold text-[#1B365D]">CampusLoan Portal</h1>
                <p class="text-gray-500 mt-2">Create your account</p>
            </div>
            <form id="registerForm" class="space-y-4">
                <div id="errorMsg" class="hidden p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"></div>
                <div id="successMsg" class="hidden p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" id="fullName" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]" placeholder="John Doe">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Index Number</label>
                        <input type="text" id="indexNumber" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]" placeholder="UPSA-2024-001">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]" placeholder="your@email.com">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" id="department" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]" placeholder="Information Technology Studies">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="password" required minlength="6" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]" placeholder="Min 6 characters">
                </div>
                <button type="submit" class="w-full bg-[#1B365D] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition">Create Account</button>
            </form>
            <div class="mt-6 text-center text-sm text-gray-500">
                <p>Already have an account? <a href="/login" class="text-[#1B365D] font-semibold hover:underline">Sign in</a></p>
            </div>
        </div>
    </div>
    <script>
        document.getElementById("registerForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const fullName = document.getElementById("fullName").value;
            const indexNumber = document.getElementById("indexNumber").value;
            const email = document.getElementById("email").value;
            const department = document.getElementById("department").value;
            const password = document.getElementById("password").value;
            const errorDiv = document.getElementById("errorMsg");
            const successDiv = document.getElementById("successMsg");
            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ full_name: fullName, index_number: indexNumber, email, department, password }),
                });
                const data = await res.json();
                if (res.ok) {
                    successDiv.textContent = "Registration successful! Redirecting...";
                    successDiv.classList.remove("hidden");
                    errorDiv.classList.add("hidden");
                    setTimeout(() => (window.location.href = "/dashboard"), 1500);
                } else {
                    errorDiv.textContent = data.error || "Registration failed";
                    errorDiv.classList.remove("hidden");
                    successDiv.classList.add("hidden");
                }
            } catch (err) {
                errorDiv.textContent = "Network error. Please try again.";
                errorDiv.classList.remove("hidden");
            }
        });
    </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  setSecurityHeaders(res); // SECURITY (P3 #20)
  res.send(html);
};
