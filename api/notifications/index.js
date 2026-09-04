// api/notifications/index.js - Get user notifications
const { getCurrentUser } = require('../../lib/auth');
const { getNotifications } = require('../../lib/notifications');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { unread_only } = req.query;

  try {
    const notifications = await getNotifications(user.id, unread_only === 'true');
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.json({
      notifications,
      unread_count: unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications: ' + error.message });
  }
};