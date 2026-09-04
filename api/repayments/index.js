// api/repayments/index.js - Get repayment schedule for a loan
const { getConnection } = require('../../lib/db');
const { getCurrentUser } = require('../../lib/auth');
const { getRepaymentSchedule } = require('../../lib/repayments');
const { isValidInt } = require('../../lib/security');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get current user
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { loan_id } = req.query;

  if (!loan_id) {
    return res.status(400).json({ error: 'Loan ID is required' });
  }

  const connection = await getConnection();
  try {
    // Verify user owns this loan (or is admin)
    const [loans] = await connection.execute(
      `SELECT l.* FROM loan_applications l
       JOIN students s ON l.student_id = s.id
       LEFT JOIN users u ON s.id = u.student_id
       WHERE l.id = ? AND (u.id = ? OR ? = 'admin')`,
      [loan_id, user.id, user.role]
    );

    if (loans.length === 0) {
      return res.status(404).json({ error: 'Loan not found or access denied' });
    }

    const schedule = await getRepaymentSchedule(loan_id);

    // Calculate summary
    const summary = {
      loan: loans[0],
      total_installments: schedule.length,
      total_principal: schedule.reduce((sum, s) => sum + parseFloat(s.principal_amount), 0),
      total_interest: schedule.reduce((sum, s) => sum + parseFloat(s.interest_amount), 0),
      total_payable: schedule.reduce((sum, s) => sum + parseFloat(s.total_payment), 0),
      first_payment_date: schedule[0]?.due_date || null,
      last_payment_date: schedule[schedule.length - 1]?.due_date || null,
    };

    return res.json({ schedule, summary });
  } catch (error) {
    console.error('Repayment error:', error);
    return res.status(500).json({ error: 'Failed to fetch repayment schedule: ' + error.message });
  } finally {
    await connection.end();
  }
};