import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
  platformName: {
    type: String,
    required: true,
    unique: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['Education', 'E-commerce', 'Service', 'General'],
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Integration', integrationSchema);
