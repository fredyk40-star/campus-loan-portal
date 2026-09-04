<?php
// public/calculator.php
$monthly_payment = 0;
$total_payable = 0;
$total_interest = 0;
$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $principal = floatval($_POST['principal']);
    $annual_interest_rate = floatval($_POST['interest_rate']); // e.g., 5%
    $years = intval($_POST['years']);

    if ($principal <= 0 || $years <= 0) {
        $error = "Please enter valid positive numbers for the loan amount and duration.";
    } else {
        // Standard Amortization Formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
        $monthly_interest_rate = ($annual_interest_rate / 100) / 12;
        $total_months = $years * 12;

        if ($monthly_interest_rate == 0) {
            $monthly_payment = $principal / $total_months;
            $total_payable = $principal;
        } else {
            $monthly_payment = $principal * 
                ($monthly_interest_rate * pow(1 + $monthly_interest_rate, $total_months)) / 
                (pow(1 + $monthly_interest_rate, $total_months) - 1);
            $total_payable = $monthly_payment * $total_months;
        }
        $total_interest = $total_payable - $principal;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repayment Calculator - Campus Loan Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F4F6F9] text-[#2C3E50] font-sans flex min-h-screen">

    <!-- Sidebar -->
    <aside class="w-64 bg-[#1B365D] text-white hidden md:flex flex-col p-6 shadow-lg">
        <h1 class="text-xl font-bold tracking-wide mb-8">CampusLoan</h1>
        <nav class="space-y-4">
            <a href="dashboard.php" class="block py-2.5 px-4 rounded hover:bg-blue-800 transition">Dashboard</a>
            <a href="calculator.php" class="block py-2.5 px-4 rounded bg-blue-900 font-semibold">Repayment Calculator</a>
            <a href="index.php" class="block py-2.5 px-4 rounded hover:bg-blue-800 transition">Home</a>
        </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8">
        <header class="mb-8">
            <h2 class="text-2xl font-bold text-[#1B365D]">Post-Graduation Repayment Simulator</h2>
            <p class="text-sm text-gray-500 mt-1">Plan your finances ahead by modeling monthly deductions based on loan terms.</p>
        </header>

        <?php if ($error): ?>
            <div class="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <!-- Calculator Input Form -->
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-bold text-[#1B365D] mb-4">Simulation Parameters</h3>
                <form action="calculator.php" method="POST" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Loan Principal Amount (GHS)</label>
                        <input type="number" step="0.01" name="principal" required value="<?= isset($_POST['principal']) ? htmlspecialchars($_POST['principal']) : '1000.00' ?>" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Annual Interest Rate (%)</label>
                        <input type="number" step="0.1" name="interest_rate" required value="<?= isset($_POST['interest_rate']) ? htmlspecialchars($_POST['interest_rate']) : '5.0' ?>" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Repayment Duration (Years)</label>
                        <input type="number" name="years" required value="<?= isset($_POST['years']) ? htmlspecialchars($_POST['years']) : '2' ?>" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]">
                    </div>
                    <button type="submit" class="w-full bg-[#1B365D] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition">Calculate Projections</button>
                </form>
            </section>

            <!-- Calculation Output Display -->
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-bold text-[#1B365D] mb-4">Financial Summary</h3>
                    <?php if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$error): ?>
                        <div class="space-y-4">
                            <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p class="text-xs text-gray-500 font-medium">Estimated Monthly Installment</p>
                                <p class="text-2xl font-bold text-[#1B365D] mt-1">GHS <?= number_format($monthly_payment, 2) ?></p>
                            </div>
                            <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p class="text-xs text-gray-500 font-medium">Total Interest Accrued</p>
                                <p class="text-xl font-semibold text-amber-600 mt-1">GHS <?= number_format($total_interest, 2) ?></p>
                            </div>
                            <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p class="text-xs text-gray-500 font-medium">Total Repayable Amount</p>
                                <p class="text-xl font-semibold text-[#00875A] mt-1">GHS <?= number_format($total_payable, 2) ?></p>
                            </div>
                        </div>
                    <?php else: ?>
                        <div class="h-48 flex items-center justify-center text-center text-gray-400">
                            <p>Submit the form parameters to view calculated loan projections.</p>
                        </div>
                    <?php endif; ?>
                </div>
                <div class="mt-6 pt-4 border-t text-xs text-gray-400">
                    * Financial calculation methodology structured in coordination with departmental banking standards.
                </div>
            </section>

        </div>
    </main>

</body>
</html>