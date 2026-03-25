import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { submitFeedback } from '../services/api.js';
import { Star, ChevronDown, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['General', 'Education', 'E-commerce', 'Service'];

export default function Feedback() {
  const [feedbackText, setFeedbackText] = useState('');
  const [category, setCategory] = useState('General');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim() || rating === 0) return;

    if (feedbackText.trim().length < 10) {
      toast.error("Feedback is too short. Please provide at least 10 characters.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Establishing neural link...'); // Fun AI micro-interaction loading text
    
    try {
      const data = await submitFeedback({ feedbackText, rating, category });
      toast.success('Analysis Complete!', { id: toastId });
      navigate('/results', { state: { resultData: data } });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to process feedback. The AI needs a break.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 relative">
      
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full border-t-2 border-primaryAcc border-r-2 border-r-transparent flex items-center justify-center relative shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            >
              <BrainCircuit className="w-8 h-8 text-secondaryAcc absolute" />
            </motion.div>
            <p className="mt-8 text-primaryAcc font-mono font-bold tracking-widest uppercase text-sm animate-pulse">
              Generating Cognitive Insights
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card w-full max-w-2xl p-6 sm:p-10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primaryAcc/10 rounded-full blur-[80px] -z-10" />
        
        <h2 className="text-3xl font-display font-bold mb-2">We value your thoughts</h2>
        <p className="text-gray-400 mb-8">Select a category, provide a rating, and let us know how we did.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Category Dropdown */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-semibold text-gray-300">Feedback Category</label>
              <div className="relative">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-primaryAcc transition-colors cursor-pointer"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-slate-900">{cat}</option>)}
                </select>
                <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>

            {/* Star Rating Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-300">Overall Rating</label>
              <div className="flex gap-2 items-center h-[50px]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={loading}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating) ? 'fill-warning text-warning' : 'text-gray-600'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text Input */}
          <textarea 
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            disabled={loading}
            placeholder="What did you think of our service today? (Min 10 characters)"
            className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primaryAcc resize-none transition-colors disabled:opacity-50"
            required
          />

          <button 
            type="submit"
            disabled={loading || !feedbackText.trim() || rating === 0}
            className="self-end px-8 py-3 bg-primaryAcc hover:bg-primaryAcc/90 text-white font-semibold rounded-full transition-all disabled:opacity-50 min-w-[160px] shadow-lg shadow-primaryAcc/20"
          >
            Submit & Analyze
          </button>
        </form>
      </div>
    </div>
  );
}
