import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowLeft, Activity, Tag, FileText, Star } from 'lucide-react';

export default function Results() {
  const location = useLocation();
  const resultData = location.state?.resultData;

  // Protect route if accessed without submitting feedback
  if (!resultData) {
    return <Navigate to="/feedback" replace />;
  }

  const { rating, feedbackText, sentiment, sentimentScore, category, emotion, userFeelingExplanation, keywords, summary } = resultData;
  const safeKeywords = Array.isArray(keywords) ? keywords : (typeof keywords === 'string' ? JSON.parse(keywords) : []);

  const sentimentColor = 
    sentiment === 'Positive' ? 'text-success' : 
    sentiment === 'Negative' ? 'text-danger' : 'text-warning';

    const getEmotionEmoji = (emo) => {
    const e = emo.toLowerCase();
    if (e.includes('joy') || e.includes('satisf') || e.includes('happ')) return '😊';
    if (e.includes('frust') || e.includes('ang') || e.includes('mad')) return '😤';
    if (e.includes('sad') || e.includes('disap')) return '😔';
    if (e.includes('curio') || e.includes('confus')) return '🤔';
    if (e.includes('excit')) return '🤩';
    if (e.includes('scared') || e.includes('fear')) return '😨';
    return '🤖';
  };

  const getScoreInterpretation = (score) => {
    if(score >= 80) return "Highly Positive Experience";
    if(score >= 60) return "Moderately Positive";
    if(score >= 40) return "Neutral Experience";
    if(score >= 20) return "Negative Experience";
    return "Highly Negative Experience";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 sm:p-12 relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondaryAcc/10 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card max-w-4xl w-full p-8 rounded-3xl"
      >
        <Link to="/feedback" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Feedback
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-primaryAcc/20 text-primaryAcc rounded-2xl">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">AI Analysis Complete</h1>
            <p className="text-gray-400 text-sm">Here is what the Gemini LLM extracted from your input.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Left Column: Metadata */}
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Core Sentiment
              </h3>
              <p className={`text-3xl font-bold ${sentimentColor}`}>
                {sentiment} <span className="text-lg text-gray-500 font-normal">({sentimentScore}/100)</span>
              </p>
              <div className="mt-4 inline-block bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                 Interpretation: <span className="text-primaryAcc">{getScoreInterpretation(sentimentScore)}</span>
              </div>
            </div>

             <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-warning" /> Rating Given
              </h3>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-6 h-6 ${s <= rating ? 'fill-warning text-warning' : 'text-gray-600'}`} />
                ))}
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Extracted Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {safeKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-primaryAcc/20 text-primaryAcc border border-primaryAcc/30 rounded-full text-sm">
                    #{kw}
                  </span>
                ))}
                {safeKeywords.length === 0 && <span className="text-gray-500 text-sm">No keywords extracted</span>}
              </div>
            </div>
          </div>

          {/* Right Column: Deep Insights */}
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-primaryAcc/10 to-secondaryAcc/10 p-6 rounded-2xl border border-white/10 h-full flex flex-col">
              
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-primaryAcc tracking-wider mb-2">DETECTED EMOTION</h3>
                <p className="text-4xl font-display font-bold text-white capitalize flex items-center gap-3">
                  {getEmotionEmoji(emotion)} {emotion}
                </p>
                {category && <span className="inline-block mt-2 text-xs text-gray-500 border border-gray-700 rounded px-2 py-1">Category: {category}</span>}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> AI Explanation of Feelings
                </h3>
                <p className="text-gray-200 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner italic">
                  "{userFeelingExplanation}"
                </p>
              </div>

              <div>
                 <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Original Text</h3>
                 <p className="text-gray-500 text-sm italic border-l-2 border-gray-600 pl-4 py-1">
                   {feedbackText}
                 </p>
              </div>

            </div>
          </div>

        </div>
        
      </motion.div>
    </div>
  );
}
