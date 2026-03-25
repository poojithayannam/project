import express from 'express';
import { registerPlatform, receiveWebhook } from '../controllers/integrationController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Internal Admin: Create new API keys for 3rd party services
router.post('/register', requireAuth, requireAdmin, registerPlatform);

// External Webhook: 3rd party POSTs to this with their specific API key in body/header
router.post('/:platform', receiveWebhook);

export default router;
