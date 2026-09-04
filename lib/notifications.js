// lib/notifications.js - Notification helpers with Gmail SMTP
const { getConnection } = require("./db");
const nodemailer = require("nodemailer");

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

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

// Send email notification via Gmail SMTP
async function sendEmailNotification(to, subject, htmlMessage) {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_USERNAME;
    const info = await transporter.sendMail({
      from: `"CampusLoan Portal" <${fromEmail}>`,
      to,
      subject,
      html: htmlMessage,
    });
    console.log("[EMAIL SENT] Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("[EMAIL ERROR]", error.message);
    return false;
  }
}

async function notifyStatusChange(applicationId, studentEmail, studentName, newStatus) {
  const message = `Your loan application #${applicationId} status has been updated to: ${newStatus}`;

  // Create in-app notification
  const connection = await getConnection();
  try {
    const [users] = await connection.execute(
      "SELECT u.id FROM users u JOIN students s ON u.student_id = s.id JOIN loan_applications la ON s.id = la.student_id WHERE la.id = ?",
      [applicationId]
    );
    if (users.length > 0) {
      await createNotification(users[0].id, "status_update", message, applicationId);
    }
  } finally {
    await connection.end();
  }

  // Send email notification
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1B365D; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">CampusLoan Portal</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <p>Dear ${studentName},</p>
        <p>${message}</p>
        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Status:</strong> ${newStatus}</p>
          <p style="margin: 5px 0 0 0;"><strong>Application ID:</strong> #${applicationId}</p>
        </div>
        <p>You can view your application status by logging into the portal.</p>
      </div>
      <div style="background: #1B365D; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from CampusLoan Portal</p>
      </div>
    </div>
  `;
  await sendEmailNotification(studentEmail, `Loan Application #${applicationId} - Status Update`, htmlBody);
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendEmailNotification,
  notifyStatusChange,
};
