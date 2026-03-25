import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ShoppingCart, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Amazon() {
  const [reviews, setReviews] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);

  const handleTextChange = (index, value) => {
    const newReviews = [...reviews];
    newReviews[index] = value;
    setReviews(newReviews);
  };

  const addReviewField = () => setReviews([...reviews, '']);

  const submitToAmazon = async () => {
    const validReviews = reviews.filter(r => r.trim().length > 5).map(text => ({ text, rating: Math.floor(Math.random() * 5) + 1 }));
    
    if(validReviews.length === 0) return toast.error("Please enter at least one valid review.");
    
    setLoading(true);
    toast.loading("Syncing to Feedback Intelligence API...", { id: 'ama' });

    try {
      await api.post('/integrations/Amazon', {
        apiKey: 'demo-secret-key', // Hardcoded for Simulation
        reviews: validReviews
      });
      toast.success("Amazon reviews successfully synced!", { id: 'ama' });
      setReviews(['', '', '']);
    } catch (error) {
      toast.error("Failed to sync simulated Amazon data.", { id: 'ama' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 flex flex-col items-center bg-[#232F3E]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full">
        
        {/* Fake Amazon Header */}
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/10 mt-10">
          <div className="p-3 bg-[#FF9900] rounded-xl text-[#232F3E]">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-widest">amazon<span className="text-[#FF9900]">.dummy</span></h1>
            <p className="text-gray-400 text-sm">Simulated External Platform Review Gateway</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl text-black">
          <h2 className="text-2xl font-bold mb-2">Leave Multiple Product Reviews</h2>
          <p className="text-gray-600 mb-6 font-medium">Test exactly how our system handles batched E-commerce payloads sent via external APIs.</p>

          <div className="space-y-4 mb-6">
            {reviews.map((rev, i) => (
              <textarea
                key={i}
                value={rev}
                onChange={(e) => handleTextChange(i, e.target.value)}
                placeholder={`Amazon Product Review #${i+1}... (e.g., "The delivery was delayed but the product is great.")`}
                className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-[#FF9900] outline-none resize-none h-24"
                disabled={loading}
              />
            ))}
          </div>

          <button onClick={addReviewField} disabled={loading} className="text-[#007185] font-bold hover:underline mb-8 block text-sm">
            + Add Another Review
          </button>

          <button 
            onClick={submitToAmazon} 
            disabled={loading}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm border border-[#FCD200]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? "Transmitting via API..." : "Submit Batch to Intelligence Analytics"}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
