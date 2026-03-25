import Feedback from '../models/Feedback.js';
import { analyzeFeedbackWithGemini, getBusinessRecommendations } from '../services/geminiService.js';
import mongoose from 'mongoose';

// Fallback Memory Data array
export const memoryDb = [];

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

    const payload = {
      feedbackText: trimmedText,
      rating,
      category: submittedCategory,
      platform: 'Direct',
      sentiment: aiAnalysis.sentiment || 'Neutral',
      sentimentScore: aiAnalysis.sentimentScore || 50,
      emotion: aiAnalysis.emotion || 'Unknown',
      userFeelingExplanation: aiAnalysis.userFeelingExplanation || 'No detailed explanation provided',
      keywords: aiAnalysis.keywords || [],
      summary: aiAnalysis.summary || 'Summary unavailable'
    };

    if (mongoose.connection.readyState !== 1) {
      const mockDocument = { _id: Date.now().toString(), createdAt: new Date(), ...payload };
      memoryDb.push(mockDocument);
      if (req.io) req.io.emit('new_feedback_received');
      return res.status(201).json(mockDocument);
    }

    const newFeedback = new Feedback(payload);
    await newFeedback.save();
    
    // Broadcast instantly to all connected dashboards via WebSocket
    if (req.io) req.io.emit('new_feedback_received');
    
    res.status(201).json(newFeedback);

  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const { category, platform, timeRange } = req.query;
    const matchStage = {};
    if (category && category !== 'All') matchStage.category = category;
    if (platform && platform !== 'All') matchStage.platform = platform;
    
    if (timeRange && timeRange !== 'All') {
      const dateLimit = new Date();
      if (timeRange === '7d') dateLimit.setDate(dateLimit.getDate() - 7);
      if (timeRange === '30d') dateLimit.setDate(dateLimit.getDate() - 30);
      matchStage.createdAt = { $gte: dateLimit };
    }

    if (mongoose.connection.readyState !== 1) {
      let filteredDb = memoryDb;
      if (category && category !== 'All') filteredDb = filteredDb.filter(f => f.category === category);
      if (platform && platform !== 'All') filteredDb = filteredDb.filter(f => f.platform === platform);
      if (timeRange && timeRange !== 'All') {
        const dateLimit = new Date();
        if (timeRange === '7d') dateLimit.setDate(dateLimit.getDate() - 7);
        if (timeRange === '30d') dateLimit.setDate(dateLimit.getDate() - 30);
        filteredDb = filteredDb.filter(f => new Date(f.createdAt) >= dateLimit);
      }
      
      const sentimentCounts = [
        { _id: 'Positive', count: filteredDb.filter(f => f.sentiment === 'Positive').length },
        { _id: 'Neutral', count: filteredDb.filter(f => f.sentiment === 'Neutral').length },
        { _id: 'Negative', count: filteredDb.filter(f => f.sentiment === 'Negative').length }
      ].filter(c => c.count > 0);

      const emotionMap = {};
      filteredDb.forEach(f => { emotionMap[f.emotion] = (emotionMap[f.emotion] || 0) + 1; });
      let topEmotion = null;
      const sortedEmotions = Object.entries(emotionMap).sort((a,b) => b[1]-a[1]);
      if (sortedEmotions.length > 0) topEmotion = { _id: sortedEmotions[0][0], count: sortedEmotions[0][1] };

      const keywordMap = {};
      filteredDb.forEach(f => {
        if (f.keywords) f.keywords.forEach(kw => { keywordMap[kw] = (keywordMap[kw] || 0) + 1; });
      });
      const keywordFreq = Object.entries(keywordMap).sort((a,b) => b[1]-a[1]).slice(0,5).map(arr => ({ _id: arr[0], count: arr[1] }));
      
      const platformMap = {};
      filteredDb.forEach(f => { platformMap[f.platform] = (platformMap[f.platform] || { count: 0, score: 0 }); platformMap[f.platform].count++; platformMap[f.platform].score += (f.sentimentScore || 50); });
      const platformBreakdown = Object.entries(platformMap).sort((a,b) => b[1].count-a[1].count).map(arr => ({ _id: arr[0], count: arr[1].count, avgScore: Math.round(arr[1].score / arr[1].count) }));

      const timeline = filteredDb.slice(-10).map(f => ({
        date: new Date(f.createdAt).toLocaleDateString(),
        score: f.sentimentScore
      }));

      const recentFeedbacks = filteredDb.slice(-20).map(f => ({
        id: f._id,
        text: f.feedbackText,
        sentiment: f.sentiment,
        rating: f.rating || 5,
        category: f.category,
        platform: f.platform || 'Direct',
        date: new Date(f.createdAt).toLocaleString()
      })).reverse();

      return res.json({ sentimentCounts, topEmotion, keywordFreq, timeline, platformBreakdown, forecast: 50, historicalDelta: 0, currentAvg: 50, recentFeedbacks });
    }

    const sentimentCounts = await Feedback.aggregate([ { $match: matchStage }, { $group: { _id: '$sentiment', count: { $sum: 1 } } } ]);
    const topEmotion = await Feedback.aggregate([ { $match: matchStage }, { $group: { _id: '$emotion', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 1 } ]);
    const keywordFreq = await Feedback.aggregate([ { $match: matchStage }, { $unwind: '$keywords' }, { $group: { _id: '$keywords', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 } ]);
    
    // Abstracted Engine Mapping Average Platform Scores
    const platformBreakdown = await Feedback.aggregate([
      { $match: matchStage },
      { $group: { _id: '$platform', count: { $sum: 1 }, avgScore: { $avg: '$sentimentScore' } } },
      { $sort: { count: -1 } }
    ]);

    const timelineRaw = await Feedback.find(matchStage).sort({ createdAt: -1 }).limit(10).select('createdAt sentimentScore');
    const timeline = timelineRaw.reverse().map(item => ({
      date: item.createdAt.toLocaleDateString(),
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
    const current7 = new Date(); current7.setDate(current7.getDate() - 7);
    const previous7 = new Date(); previous7.setDate(previous7.getDate() - 14);

    const currentPeriodAvg = await Feedback.aggregate([ { $match: { ...matchStage, createdAt: { $gte: current7 } } }, { $group: { _id: null, avgScore: { $avg: '$sentimentScore' } } } ]);
    const previousPeriodAvg = await Feedback.aggregate([ { $match: { ...matchStage, createdAt: { $gte: previous7, $lt: current7 } } }, { $group: { _id: null, avgScore: { $avg: '$sentimentScore' } } } ]);

    const currentAvg = currentPeriodAvg[0]?.avgScore || 0;
    const prevAvg = previousPeriodAvg[0]?.avgScore || 0;
    const historicalDelta = prevAvg === 0 ? 0 : ((currentAvg - prevAvg) / prevAvg) * 100;

    const recentFeedbacksDocs = await Feedback.find(matchStage).sort({ createdAt: -1 }).limit(20);
    const recentFeedbacks = recentFeedbacksDocs.map(f => ({
        id: f._id,
        text: f.feedbackText,
        sentiment: f.sentiment,
        rating: f.rating || 5,
        category: f.category,
        platform: f.platform || 'Direct',
        date: new Date(f.createdAt).toLocaleString()
    }));

    res.json({ 
      sentimentCounts, 
      topEmotion: Array.isArray(topEmotion) && topEmotion.length > 0 ? topEmotion[0] : topEmotion, 
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
    const { category } = req.query;
    const matchStage = (category && category !== 'All') ? { category } : {};
    
    let recentFeedbacks = [];
    if (mongoose.connection.readyState !== 1) {
      const filteredDb = (category && category !== 'All') ? memoryDb.filter(f => f.category === category) : memoryDb;
      recentFeedbacks = filteredDb.slice(-30).map(f => ({ text: f.feedbackText, sentiment: f.sentiment }));
    } else {
      recentFeedbacks = await Feedback.find(matchStage).sort({ createdAt: -1 }).limit(30).select('feedbackText sentiment -_id');
    }

    if (recentFeedbacks.length === 0) {
      return res.json({ recommendations: [{ title: 'Insufficient Data', description: 'Not enough feedback to generate trends.', impact: 'Low' }]});
    }

    const aiInsights = await getBusinessRecommendations(recentFeedbacks);
    res.json(aiInsights);
  } catch (error) {
    next(error);
  }
};

import logger from '../utils/logger.js';

const backgroundBatchProcessor = async (reviews, assignedCategory, assignedPlatform, reqIo) => {
  try {
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
       if (reqIo) reqIo.emit('new_feedback_received');
       return;
    }

    await Feedback.insertMany(processedPayloads);
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

    // Instantly return 202 to circumvent Timeout / Thread Locks
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
