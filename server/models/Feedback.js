import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  feedbackText: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, enum: ['Education', 'E-commerce', 'Service', 'General'], default: 'General' },
  platform: { type: String, enum: ['Direct', 'Amazon', 'Zomato', 'Flipkart'], default: 'Direct' },
  detectedLanguage: { type: String, default: 'English' },
  sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
  sentimentScore: { type: Number, default: 50 },
  emotion: { type: String, default: 'Unknown' },
  userFeelingExplanation: { type: String },
  severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Low' },
  impactScore: { type: Number, default: 0 },
  keywords: [{ type: String }],
  summary: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Feedback', feedbackSchema);
