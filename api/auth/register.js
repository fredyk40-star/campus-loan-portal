// api/auth/register.js - User registration
const { getConnection } = require('../../lib/db');
const { hashPassword, generateToken, setAuthCookie, verifyOrigin } = require('../../lib/auth');
const { isValidEmail } = require('../../lib/security');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, full_name, index_number, department } = req.body;

  if (!email || !password || !full_name || !index_number) {
    return res.status(400).json({ error: 'Email, password, full name, and index number are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const connection = await getConnection();
  try {
    // Check if user already exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Find or create student record
    const [students] = await connection.execute(
      'SELECT id FROM students WHERE index_number = ?',
      [index_number]
    );

    let studentId;
    if (students.length === 0) {
      const [result] = await connection.execute(
        'INSERT INTO students (index_number, full_name, department, level, email) VALUES (?, ?, ?, 300, ?)',
        [index_number, full_name, department || 'Not specified', email]
      );
      studentId = result.insertId;
    } else {
      studentId = students[0].id;
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password_hash, role, student_id) VALUES (?, ?, ?, ?)',
      [email, passwordHash, 'student', studentId]
    );

    // Generate token
    const user = {
      id: userResult.insertId,
      email,
      role: 'student',
      student_id: studentId,
    };
    const token = generateToken(user);

    // Set cookie
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);

    return res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed: ' + error.message });
  } finally {
    await connection.end();
  }
};