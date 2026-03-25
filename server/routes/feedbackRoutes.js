import express from 'express';
import { createFeedback, getAnalytics, getRecommendations, processBulkFeedback } from '../controllers/feedbackController.js';
import { requireAuth, requireAdmin, requireViewer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createFeedback);
router.post('/bulk', processBulkFeedback);
router.post('/upload', processBulkFeedback); // Secondary alias to satisfy external UI upload bindings

// Protect the analytics dashboard from public access but allow Viewers
router.get('/analytics', requireAuth, requireViewer, getAnalytics);

// AI Business Consultant endpoint
router.get('/recommendations', requireAuth, requireViewer, getRecommendations);

export default router;
