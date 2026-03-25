import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, BarChart3, Info, LogOut, LogIn, UploadCloud, Globe } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-50 glass-effect border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primaryAcc" />
            <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primaryAcc to-secondaryAcc">
              SentientFeedback
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link 
              to="/feedback" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/feedback') ? 'text-primaryAcc' : 'text-gray-300 hover:text-white'}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Give Feedback</span>
            </Link>

            <Link 
              to="/about" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/about') ? 'text-primaryAcc' : 'text-gray-300 hover:text-white'}`}
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </Link>

            <Link 
              to="/upload" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/upload') ? 'text-primaryAcc' : 'text-gray-300 hover:text-white'}`}
            >
              <UploadCloud className="h-4 w-4" />
              <span className="hidden md:inline">Bulk Upload</span>
            </Link>

            <Link 
              to="/amazon" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${(isActive('/amazon') || isActive('/zomato') || isActive('/flipkart')) ? 'text-primaryAcc' : 'text-gray-300 hover:text-white'}`}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Simulators</span>
            </Link>

            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard') ? 'text-primaryAcc border-primaryAcc/50' : ''}`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-danger hover:bg-danger/10 px-3 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all text-gray-300 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Admin Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
