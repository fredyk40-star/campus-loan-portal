// api/admin/applications.js - Admin: manage all applications
const { getConnection } = require('../../lib/db');
const { requireAdmin } = require('../../lib/auth');
const { notifyStatusChange } = require('../../lib/notifications');
const { generateRepaymentSchedule } = require('../../lib/repayments');

module.exports = async (req, res) => {
  // Verify admin access
  try {
    await requireAdmin(req, res);
  } catch (error) {
    return; // Response already sent by requireAdmin
  }

  const connection = await getConnection();
  try {
    if (req.method === 'GET') {
      // Get all applications with student info
      const [applications] = await connection.execute(
        `SELECT l.*, s.full_name, s.index_number, s.department, s.email, s.level,
                u.id as user_id
         FROM loan_applications l 
         JOIN students s ON l.student_id = s.id 
         LEFT JOIN users u ON s.id = u.student_id
         ORDER BY l.applied_at DESC`
      );
      return res.json(applications);
    }

    if (req.method === 'PUT') {
      const { application_id, status, interest_rate, repayment_years } = req.body;

      if (!application_id || !status) {
        return res.status(400).json({ error: 'Application ID and status are required' });
      }

      // Get current application details
      const [apps] = await connection.execute(
        `SELECT l.*, s.email, s.full_name 
         FROM loan_applications l 
         JOIN students s ON l.student_id = s.id 
         WHERE l.id = ?`,
        [application_id]
      );

      if (apps.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const application = apps[0];

      // Update status
      await connection.execute(
        'UPDATE loan_applications SET status = ? WHERE id = ?',
        [status, application_id]
      );

      // If approved, generate repayment schedule
      if (status === 'Approved' && interest_rate && repayment_years) {
        await generateRepaymentSchedule(
          application_id,
          application.amount_requested,
          interest_rate,
          repayment_years
        );
      }

      // Send notification to student
      await notifyStatusChange(
        application_id,
        application.email,
        application.full_name,
        status
      );

      return res.json({ 
        message: 'Application updated successfully',
        status,
        repayment_generated: status === 'Approved' && interest_rate ? true : false,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin error:', error);
    return res.status(500).json({ error: 'Operation failed: ' + error.message });
  } finally {
    await connection.end();
  }
};