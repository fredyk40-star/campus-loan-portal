// api/applications.js - Loan Applications API
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT) || 4000,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_NAME,
  ssl: process.env.MYSQL_SSL === '1' ? { rejectUnauthorized: true } : false,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    if (req.method === 'GET') {
      const [rows] = await connection.execute(
        `SELECT l.*, s.full_name, s.index_number, s.department 
         FROM loan_applications l 
         JOIN students s ON l.student_id = s.id 
         ORDER BY l.applied_at DESC LIMIT 5`
      );
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { index_number, full_name, department, amount, reason, grad_year } = req.body;

      if (!index_number || !full_name || !department || !amount || !reason || !grad_year) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if student exists
      const [students] = await connection.execute(
        'SELECT id FROM students WHERE index_number = ?',
        [index_number]
      );

      let student_id;
      if (students.length === 0) {
        const [result] = await connection.execute(
          'INSERT INTO students (index_number, full_name, department, level, email) VALUES (?, ?, ?, 300, ?)',
          [index_number, full_name, department, index_number.toLowerCase() + '@upsa.edu.gh']
        );
        student_id = result.insertId;
      } else {
        student_id = students[0].id;
      }

      // Insert loan application
      await connection.execute(
        `INSERT INTO loan_applications (student_id, amount_requested, reason, expected_graduation_year, status) 
         VALUES (?, ?, ?, ?, 'Under Review')`,
        [student_id, parseFloat(amount), reason, parseInt(grad_year)]
      );

      return res.status(201).json({ message: 'Loan application submitted successfully!' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error: ' + error.message });
  } finally {
    if (connection) await connection.end();
  }
};