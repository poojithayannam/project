import { GoogleGenerativeAI } from '@google/generative-ai';
import Config from '../models/Config.js';
import mongoose from 'mongoose';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock_key');

export const getSystemPrompt = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const customPrompt = await Config.findOne({ key: 'SYSTEM_PROMPT_V1' });
      if (customPrompt) return customPrompt.value;
    } catch (e) { console.error("Config fetch error:", e.message); }
  }
  
  return `
    Analyze the following user feedback. 
    1. Auto-detect the input language (e.g., 'Spanish', 'Hindi', 'English').
    2. If the text is NOT English, translate the text fundamentally into English before extracting intelligence.
    3. Evaluate the business risk to determine Issue Severity and Impact Score.
    4. Provide strictly valid JSON output without any markdown formatting. Do not include \`\`\`json.
    
    Required JSON format:
    {
      "detectedLanguage": "<Language Name>",
      "sentiment": "Positive" | "Neutral" | "Negative",
      "sentimentScore": <number between 1 and 100>,
      "emotion": "<single word describing the main emotion>",
      "userFeelingExplanation": "<One detailed sentence explaining exactly what the user is feeling, why they feel that way.>",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "impactScore": <number between 1 and 100 representing risk to business retention>,
      "keywords": ["<keyword1>", "<keyword2>"],
      "summary": "<very concise 1-sentence summary of the text>"
    }
  `;
};

export const analyzeFeedbackWithGemini = async (feedbackText, category = 'General') => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const basePrompt = await getSystemPrompt();
      
      const prompt = `
        ${basePrompt}
        
        Category Context: "${category}"
        User Feedback: "${feedbackText}"
      `;

      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);

    } catch (error) {
      attempts++;
      console.warn(`[GEMINI RETRY] Attempt ${attempts} Failed: ${error.message}`);
      
      if (attempts < maxAttempts) {
         await new Promise(resolve => setTimeout(resolve, attempts * 1500));
         continue;
      }
      
      console.error('MAX GEMINI RETRIES EXCEEDED. Falling back to Mock Engine.');
      
      let mockSentiment = 'Neutral'; let mockScore = 50; let mockEmotion = 'Curious';
      let mockExplanation = "Providing generic feedback.";
      let mockSeverity = 'Low'; let mockImpact = 10;
      let keywords = ['generic', 'simulation'];
      
      const lowerText = feedbackText.toLowerCase();
      const positiveWords = ['great', 'good', 'love', 'excellent', 'amazing', 'perfect', 'satisfied', 'best'];
      const negativeWords = ['bad', 'poor', 'needs improvement', 'heat', 'heats up', 'not suitable', 'slow', 'crash', 'lag', 'terrible', 'worst', 'issue', 'broken', 'fail'];

      const isPositive = positiveWords.some(w => lowerText.includes(w));
      const isNegative = negativeWords.some(w => lowerText.includes(w));

      if (isNegative) {
          mockSentiment = 'Negative'; mockScore = 20; mockEmotion = 'Frustrated'; mockSeverity = 'High'; mockImpact = 85;
          mockExplanation = "The user is frustrated due to performance, usability, or hardware issues.";
          keywords = ['performance-issue', 'hardware-issue', 'simulation'];
      } else if (isPositive) {
          mockSentiment = 'Positive'; mockScore = 85; mockEmotion = 'Satisfied'; mockSeverity = 'Low'; mockImpact = 5;
          mockExplanation = "Highly satisfied with current offerings and overall experience.";
          keywords = ['positive-experience', 'satisfied', 'simulation'];
      }

      return {
        detectedLanguage: 'English (Simulated)',
        sentiment: mockSentiment,
        sentimentScore: mockScore,
        emotion: mockEmotion,
        userFeelingExplanation: mockExplanation,
        severity: mockSeverity,
        impactScore: mockImpact,
        keywords: keywords,
        summary: 'Simulated AI response due to API Key restrictions.'
      };
    }
  }
};

export const getBusinessRecommendations = async (feedbackData) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert Business Consultant and Data Analyst.
      Analyze the following collection of recent user feedback and identify macro-level trends.
      
      Feedback Data: ${JSON.stringify(feedbackData)}
      
      Generate strictly valid JSON output without markdown formatting containing 3 highly actionable business recommendations.
      Format:
      {
        "recommendations": [
          { "title": "...", "description": "...", "impact": "High | Medium | Low" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.warn("⚠️ API Key failed. Falling back to Simulated AI Recommendations.");
    return {
      recommendations: [
        { title: "Improve User Interface", description: "Multiple users highlighted that while backend functionality is strong, the UI needs an overhaul to engage users.", impact: "High" },
        { title: "Enhance Performance Speed", description: "Several simulated feedbacks indicated a desire for faster load times across the dashboard.", impact: "Medium" },
        { title: "Expand Category Options", description: "Users are submitting diverse feedback; expanding dropdown categories will improve AI routing accuracy.", impact: "Low" }
      ]
    };
  }
};
