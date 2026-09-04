// lib/repayments.js - Repayment schedule calculations
const { getConnection } = require('./db');

function calculateAmortizationSchedule(principal, annualRate, years) {
  const monthlyRate = (annualRate / 100) / 12;
  const totalMonths = years * 12;
  const schedule = [];
  
  let remainingBalance = principal;
  
  // Calculate fixed monthly payment using amortization formula
  let monthlyPayment;
  if (monthlyRate === 0) {
    monthlyPayment = principal / totalMonths;
  } else {
    monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }
  
  for (let i = 1; i <= totalMonths; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance = remainingBalance - principalPayment;
    
    // Ensure remaining balance doesn't go negative due to rounding
    if (remainingBalance < 0) remainingBalance = 0;
    
    // Calculate due date (monthly from start)
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      installment_number: i,
      principal_amount: parseFloat(principalPayment.toFixed(2)),
      interest_amount: parseFloat(interestPayment.toFixed(2)),
      total_payment: parseFloat(monthlyPayment.toFixed(2)),
      remaining_balance: parseFloat(remainingBalance.toFixed(2)),
      due_date: dueDate.toISOString().split('T')[0],
    });
  }
  
  return schedule;
}

async function generateRepaymentSchedule(loanApplicationId, principal, annualRate, years) {
  const connection = await getConnection();
  try {
    const schedule = calculateAmortizationSchedule(principal, annualRate, years);
    
    for (const installment of schedule) {
      await connection.execute(
        `INSERT INTO repayment_schedules 
         (loan_application_id, installment_number, principal_amount, interest_amount, total_payment, remaining_balance, due_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          loanApplicationId,
          installment.installment_number,
          installment.principal_amount,
          installment.interest_amount,
          installment.total_payment,
          installment.remaining_balance,
          installment.due_date,
        ]
      );
    }
    
    return schedule;
  } finally {
    await connection.end();
  }
}

async function getRepaymentSchedule(loanApplicationId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM repayment_schedules WHERE loan_application_id = ? ORDER BY installment_number`,
      [loanApplicationId]
    );
    return rows;
  } finally {
    await connection.end();
  }
}

module.exports = {
  calculateAmortizationSchedule,
  generateRepaymentSchedule,
  getRepaymentSchedule,
};