import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, ChevronRight } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondaryAcc/20 rounded-full blur-[100px] -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-secondaryAcc/20 text-secondaryAcc rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-display font-bold">Create Admin</h2>
          <p className="text-gray-400 text-sm mt-2">Register a new master account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-secondaryAcc transition-colors"
                placeholder="newadmin@company.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 ml-1">Master Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-secondaryAcc transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-secondaryAcc hover:bg-secondaryAcc/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center group shadow-lg shadow-secondaryAcc/20"
          >
            {loading ? 'Registering...' : 'Create Account'}
            {!loading && <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-secondaryAcc font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
