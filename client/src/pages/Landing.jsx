import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, Target, MessageSquare, Database, BarChart3 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      {/* Background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primaryAcc/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondaryAcc/20 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-3xl mx-auto"
      >
        <h1 className="text-5xl lg:text-7xl font-display font-bold mb-6 leading-tight">
          Understand your users <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primaryAcc to-secondaryAcc">Instantly with AI</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Collect feedback and let our advanced AI analyze sentiments, extract key emotions, and summarize what truly matters to your customers.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/feedback" className="px-8 py-4 bg-primaryAcc hover:bg-primaryAcc/90 text-white font-semibold rounded-full shadow-lg shadow-primaryAcc/25 transition-all w-full sm:w-auto flex items-center justify-center gap-2">
            Try Demo <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/dashboard" className="px-8 py-4 glass-card hover:bg-white/10 text-white font-semibold rounded-full transition-all w-full sm:w-auto flex items-center justify-center gap-2">
            View Analytics
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mt-20 w-full max-w-5xl"
      >
        <h2 className="text-2xl font-display font-medium text-center mb-8 text-gray-300 tracking-wide uppercase">System Architecture Flow</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full relative z-10">
           
           {/* Step 1 */}
           <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center w-full border border-primaryAcc/30 shadow-lg shadow-primaryAcc/10 scale-100 hover:scale-105 transition-transform">
             <div className="w-12 h-12 bg-primaryAcc/20 rounded-full flex items-center justify-center mb-3">
               <MessageSquare className="w-6 h-6 text-primaryAcc" />
             </div>
             <h3 className="font-bold text-white">1. User Input</h3>
             <p className="text-xs text-gray-400 mt-2 leading-relaxed">Multi-category Form<br/>& Rating Submission</p>
           </div>
           
           <ArrowRight className="w-8 h-8 text-gray-500 hidden md:block shrink-0" />
           
           {/* Step 2 */}
           <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center w-full border border-secondaryAcc/30 shadow-lg shadow-secondaryAcc/10 scale-100 hover:scale-105 transition-transform">
             <div className="w-12 h-12 bg-secondaryAcc/20 rounded-full flex items-center justify-center mb-3">
               <Brain className="w-6 h-6 text-secondaryAcc" />
             </div>
             <h3 className="font-bold text-white">2. AI Processing</h3>
             <p className="text-xs text-gray-400 mt-2 leading-relaxed">Gemini Flash LLM<br/>Cognitive Engine</p>
           </div>
           
           <ArrowRight className="w-8 h-8 text-gray-500 hidden md:block shrink-0" />
           
           {/* Step 3 */}
           <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center w-full border border-warning/30 shadow-lg shadow-warning/10 scale-100 hover:scale-105 transition-transform">
             <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center mb-3">
               <Database className="w-6 h-6 text-warning" />
             </div>
             <h3 className="font-bold text-white">3. Action Insights</h3>
             <p className="text-xs text-gray-400 mt-2 leading-relaxed">Emotion Mapping<br/>& Keywords</p>
           </div>
           
           <ArrowRight className="w-8 h-8 text-gray-500 hidden md:block shrink-0" />
           
           {/* Step 4 */}
           <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center w-full border border-success/30 shadow-lg shadow-success/10 scale-100 hover:scale-105 transition-transform">
             <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mb-3">
               <BarChart3 className="w-6 h-6 text-success" />
             </div>
             <h3 className="font-bold text-white">4. Dashboard</h3>
             <p className="text-xs text-gray-400 mt-2 leading-relaxed">Live Executive<br/>Analytics</p>
           </div>

        </div>
      </motion.div>
    </div>
  );
}
