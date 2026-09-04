// api/upload.js - File upload with authentication and validation (P1 #7)
const { getCurrentUser } = require('../lib/auth');
const { validateFileUpload, MAX_FILE_SIZE } = require('../lib/security');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY (P1 #7): Require authentication for uploads
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // SECURITY (P1 #7): Enforce request body size limit
  const contentLength = parseInt(req.headers['content-length']) || 0;
  if (contentLength > MAX_FILE_SIZE) {
    return res.status(413).json({ error: 'File size exceeds 5MB limit' });
  }

  // SECURITY (P1 #7): Validate content type (MIME whitelist)
  const rawContentType = req.headers['content-type'] || '';
  const baseType = rawContentType.split(';')[0].trim();
  const typeCheck = validateFileUpload(baseType, contentLength || MAX_FILE_SIZE);
  if (!typeCheck.valid) {
    return res.status(400).json({ error: typeCheck.error });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
      // SECURITY: Abort early if accumulated data exceeds limit
      const total = chunks.reduce((sum, c) => sum + c.length, 0);
      if (total > MAX_FILE_SIZE) {
        return res.status(413).json({ error: 'File size exceeds 5MB limit' });
      }
    }
    const buffer = Buffer.concat(chunks);

    // SECURITY (P1 #7): Re-validate actual size
    const sizeCheck = validateFileUpload(baseType, buffer.length);
    if (!sizeCheck.valid) {
      return res.status(400).json({ error: sizeCheck.error });
    }

    // SECURITY: Generate safe filename (no user input in path)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = baseType === 'application/pdf' ? 'pdf' : baseType === 'image/png' ? 'png' : 'jpg';
    const filename = `upload_${timestamp}_${randomId}.${extension}`;

    // Upload to Vercel Blob when BLOB_READ_WRITE_TOKEN is configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = require('@vercel/blob');
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: baseType,
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return res.json({
        url: blob.url,
        filename,
        contentType: baseType,
        size: buffer.length,
      });
    }

    // Fallback: no blob token configured
    return res.status(503).json({ error: 'File storage is not configured. Set BLOB_READ_WRITE_TOKEN.' });
  } catch (error) {
    console.error('Upload error:', error);
    // SECURITY (P2 #11): Generic error to client
    return res.status(500).json({ error: 'Upload failed' });
  }
};