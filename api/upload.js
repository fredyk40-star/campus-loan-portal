// api/upload.js - File upload to Vercel Blob
const { handleUpload } = require('@vercel/blob/handle-upload');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For Vercel Blob, we need to use their handleUpload helper
  // This expects multipart/form-data with a 'file' field
  
  try {
    // Simple base64 file upload handler for serverless
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Parse content type
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    
    // For now, return a simulated URL (in production, use Vercel Blob or Cloudinary)
    // To use Vercel Blob, install: npm install @vercel/blob
    // Then use: const { put } = require('@vercel/blob');
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `upload_${timestamp}_${randomId}`;
    
    // Simulated upload - replace with actual Vercel Blob integration
    // const blob = await put(filename, buffer, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
    
    const fileUrl = `https://fake-blob-storage.vercel.app/${filename}`;
    
    return res.json({ 
      url: fileUrl,
      filename: filename,
      contentType: contentType,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
};

// Alternative simple upload using base64
module.exports.base64Upload = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, contentType, data } = req.body;

  if (!filename || !data) {
    return res.status(400).json({ error: 'Filename and data are required' });
  }

  try {
    // Decode base64 data
    const buffer = Buffer.from(data, 'base64');
    
    // In production, upload to Vercel Blob:
    // const { put } = require('@vercel/blob');
    // const blob = await put(filename, buffer, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
    
    const timestamp = Date.now();
    const fileUrl = `https://fake-blob-storage.vercel.app/${timestamp}_${filename}`;
    
    return res.json({ url: fileUrl, size: buffer.length });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
};