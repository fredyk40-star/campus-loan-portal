// api/applications.js - Loan Applications API (Updated with Auth and File Upload)
const { getConnection } = require("../../lib/db");
const { getCurrentUser } = require("../../lib/auth");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let connection;
  try {
    connection = await getConnection();

    if (req.method === "GET") {
      const user = await getCurrentUser(req);
      let query = `SELECT l.*, s.full_name, s.index_number, s.department FROM loan_applications l JOIN students s ON l.student_id = s.id`;
      const params = [];
      if (!user || user.role !== "admin") {
        query += ` WHERE s.id = ?`;
        params.push(user?.student_id || 0);
      }
      query += ` ORDER BY l.applied_at DESC`;
      const [rows] = await connection.execute(query, params);
      return res.json(rows);
    }

    if (req.method === "POST") {
      const user = await getCurrentUser(req);
      const { index_number, full_name, department, amount, reason, grad_year, document_url } = req.body;

      if (!index_number || !full_name || !department || !amount || !reason || !grad_year) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const [students] = await connection.execute("SELECT id FROM students WHERE index_number = ?", [index_number]);
      let student_id;
      if (students.length === 0) {
        const [result] = await connection.execute(
          "INSERT INTO students (index_number, full_name, department, level, email) VALUES (?, ?, ?, 300, ?)",
          [index_number, full_name, department, index_number.toLowerCase() + "@upsa.edu.gh"]
        );
        student_id = result.insertId;
      } else {
        student_id = students[0].id;
      }

      const [result] = await connection.execute(
        `INSERT INTO loan_applications (student_id, amount_requested, reason, expected_graduation_year, status, document_url, user_id) VALUES (?, ?, ?, ?, \'Under Review\', ?, ?)`,
        [student_id, parseFloat(amount), reason, parseInt(grad_year), document_url || null, user?.id || null]
      );

      return res.status(201).json({ message: "Loan application submitted successfully!", application_id: result.insertId });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Database error: " + error.message });
  } finally {
    if (connection) await connection.end();
  }
};
