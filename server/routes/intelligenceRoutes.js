import express from 'express';
import { getAnomalyReport } from '../controllers/intelligenceController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/anomalies', requireAuth, requireAdmin, getAnomalyReport);

export default router;
