import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Offline (Mock Arrays Active)';
  
  res.status(200).json({
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      ai_engine: process.env.GEMINI_API_KEY ? 'Configured' : 'Missing',
      webhook_api: 'Operational'
    }
  });
});

export default router;
