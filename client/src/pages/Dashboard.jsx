import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { fetchAnalytics, fetchRecommendations, fetchAnomalies } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, FileText, Download, ChevronDown, Sparkles, RefreshCw, BrainCircuit, Hash, Globe, ShieldAlert } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { io } from 'socket.io-client';

const COLORS = ['#22c55e', '#64748b', '#ef4444'];
const CATEGORIES = ['All', 'General', 'Education', 'E-commerce', 'Service'];
const PLATFORMS = ['All', 'Direct', 'Amazon', 'Zomato', 'Flipkart'];

export default function Dashboard() {
  const [data, setData] = useState({
    sentimentCounts: [],
    topEmotion: null,
    keywordFreq: [],
    keywordFreq: [],
    timeline: [],
    platformBreakdown: [],
    recentFeedbacks: []
  });
  const [recommendations, setRecommendations] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const dashboardRef = useRef(null);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const analyticsData = await fetchAnalytics({ category: categoryFilter, platform: platformFilter, timeRange: timeFilter });
      setData(analyticsData);
      
      const recData = await fetchRecommendations(categoryFilter);
      if (recData && recData.recommendations) {
        setRecommendations(recData.recommendations);
      }

      const anoData = await fetchAnomalies();
      if (anoData && anoData.anomalies) {
        setAnomalies(anoData.anomalies);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics dashboard');
      toast.error('Network error communicating with the analytic server.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Connect to WebSocket Server for true real-time syncing
    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');
    const socketUrl = import.meta.env.PROD ? undefined : 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('new_feedback_received', () => {
      console.log('⚡ Socket event received, reloading analytics');
      loadData(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [categoryFilter, platformFilter, timeFilter]);

  const exportPDF = () => {
    const input = dashboardRef.current;
    toast.loading("Generating PDF Report...", { id: 'pdf' });
    html2canvas(input, { scale: 2, backgroundColor: '#0f172a' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Analytics_Report_${categoryFilter}.pdf`);
      toast.success("PDF Downloaded Successfully", { id: 'pdf' });
    });
  };

  const exportCSV = () => {
    toast.loading("Compiling CSV Data...", { id: 'csv' });
    const csvRows = ['Date,Score'];
    data.timeline.forEach(t => {
      csvRows.push(`"${t.date}","${t.score}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `timeline_analytics_${categoryFilter}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("CSV Downloaded!", { id: 'csv' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-16 h-16 border-4 border-primaryAcc border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-danger gap-4 p-6">
        <AlertCircle className="w-16 h-16" />
        <h2 className="text-2xl font-bold font-display">Analytics Offline</h2>
        <p className="text-gray-400 max-w-lg text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full mt-4 transition-colors text-white">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 sm:p-10 relative overflow-x-hidden">
      
      {/* Background Animated Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primaryAcc/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondaryAcc/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8" ref={dashboardRef}>
        
        {/* Header Navigation & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pt-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-display font-bold">Analytics Engine</h1>
              <AnimatePresence>
                {isRefreshing && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <RefreshCw className="w-5 h-5 text-primaryAcc animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-gray-400 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live Enterprise Metrics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Group */}
            <div className="flex gap-2">
              <div className="relative">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 hover:border-primaryAcc/50 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium transition-colors focus:outline-none cursor-pointer text-white"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-slate-900">{cat} Data</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>

              <div className="relative">
                <select 
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="appearance-none bg-primaryAcc/10 border border-primaryAcc/30 hover:border-primaryAcc/50 text-primaryAcc rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold transition-colors focus:outline-none cursor-pointer"
                >
                  {PLATFORMS.map(plat => <option key={plat} value={plat} className="bg-slate-900">{plat} Source</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primaryAcc" />
              </div>

              <div className="relative">
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 hover:border-primaryAcc/50 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium transition-colors focus:outline-none cursor-pointer text-white"
                >
                  <option value="All" className="bg-slate-900">All Time</option>
                  <option value="7d" className="bg-slate-900">Last 7 Days</option>
                  <option value="30d" className="bg-slate-900">Last 30 Days</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>

            {/* Export Buttons */}
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-white">
              <FileText className="w-4 h-4 text-secondaryAcc" /> CSV
            </button>
            
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-primaryAcc/20 hover:bg-primaryAcc/30 border border-primaryAcc/30 text-primaryAcc rounded-xl text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> PDF Report
            </button>
          </div>
        </div>

        {/* AI Business Consultant Sub-system */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-primaryAcc/20 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primaryAcc to-secondaryAcc" />
           <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primaryAcc/20 rounded-xl border border-primaryAcc/30"><BrainCircuit className="w-6 h-6 text-primaryAcc" /></div>
              <div>
                <h3 className="text-xl font-bold font-display text-white mt-1">AI Strategic Recommendations</h3>
                <p className="text-xs text-primaryAcc uppercase tracking-wider font-semibold">Gemini Flash LLM Insights</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-200 text-sm leading-tight pr-2">{rec.title}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${rec.impact === 'High' ? 'bg-danger/20 text-danger border border-danger/20' : rec.impact === 'Medium' ? 'bg-warning/20 text-warning border border-warning/20' : 'bg-success/20 text-success border border-success/20'}`}>
                      {rec.impact} Priority
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{rec.description}</p>
                </motion.div>
              )) : (
                <p className="text-gray-500 italic text-sm">Awaiting sufficient sector data for cognitive analysis.</p>
              )}
           </div>
        </div>

        {/* Cybersecurity Anomaly Overlay */}
        {anomalies.length > 0 && (
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-danger/40 relative overflow-hidden bg-danger/5">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-danger/20 rounded-xl border border-danger/40"><ShieldAlert className="w-6 h-6 text-danger" /></div>
                <div>
                  <h3 className="text-xl font-bold font-display text-white mt-1">Intelligence Anomaly Detection</h3>
                  <p className="text-xs text-danger uppercase tracking-wider font-semibold">Gemini Security Engine</p>
                </div>
             </div>
             
             <div className="space-y-4">
                {anomalies.map((ano, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="bg-black/40 rounded-xl p-4 border border-danger/20 flex flex-col md:flex-row md:items-center gap-4">
                     <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md whitespace-nowrap ${ano.severity === 'High' ? 'bg-danger/20 text-danger border border-danger/50' : 'bg-warning/20 text-warning border border-warning/50'}`}>
                        {ano.type}
                     </span>
                     <p className="text-sm text-gray-300 md:ml-2 leading-relaxed">{ano.description}</p>
                  </motion.div>
                ))}
             </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-8 rounded-3xl flex flex-col justify-center items-center text-center">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Responses</h3>
            <p className="text-5xl font-display font-bold text-white">
              {data.sentimentCounts.reduce((acc, curr) => acc + curr.count, 0)}
            </p>
          </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col justify-center items-center text-center">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Historical 7-Day Trend</h3>
            <p className="text-3xl font-display font-bold text-white flex items-baseline gap-2">
              {data.currentAvg} <span className="text-xs text-gray-400">avg</span>
            </p>
            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${data.historicalDelta >= 0 ? 'bg-success/20 text-success border-success/30' : 'bg-danger/20 text-danger border-danger/30'}`}>
               {data.historicalDelta >= 0 ? '+' : ''}{data.historicalDelta}% vs Last Week
            </div>
          </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col justify-center items-center text-center md:col-span-2 relative overflow-hidden group">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 z-10">Primary Reaction Detected</h3>
            <div className="flex items-center justify-center gap-4 z-10 w-full relative">
               <span className="text-5xl font-display font-bold text-white capitalize bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                 {data.topEmotion?._id || 'Unknown'}
               </span>
               <div className="bg-primaryAcc/20 text-primaryAcc px-4 py-2 rounded-xl border border-primaryAcc/30 flex flex-col">
                  <span className="text-xs uppercase font-bold">Frequency</span>
                  <span className="text-xl font-bold">{data.topEmotion?.count || 0}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="glass-card p-6 sm:p-8 rounded-3xl lg:col-span-1 shadow-2xl flex flex-col">
            <h3 className="text-lg font-semibold mb-8 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primaryAcc" /> Sentiment Distribution
            </h3>
            <div className="flex-grow flex items-center justify-center -ml-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Pie data={data.sentimentCounts} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="count" animationBegin={0} animationDuration={1500}>
                    {data.sentimentCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-3xl lg:col-span-1 shadow-2xl flex flex-col">
            <h3 className="text-lg font-semibold mb-8 flex items-center gap-2">
              <Hash className="w-5 h-5 text-secondaryAcc" /> Trending Keywords
            </h3>
            <div className="flex-grow pr-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.keywordFreq} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis dataKey="_id" type="category" stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 13, fontWeight: 500 }} width={90} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="url(#colorKeyword)" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500} />
                  <defs>
                    <linearGradient id="colorKeyword" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-3xl lg:col-span-1 shadow-2xl flex flex-col">
            <h3 className="text-lg font-semibold mb-8 flex items-center gap-2">
              <Globe className="w-5 h-5 text-success" /> Source Traffic
            </h3>
            <div className="flex-grow pr-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.platformBreakdown} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" yAxisId="left" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis dataKey="_id" type="category" stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 13, fontWeight: 500 }} width={90} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                  <Bar dataKey="count" name="Total Feedbacks" fill="url(#colorPlatform)" radius={[0, 6, 6, 0]} barSize={16} animationDuration={1500} />
                  <Bar dataKey="avgScore" name="Avg Sentiment Score" fill="#10b981" radius={[0, 6, 6, 0]} barSize={8} animationDuration={1500} />
                  <defs>
                    <linearGradient id="colorPlatform" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Timeline Chart */}
        <div className="glass-card p-6 rounded-2xl md:col-span-2 shadow-lg w-full">
            <h3 className="text-xl font-bold mb-1">Sentiment Timeline</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">Tracking the fluctuating 1-100 core sentiment scores over the selected time period.</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...data.timeline, { date: '7-Day Forecast', score: data.forecast, forecast: true }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#ffffff50" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#ffffff20', borderRadius: '12px' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Line type="monotone" dataKey="score" name="Actual Sentiment" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={false} connectNulls={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        {/* Recent Feedbacks Table */}
        <div className="glass-card p-6 rounded-2xl md:col-span-2 shadow-lg w-full mt-6">
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primaryAcc" /> Recent User Feedbacks
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">Raw, unfiltered feedback submitted by users matching the current filters.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 border-b border-white/10 text-xs uppercase font-semibold text-gray-400">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Date</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Sentiment</th>
                    <th className="px-4 py-3 rounded-tr-xl">Feedback Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentFeedbacks && data.recentFeedbacks.length > 0 ? (
                    data.recentFeedbacks.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">{item.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className="bg-primaryAcc/20 text-primaryAcc px-2 py-1 rounded text-[10px] font-bold uppercase">{item.platform}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-warning font-bold">{item.rating} ★</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.sentiment === 'Positive' ? 'bg-success/20 text-success' : item.sentiment === 'Negative' ? 'bg-danger/20 text-danger' : 'bg-gray-500/20 text-gray-400'}`}>
                            {item.sentiment}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-md truncate" title={item.text}>{item.text}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500 italic">No recent feedbacks found for this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>

      </div>
    </div>
  );
}
