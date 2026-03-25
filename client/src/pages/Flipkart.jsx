import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ShoppingBag, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Flipkart() {
  const [reviews, setReviews] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const handleTextChange = (index, value) => {
    const newReviews = [...reviews];
    newReviews[index] = value;
    setReviews(newReviews);
  };

  const addReviewField = () => setReviews([...reviews, '']);

  const submitToFlipkart = async () => {
    const validReviews = reviews.filter(r => r.trim().length > 5).map(text => ({ text, rating: Math.floor(Math.random() * 5) + 1 }));
    
    if(validReviews.length === 0) return toast.error("Please enter at least one valid review.");
    
    setLoading(true);
    toast.loading("Sending Flipkart Commerce Analytics...", { id: 'flp' });

    try {
      await api.post('/integrations/Flipkart', {
        apiKey: 'demo-secret-key', // Hardcoded for Simulation
        reviews: validReviews
      });
      toast.success("Flipkart reviews successfully embedded!", { id: 'flp' });
      setReviews(['', '']);
    } catch (error) {
      toast.error("Failed to sync simulated Flipkart data.", { id: 'flp' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 flex flex-col items-center bg-[#f1f3f6]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full">
        
        {/* Fake Flipkart Header */}
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-300 mt-10">
          <div className="p-3 bg-[#2874f0] rounded-xl text-white">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#2874f0] tracking-tight ita">Flipkart<span className="text-[#ffe11b] italic font-serif"> Simulator</span></h1>
            <p className="text-gray-500 text-sm">Automated Regional E-Commerce Intelligence</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-xl text-black">
          <h2 className="text-2xl font-bold mb-2">Leave Multiple Product Reviews</h2>
          <p className="text-gray-500 mb-6 font-medium">Verify edge-cases by firing external Flipkart feedback payloads towards the central Intelligence Dashboard.</p>

          <div className="space-y-4 mb-6">
            {reviews.map((rev, i) => (
              <textarea
                key={i}
                value={rev}
                onChange={(e) => handleTextChange(i, e.target.value)}
                placeholder={`Product Review #${i+1}... (e.g., "The packaging was torn but the phone works perfectly.")`}
                className="w-full p-4 rounded bg-[#f1f3f6] border border-gray-300 focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none resize-none h-24"
                disabled={loading}
              />
            ))}
          </div>

          <button onClick={addReviewField} disabled={loading} className="text-[#2874f0] font-bold hover:underline mb-8 block text-sm">
            + Add Another Item Review
          </button>

          <button 
            onClick={submitToFlipkart} 
            disabled={loading}
            className="w-full bg-[#fb641b] hover:bg-[#e05615] text-white font-bold py-4 rounded transition-all flex items-center justify-center gap-2 shadow-md shadow-[#fb641b]/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? "Transmitting via API..." : "Disperse Flipkart Array"}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
