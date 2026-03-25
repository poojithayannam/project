import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

export default mongoose.models.Config || mongoose.model('Config', configSchema);
