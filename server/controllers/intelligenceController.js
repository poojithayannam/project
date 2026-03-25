import { getDb } from '../db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const getAnomalyReport = async (req, res, next) => {
  try {
    const db = getDb();

    // Pull last 100 global records across all isolated platforms
    const rawData = await db.all('SELECT * FROM feedbacks ORDER BY createdAt DESC LIMIT 100');

    if (rawData.length < 5) {
      return res.status(200).json({ anomalies: [] });
    }

    // Mathematical Z-Score Computation (Standard Deviation)
    const scores = rawData.map(r => r.sentimentScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(scores.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / scores.length) || 1;
    
    // Isolate true statistical anomalies (Z-Score > 1.5 or < -1.5)
    const absoluteAnomalies = rawData.filter(r => Math.abs((r.sentimentScore - mean) / stdDev) > 1.5);

    if (absoluteAnomalies.length === 0) {
      return res.status(200).json({ anomalies: [] }); // No mathematical anomalies detected
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
          { type: 'AI Subsystem Offline', severity: 'High', description: 'Could not dynamically compute live anomalies or API parsing failed.' }
        ]
      });
  }
};
