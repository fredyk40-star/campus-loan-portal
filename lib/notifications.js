// lib/notifications.js - Notification helpers
const { getConnection } = require('./db');

async function createNotification(userId, type, message, loanApplicationId = null) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO notifications (user_id, loan_application_id, type, message) VALUES (?, ?, ?, ?)`,
      [userId, loanApplicationId, type, message]
    );
    return result.insertId;
  } finally {
    await connection.end();
  }
}

async function getNotifications(userId, unreadOnly = false) {
  const connection = await getConnection();
  try {
    let query = `SELECT * FROM notifications WHERE user_id = ?`;
    const params = [userId];
    
    if (unreadOnly) {
      query += ` AND is_read = FALSE`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}

async function markAsRead(notificationId, userId) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  } finally {
    await connection.end();
  }
}

async function markAllAsRead(userId) {
  const connection = await getConnection();
  try {
    await connection.execute(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ?`,
      [userId]
    );
  } finally {
    await connection.end();
  }
}

// Send email notification (simulated - logs to console in development)
async function sendEmailNotification(to, subject, message) {
  // In production, integrate with Resend, SendGrid, or Nodemailer
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  console.log(`[EMAIL] Message: ${message}`);
  
  // Example with Resend (uncomment when ready):
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: process.env.FROM_EMAIL || 'noreply@campusloan.com',
  //   to,
  //   subject,
  //   html: message,
  // });
  
  return true;
}

async function notifyStatusChange(applicationId, studentEmail, studentName, newStatus) {
  const message = `Your loan application #${applicationId} status has been updated to: ${newStatus}`;
  
  // Create in-app notification
  const connection = await getConnection();
  try {
    const [users] = await connection.execute(
      'SELECT u.id FROM users u JOIN students s ON u.student_id = s.id JOIN loan_applications la ON s.id = la.student_id WHERE la.id = ?',
      [applicationId]
    );
    
    if (users.length > 0) {
      await createNotification(users[0].id, 'status_update', message, applicationId);
    }
  } finally {
    await connection.end();
  }
  
  // Send email notification
  await sendEmailNotification(
    studentEmail,
    `Loan Application #${applicationId} - Status Update`,
    `<p>Dear ${studentName},</p><p>${message}</p><p>Best regards,<br>CampusLoan Team</p>`
  );
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendEmailNotification,
  notifyStatusChange,
};