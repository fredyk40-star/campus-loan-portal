<?php
// public/index.php
require_once __DIR__ . '/../includes/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campus Student Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans">

    <!-- Navigation -->
    <nav class="bg-[#1B365D] text-white shadow-md">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 class="text-xl font-bold tracking-wide">CampusLoan Portal</h1>
            <a href="dashboard.php" class="bg-[#00875A] hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold transition">Student Dashboard</a>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 class="text-4xl font-extrabold text-[#1B365D] mb-4">Transparent Student Funding & Tracking</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-8">Manage applications, monitor disbursement milestones, and calculate manageable post-graduation repayments seamlessly.</p>
        <div class="flex justify-center gap-4">
            <a href="dashboard.php" class="bg-[#1B365D] text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-900 transition">Get Started</a>
        </div>
    </header>

</body>
</html>