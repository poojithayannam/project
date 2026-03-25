import Integration from '../models/Integration.js';
import Feedback from '../models/Feedback.js';
import { memoryDb } from './feedbackController.js';
import { normalizeFeedback } from '../services/normalizeFeedback.js';
import { analyzeFeedbackWithGemini } from '../services/geminiService.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

export const registerPlatform = async (req, res, next) => {
  try {
    const { platformName, category } = req.body;
    if (!platformName) return res.status(400).json({ error: 'Platform Name is required' });

    const apiKey = crypto.randomUUID(); // Secure unique API Key generation
    const newIntegration = new Integration({ platformName, apiKey, category: category || 'General' });
    
    await newIntegration.save();
    res.status(201).json({ message: 'Platform registered successfully', apiKey, platformName });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Platform integration already exists.'});
    next(error);
  }
};

export const receiveWebhook = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const apiKey = req.body.apiKey || req.headers['x-api-key'];

    if (!apiKey) return res.status(401).json({ error: 'API Key is absolutely required for Multi-Source external injection.' });

    let integrationCategory = 'General';
    let designatedPlatform = platform;

    // Graceful Degradation bypass for Demo setups running without MongoDB
    if (mongoose.connection.readyState !== 1) {
       if (apiKey !== 'demo-secret-key') return res.status(401).json({ error: 'Unauthorized: Invalid API Key (Mock Run)' });
    } else {
       // Validate against Live Integration Database
       const integration = await Integration.findOne({ platformName: new RegExp(`^${platform}$`, 'i'), apiKey });
       if (!integration) return res.status(401).json({ error: 'Unauthorized: API Key does not match the Webhook domain.' });
       integrationCategory = integration.category;
       designatedPlatform = integration.platformName;
    }

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
              keywords: aiAnalysis.keywords || [],
              summary: aiAnalysis.summary || 'Summary unavailable'
            };
          });
          const batchResults = await Promise.all(batchPromises);
          processedPayloads.push(...batchResults.filter(Boolean));
        }

        if (mongoose.connection.readyState !== 1) {
           const mockDocs = processedPayloads.map(p => ({ _id: Date.now().toString() + Math.random().toString(), createdAt: new Date(), ...p }));
           memoryDb.push(...mockDocs);
           if (req.io) req.io.emit('new_feedback_received');
           return;
        }

        await Feedback.insertMany(processedPayloads);
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
