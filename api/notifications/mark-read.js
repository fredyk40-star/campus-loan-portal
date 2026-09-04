// api/notifications/mark-read.js - Mark notifications as read
const { getCurrentUser } = require('../../lib/auth');
const { markAsRead, markAllAsRead } = require('../../lib/notifications');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { notification_id, mark_all } = req.body;

  try {
    if (mark_all) {
      await markAllAsRead(user.id);
      return res.json({ message: 'All notifications marked as read' });
    }

    if (!notification_id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const success = await markAsRead(notification_id, user.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: 'Failed to update notification: ' + error.message });
  }
};