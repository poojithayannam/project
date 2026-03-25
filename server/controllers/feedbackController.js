import { analyzeFeedbackWithGemini, getBusinessRecommendations } from '../services/geminiService.js';
import { getDb } from '../db.js';
import logger from '../utils/logger.js';

export const createFeedback = async (req, res, next) => {
  try {
    const { feedbackText, rating, category } = req.body;
    
    if (!feedbackText || typeof feedbackText !== 'string') return res.status(400).json({ error: 'Feedback text is required and must be a string' });
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) return res.status(400).json({ error: 'A valid rating between 1 and 5 is required' });
    
    const submittedCategory = category || 'General';
    const trimmedText = feedbackText.trim();
    if (trimmedText.length < 10) return res.status(400).json({ error: 'Feedback must be at least 10 characters long.' });
    if (trimmedText.length > 2000) return res.status(400).json({ error: 'Feedback exceeds the maximum allowed length.' });

    const aiAnalysis = await analyzeFeedbackWithGemini(trimmedText, submittedCategory);
    
    const db = getDb();
    const result = await db.run(`
      INSERT INTO feedbacks (feedbackText, rating, category, platform, sentiment, sentimentScore, emotion, userFeelingExplanation, keywords, summary) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      trimmedText,
      rating,
      submittedCategory,
      'Direct',
      aiAnalysis.sentiment || 'Neutral',
      aiAnalysis.sentimentScore || 50,
      aiAnalysis.emotion || 'Unknown',
      aiAnalysis.userFeelingExplanation || 'No detailed explanation provided',
      JSON.stringify(aiAnalysis.keywords || []),
      aiAnalysis.summary || 'Summary unavailable'
    ]);

    const newFeedback = await db.get('SELECT * FROM feedbacks WHERE id = ?', [result.lastID]);
    newFeedback._id = newFeedback.id; // Map _id for frontend compatibility
    try {
      newFeedback.keywords = JSON.parse(newFeedback.keywords);
    } catch(e) { newFeedback.keywords = []; }

    if (req.io) req.io.emit('new_feedback_received');
    
    res.status(201).json(newFeedback);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const db = getDb();
    const { category, platform, timeRange } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    
    if (category && category !== 'All') { whereClause += ' AND category = ?'; params.push(category); }
    if (platform && platform !== 'All') { whereClause += ' AND platform = ?'; params.push(platform); }
    
    if (timeRange && timeRange !== 'All') {
      let days = timeRange === '7d' ? 7 : 30;
      whereClause += ` AND createdAt >= datetime('now', '-${days} days')`;
    }

    // Sentiment Counts
    const sentimentQ = await db.all(`SELECT sentiment as _id, count(*) as count FROM feedbacks WHERE ${whereClause} GROUP BY sentiment`, params);
    
    // Top Emotion
    const emotionQ = await db.get(`SELECT emotion as _id, count(*) as count FROM feedbacks WHERE ${whereClause} GROUP BY emotion ORDER BY count DESC LIMIT 1`, params);

    // Platform Breakdown
    const platformQ = await db.all(`
      SELECT platform as _id, count(*) as count, AVG(sentimentScore) as avgScore 
      FROM feedbacks WHERE ${whereClause} GROUP BY platform ORDER BY count DESC
    `, params);
    const platformBreakdown = platformQ.map(p => ({ ...p, avgScore: Math.round(p.avgScore) }));

    // Keywords Freq (requires pulling all matches mapping in node)
    const keywordsRaw = await db.all(`SELECT keywords FROM feedbacks WHERE ${whereClause}`, params);
    const keywordMap = {};
    keywordsRaw.forEach(row => {
      try {
        const kws = JSON.parse(row.keywords || '[]');
        kws.forEach(kw => { keywordMap[kw] = (keywordMap[kw] || 0) + 1; });
      } catch (e) {}
    });
    const keywordFreq = Object.entries(keywordMap).sort((a,b) => b[1]-a[1]).slice(0,5).map(arr => ({ _id: arr[0], count: arr[1] }));

    // Timeline
    const timelineRaw = await db.all(`SELECT createdAt, sentimentScore FROM feedbacks WHERE ${whereClause} ORDER BY createdAt DESC LIMIT 10`, params);
    const timeline = timelineRaw.reverse().map(item => ({
      date: new Date(item.createdAt).toLocaleDateString(),
      score: item.sentimentScore
    }));

    // Predictive Math Engine: Moving Average + Linear Regression Forecast
    let forecast = 50;
    const scores = timeline.map(t => t.score);
    if (scores.length >= 2) {
       const x = Array.from({length: scores.length}, (_, i) => i);
       const meanX = x.reduce((a,b)=>a+b,0)/x.length;
       const meanY = scores.reduce((a,b)=>a+b,0)/scores.length;
       const slope = x.reduce((sum, xi, i) => sum + (xi - meanX) * (scores[i] - meanY), 0) / x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
       forecast = Math.min(100, Math.max(1, meanY + slope * (scores.length)));
    }

    // Historical Performance Differential Engine
    let currentAvg = 0; let prevAvg = 0; let historicalDelta = 0;
    
    const curAvgQ = await db.get(`SELECT AVG(sentimentScore) as avgScore FROM feedbacks WHERE ${whereClause} AND createdAt >= datetime('now', '-7 days')`, params);
    const prevAvgQ = await db.get(`SELECT AVG(sentimentScore) as avgScore FROM feedbacks WHERE ${whereClause} AND createdAt >= datetime('now', '-14 days') AND createdAt < datetime('now', '-7 days')`, params);
    
    currentAvg = curAvgQ?.avgScore || 0;
    prevAvg = prevAvgQ?.avgScore || 0;
    historicalDelta = prevAvg === 0 ? 0 : ((currentAvg - prevAvg) / prevAvg) * 100;

    // Recent Feedbacks
    const recentFeedbacksDocs = await db.all(`SELECT * FROM feedbacks WHERE ${whereClause} ORDER BY createdAt DESC LIMIT 20`, params);
    const recentFeedbacks = recentFeedbacksDocs.map(f => ({
        id: f.id,
        text: f.feedbackText,
        sentiment: f.sentiment,
        rating: f.rating || 5,
        category: f.category,
        platform: f.platform || 'Direct',
        date: new Date(f.createdAt).toLocaleString()
    }));

    res.json({ 
      sentimentCounts: sentimentQ, 
      topEmotion: emotionQ || null, 
      keywordFreq, 
      timeline, 
      platformBreakdown, 
      forecast: Math.round(forecast), 
      historicalDelta: Math.round(historicalDelta), 
      currentAvg: Math.round(currentAvg), 
      recentFeedbacks 
    });
  } catch (error) {
    next(error);
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const db = getDb();
    const { category } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    if (category && category !== 'All') { whereClause += ' AND category = ?'; params.push(category); }
    
    const recentDb = await db.all(`SELECT feedbackText as text, sentiment FROM feedbacks WHERE ${whereClause} ORDER BY createdAt DESC LIMIT 30`, params);
    
    if (recentDb.length === 0) {
      return res.json({ recommendations: [{ title: 'Insufficient Data', description: 'Not enough feedback to generate trends.', impact: 'Low' }]});
    }

    const aiInsights = await getBusinessRecommendations(recentDb);
    res.json(aiInsights);
  } catch (error) {
    next(error);
  }
};

const backgroundBatchProcessor = async (reviews, assignedCategory, assignedPlatform, reqIo) => {
  try {
    const db = getDb();
    const processedPayloads = [];
    const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
    const batches = chunkArray(reviews, 10);

    for (const batch of batches) {
      const batchPromises = batch.map(async (review) => {
        const text = typeof review === 'object' ? review.text : review;
        const rating = typeof review === 'object' ? (review.rating || 3) : 3;
        if (!text || text.trim().length < 5) return null;

        const aiAnalysis = await analyzeFeedbackWithGemini(text.trim(), assignedCategory);
        
        return {
          feedbackText: text.trim(),
          rating: rating,
          category: assignedCategory,
          platform: assignedPlatform,
          sentiment: aiAnalysis.sentiment || 'Neutral',
          sentimentScore: aiAnalysis.sentimentScore || 50,
          emotion: aiAnalysis.emotion || 'Unknown',
          userFeelingExplanation: aiAnalysis.userFeelingExplanation || 'No explanation generated',
          keywords: JSON.stringify(aiAnalysis.keywords || []),
          summary: aiAnalysis.summary || 'Summary unavailable'
        };
      });

      const batchResults = await Promise.all(batchPromises);
      processedPayloads.push(...batchResults.filter(Boolean));
    }

    for (const p of processedPayloads) {
        await db.run(
          `INSERT INTO feedbacks (feedbackText, rating, category, platform, sentiment, sentimentScore, emotion, userFeelingExplanation, keywords, summary) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.feedbackText, p.rating, p.category, p.platform, p.sentiment, p.sentimentScore, p.emotion, p.userFeelingExplanation, p.keywords, p.summary]
        );
    }
    
    if (reqIo) reqIo.emit('new_feedback_received');
  } catch (err) {
    logger.error(`Background Job Failed: ${err.message}`);
  }
};

export const processBulkFeedback = async (req, res, next) => {
  try {
    const { platform, category, reviews } = req.body;
    
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ error: 'A valid array of reviews is required' });
    }

    const assignedPlatform = platform || 'Direct';
    const assignedCategory = category || 'General';
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Fire & Forget Background Worker Pipeline
    process.nextTick(() => backgroundBatchProcessor(reviews, assignedCategory, assignedPlatform, req.io));

    res.status(202).json({ 
      message: `Batch payload accepted. Event-Driven queue extracting ${reviews.length} nodes natively.`,
      jobId,
      status: 'pending',
      platform: assignedPlatform
    });

  } catch (error) {
    next(error);
  }
};
