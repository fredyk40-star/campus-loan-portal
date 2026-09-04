<?php
// public/dashboard.php
require_once __DIR__ . '/../includes/db.php';

$message = "";

// Handle Form Submission for New Loan Applications
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $index_number = trim($_POST['index_number']);
    $full_name = trim($_POST['full_name']);
    $department = trim($_POST['department']);
    $amount = floatval($_POST['amount']);
    $reason = trim($_POST['reason']);
    $grad_year = intval($_POST['grad_year']);

    try {
        // Check if student exists or insert new
        $stmt = $pdo->prepare("SELECT id FROM students WHERE index_number = ?");
        $stmt->execute([$index_number]);
        $student = $stmt->fetch();

        if (!$student) {
            $insertStudent = $pdo->prepare("INSERT INTO students (index_number, full_name, department, level, email) VALUES (?, ?, ?, 300, ?)");
            $insertStudent->execute([$index_number, $full_name, $department, strtolower($index_number) . '@upsa.edu.gh']);
            $student_id = $pdo->lastInsertId();
        } else {
            $student_id = $student['id'];
        }

        // Insert Loan Application
        $insertLoan = $pdo->prepare("INSERT INTO loan_applications (student_id, amount_requested, reason, expected_graduation_year, status) VALUES (?, ?, ?, ?, 'Under Review')");
        $insertLoan->execute([$student_id, $amount, $reason, $grad_year]);
        
        $message = "Loan application submitted successfully!";
    } catch (\PDOException $e) {
        $message = "Error: " . $e->getMessage();
    }
}

// Fetch existing applications for display
$stmt = $pdo->query("SELECT l.*, s.full_name, s.index_number, s.department FROM loan_applications l JOIN students s ON l.student_id = s.id ORDER BY l.applied_at DESC LIMIT 5");
$recent_applications = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Campus Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans flex min-h-screen">

    <!-- Sidebar -->
    <aside class="w-64 bg-[#1B365D] text-white hidden md:flex flex-col p-6 shadow-lg">
        <h1 class="text-xl font-bold tracking-wide mb-8">CampusLoan</h1>
        <nav class="space-y-4">
            <a href="dashboard.php" class="block py-2.5 px-4 rounded bg-blue-900 font-semibold">Dashboard</a>
            <a href="index.php" class="block py-2.5 px-4 rounded hover:bg-blue-800 transition">Home</a>
        </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8">
        <header class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-bold text-[#1B365D]">Student Financial Dashboard</h2>
            <span class="text-sm font-semibold bg-emerald-100 text-[#00875A] px-3 py-1 rounded-full">System Active</span>
        </header>

        <?php if ($message): ?>
            <div class="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-[#00875A] font-medium">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <!-- Top Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-sm text-gray-500 font-medium">Active Applications</p>
                <h3 class="text-2xl font-bold text-[#1B365D] mt-2"><?= count($recent_applications) ?></h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p class="text-sm text-gray-500 font-medium">System Status</p>
                <h3 class="text-2xl font-bold text-[#00875A] mt-2">Online</h3>
            </div>
        </div>

        <!-- Layout Grid: Form & Recent Applications -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <!-- Loan Application Form -->
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-[#1B365D] mb-4">Apply for a Loan</h3>
                <form action="dashboard.php" method="POST" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Index Number</label>
                        <input type="text" name="index_number" required placeholder="e.g. 10311311" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" name="full_name" required placeholder="Addai Frederick" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input type="text" name="department" required placeholder="Information Technology" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
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

            <!-- Recent Submissions Table -->
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-[#1B365D] mb-4">Recent Applications Tracker</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b text-sm text-gray-500">
                                <th class="py-2">Student</th>
                                <th class="py-2">Amount</th>
                                <th class="py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y text-sm">
                            <?php if (empty($recent_applications)): ?>
                                <tr><td colspan="3" class="py-4 text-center text-gray-400">No loan applications found yet.</td></tr>
                            <?php else: ?>
                                <?php foreach ($recent_applications as $app): ?>
                                    <tr>
                                        <td class="py-3">
                                            <p class="font-semibold text-[#2C3E50]"><?= htmlspecialchars($app['full_name']) ?></p>
                                            <p class="text-xs text-gray-400"><?= htmlspecialchars($app['index_number']) ?></p>
                                        </td>
                                        <td class="py-3 font-medium">GHS <?= number_format($app['amount_requested'], 2) ?></td>
                                        <td class="py-3">
                                            <span class="px-2.5 py-1 text-xs rounded-full font-semibold bg-amber-100 text-amber-800">
                                                <?= htmlspecialchars($app['status']) ?>
                                            </span>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    </main>

</body>
</html>