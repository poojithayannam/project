import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Utensils, Send, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Zomato() {
  const [reviews, setReviews] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const handleTextChange = (index, value) => {
    const newReviews = [...reviews];
    newReviews[index] = value;
    setReviews(newReviews);
  };

  const addReviewField = () => setReviews([...reviews, '']);

  const submitToZomato = async () => {
    const validReviews = reviews.filter(r => r.trim().length > 5).map(text => ({ text, rating: Math.floor(Math.random() * 5) + 1 }));
    
    if(validReviews.length === 0) return toast.error("Please enter at least one valid review.");
    
    setLoading(true);
    toast.loading("Transferring Restaurant Analytics...", { id: 'zom' });

    try {
      await api.post('/integrations/Zomato', {
        apiKey: 'demo-secret-key', // Hardcoded for Simulation
        reviews: validReviews
      });
      toast.success("Zomato Delivery reviews permanently synced!", { id: 'zom' });
      setReviews(['', '']);
    } catch (error) {
      toast.error("Failed to sync simulated Zomato data.", { id: 'zom' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 flex flex-col items-center bg-zinc-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full">
        
        {/* Fake Zomato Header */}
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-red-500/20 mt-10">
          <div className="p-3 bg-[#E23744] rounded-xl text-white">
            <Utensils className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-widest italic">zomato<span className="text-[#E23744]">.mock</span></h1>
            <p className="text-gray-400 text-sm">Automated Restaurant & Delivery Intelligence</p>
          </div>
        </div>

        <div className="bg-[#1C1C1C] border border-[#E23744]/30 p-8 rounded-3xl shadow-2xl text-white">
          <h2 className="text-2xl font-bold mb-2">Leave Multiple Service Reviews</h2>
          <p className="text-gray-400 mb-6 font-medium">Verify edge-cases by firing external Restaurant feedback payloads towards the central Intelligence Dashboard.</p>

          <div className="space-y-4 mb-6">
            {reviews.map((rev, i) => (
              <textarea
                key={i}
                value={rev}
                onChange={(e) => handleTextChange(i, e.target.value)}
                placeholder={`Delivery Review #${i+1}... (e.g., "The food was completely cold and tasted terrible.")`}
                className="w-full p-4 rounded-xl border border-white/10 bg-black/50 focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744] outline-none resize-none h-24"
                disabled={loading}
              />
            ))}
          </div>

          <button onClick={addReviewField} disabled={loading} className="text-[#E23744] font-bold hover:underline mb-8 block text-sm">
            + Add Another Order Review
          </button>

          <button 
            onClick={submitToZomato} 
            disabled={loading}
            className="w-full bg-[#E23744] hover:bg-[#CB202D] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#E23744]/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? "Transmitting via API..." : "Push Zomato Array"}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
