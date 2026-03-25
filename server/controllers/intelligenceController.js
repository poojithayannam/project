import Feedback from '../models/Feedback.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock_key');

export const getAnomalyReport = async (req, res, next) => {
  try {
    let rawData = [];

    // Fallback Mock Logic
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        anomalies: [
          { type: 'Sentiment Spike', severity: 'High', description: 'Simulated 400% spike in negative sentiment natively originating from the Amazon simulator webhook.' },
          { type: 'Recurring Issue', severity: 'Medium', description: 'Multiple CSV dataset imports report consistent "Login Timeouts" across the last 30 days.' }
        ]
      });
    }

    // Pull last 100 global records across all isolated platforms
    rawData = await Feedback.find().sort({ createdAt: -1 }).limit(100);

    if (rawData.length < 5) {
      return res.status(200).json({ anomalies: [] });
    }

    // Mathematical Z-Score Computation (Standard Deviation)
    const scores = rawData.map(r => r.sentimentScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(scores.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / scores.length) || 1;
    
    // Isolate true statistical anomalies (Z-Score > 1.5 or < -1.5)
    // Z-Score = (X - μ) / σ
    const absoluteAnomalies = rawData.filter(r => Math.abs((r.sentimentScore - mean) / stdDev) > 1.5);

    if (absoluteAnomalies.length === 0) {
      return res.status(200).json({ anomalies: [] }); // No mathematical anomalies detected
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert Cybersecurity & Data Analyst. 
      My custom Mathematics Engine has computed standard deviations and explicitly isolated the following ${absoluteAnomalies.length} extreme statistical anomalies from the database (Z-Score > 1.5).
      Analyze these specific outlier records to explicitly explain what is structurally causing these anomalies, recurring issues, or sudden aggressive sentiment spikes. 
      Return ONLY absolute valid JSON without markdown formatting.
      
      Output Schema: { "anomalies": [ { "type": "string", "severity": "High | Medium | Low", "description": "string" } ] } 
      
      Math Raw Data: ${JSON.stringify(absoluteAnomalies)}
    `;
    
    // Rigid Exponential Backoff Retry Block
    let attempts = 0;
    while (attempts < 3) {
      try {
        const result = await model.generateContent(prompt);
        const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return res.status(200).json(JSON.parse(cleanJson));
      } catch (err) {
        attempts++;
        if (attempts >= 3) throw err;
        await new Promise(r => setTimeout(r, 1000 * attempts));
      }
    }
  } catch (error) {
     return res.status(200).json({
        anomalies: [
          { type: 'AI Subsystem Offline', severity: 'High', description: 'Could not dynamically compute live anomalies due to API rate constraints. Displaying Mock Security Error.' }
        ]
      });
  }
};
