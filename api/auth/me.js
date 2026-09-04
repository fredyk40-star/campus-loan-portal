// api/auth/me.js - Get current user
const { getCurrentUser } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  return res.json({ user });
};