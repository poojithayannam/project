import crypto from 'crypto';
import { getDb } from '../db.js';
import { normalizeFeedback } from '../services/normalizeFeedback.js';
import { analyzeFeedbackWithGemini } from '../services/geminiService.js';

export const registerPlatform = async (req, res, next) => {
  try {
    const { platformName, category } = req.body;
    if (!platformName) return res.status(400).json({ error: 'Platform Name is required' });

    const apiKey = crypto.randomUUID(); // Secure unique API Key generation
    const db = getDb();
    
    try {
      await db.run('INSERT INTO integrations (platformName, apiKey, category) VALUES (?, ?, ?)', [
        platformName, apiKey, category || 'General'
      ]);
      res.status(201).json({ message: 'Platform registered successfully', apiKey, platformName });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Platform integration already exists.'});
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const receiveWebhook = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const apiKey = req.body.apiKey || req.headers['x-api-key'];

    if (!apiKey) return res.status(401).json({ error: 'API Key is absolutely required for Multi-Source external injection.' });

    const db = getDb();
    
    // Case-insensitive query using COLLATE NOCASE
    const integration = await db.get('SELECT * FROM integrations WHERE platformName COLLATE NOCASE = ? AND apiKey = ?', [platform, apiKey]);
    
    if (!integration) return res.status(401).json({ error: 'Unauthorized: API Key does not match the Webhook domain.' });

    const integrationCategory = integration.category;
    const designatedPlatform = integration.platformName;

    // Pass data through newly architected Normalization matrix
    const normalizedRows = normalizeFeedback(req.body, designatedPlatform);
    if (normalizedRows.length === 0) return res.status(400).json({ error: 'No valid textual reviews found to analyze in webhook payload.' });

    const jobId = `webhook_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    process.nextTick(async () => {
      try {
        const processedPayloads = [];
        const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
        const batches = chunkArray(normalizedRows, 10);

        for (const batch of batches) {
          const batchPromises = batch.map(async (review) => {
            const aiAnalysis = await analyzeFeedbackWithGemini(review.text, integrationCategory);
            return {
              feedbackText: review.text,
              rating: review.rating,
              category: integrationCategory,
              platform: designatedPlatform,
              sentiment: aiAnalysis.sentiment || 'Neutral',
              sentimentScore: aiAnalysis.sentimentScore || 50,
              emotion: aiAnalysis.emotion || 'Unknown',
              userFeelingExplanation: aiAnalysis.userFeelingExplanation || 'No explanation generated',
              keywords: aiAnalysis.keywords ? JSON.stringify(aiAnalysis.keywords) : '[]',
              summary: aiAnalysis.summary || 'Summary unavailable'
            };
          });
          const batchResults = await Promise.all(batchPromises);
          processedPayloads.push(...batchResults.filter(Boolean));
        }

        // Insert all processed payloads into db sequentially (or wrap in a transaction inside loop)
        for (const p of processedPayloads) {
          await db.run(
            `INSERT INTO feedbacks (feedbackText, rating, category, platform, sentiment, sentimentScore, emotion, userFeelingExplanation, keywords, summary) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.feedbackText,
              p.rating,
              p.category,
              p.platform,
              p.sentiment,
              p.sentimentScore,
              p.emotion,
              p.userFeelingExplanation,
              p.keywords,
              p.summary
            ]
          );
        }
        
        if (req.io) req.io.emit('new_feedback_received');
      } catch (err) {
        console.error("Webhook Background Processing Error:", err.message);
      }
    });

    res.status(202).json({ 
      message: `Multi-Source Webhook accepted into Event Queue. Processing ${normalizedRows.length} ${designatedPlatform} arrays asymptomatically.`, 
      jobId,
      status: 'queued'
    });

  } catch (error) {
    next(error);
  }
};
