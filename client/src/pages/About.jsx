import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 max-w-4xl mx-auto flex flex-col justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primaryAcc/20 rounded-full blur-[100px] -z-10" />
        
        <h1 className="text-4xl font-display font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primaryAcc to-secondaryAcc">
          About SentientFeedback
        </h1>
        
        <div className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            SentientFeedback is a modern, AI-powered platform designed to help businesses truly understand their users. 
            By leveraging Google's Gemini LLM, we go beyond simple 5-star ratings to extract the deep emotional resonance, 
            sentiment scores, and core keywords hidden within raw text feedback.
          </p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Technology Stack</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-primaryAcc">Frontend:</strong> React, Vite, Tailwind CSS, Framer Motion, Recharts</li>
            <li><strong className="text-secondaryAcc">Backend:</strong> Node.js, Express.js</li>
            <li><strong className="text-success">Database:</strong> MongoDB Atlas (Mongoose)</li>
            <li><strong className="text-warning">AI Engine:</strong> @google/generative-ai (Gemini 1.5 Flash)</li>
          </ul>

          <p className="mt-8 pt-6 border-t border-white/10 text-sm text-gray-500">
            Built as an industry-standard web application prototype highlighting real-time data visualization and AI integration.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
