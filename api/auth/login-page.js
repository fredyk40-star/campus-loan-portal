// api/auth/login-page.js - Login Page (HTML)
const { getCurrentUser } = require("../../lib/auth");

module.exports = async (req, res) => {
  // If already logged in, redirect to dashboard
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
    <title>Login - Campus Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans min-h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
        <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="text-center mb-8">
                <h1 class="text-2xl font-bold text-[#1B365D]">CampusLoan Portal</h1>
                <p class="text-gray-500 mt-2">Sign in to your account</p>
            </div>
            <form id="loginForm" class="space-y-4">
                <div id="errorMsg" class="hidden p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"></div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]" placeholder="your@email.com">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="password" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]" placeholder="Enter password">
                </div>
                <button type="submit" class="w-full bg-[#1B365D] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition">Sign In</button>
            </form>
            <div class="mt-6 text-center text-sm text-gray-500">
                <p>Don\'t have an account? <a href="/register" class="text-[#1B365D] font-semibold hover:underline">Register here</a></p>
            </div>
            <div class="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <p class="font-semibold">Demo Admin Account:</p>
                <p>Email: admin@campusloan.com</p>
                <p>Password: admin123</p>
            </div>
        </div>
    </div>
    <script>
        document.getElementById("loginForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const errorDiv = document.getElementById("errorMsg");
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();
                if (res.ok) {
                    window.location.href = "/dashboard";
                } else {
                    errorDiv.textContent = data.error || "Login failed";
                    errorDiv.classList.remove("hidden");
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
  res.send(html);
};
