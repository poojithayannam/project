import React, { useState } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function UploadDataset() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState(0);

  const handleFileUpload = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== 'text/csv' && !selected.name.endsWith('.csv')) {
        return toast.error("Please upload a valid CSV file");
      }
      setFile(selected);
      toast.success("File queued for parsing");
    }
  };

  const processDataset = () => {
    if (!file) return toast.error("No file selected.");
    setLoading(true);
    toast.loading("Parsing CSV Data...", { id: 'bulk' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        setParsedRows(rows.length);
        
        const mappedReviews = [];
        const uniqueTexts = new Set();
        let skippedRows = 0;
        let duplicateRows = 0;

        rows.forEach(r => {
          const text = r.review || r.text || r.feedback || r.Comment || Object.values(r)[0];
          if (typeof text === 'string' && text.trim().length >= 5) {
            const cleanText = text.trim();
            if (uniqueTexts.has(cleanText.toLowerCase())) {
               duplicateRows++;
            } else {
               uniqueTexts.add(cleanText.toLowerCase());
               mappedReviews.push({ text: cleanText, rating: r.rating ? parseInt(r.rating) : 3 });
            }
          } else {
            skippedRows++;
          }
        });

        if (mappedReviews.length === 0) {
          setLoading(false);
          return toast.error(`Critical Failure: No valid text columns discovered. Completely skipped ${skippedRows} invalid array rows.`, { id: 'bulk' });
        }

        if (skippedRows > 0 || duplicateRows > 0) {
           toast.error(`DATA INTEGRITY WARNING: Safely discarded ${skippedRows} corrupted rows and removed ${duplicateRows} identical duplicates.`, { duration: 6000 });
        }

        toast.loading(`Processing ${mappedReviews.length} validated dataset nodes through Gemini AI in encrypted batches...`, { id: 'bulk' });

        try {
          const res = await api.post('/feedback/bulk', {
            platform: 'Direct',
            category: 'General',
            reviews: mappedReviews
          });
          
          toast.success(res.data.message || `Processed ${res.data.inserted} reviews!`, { id: 'bulk' });
          setFile(null);
        } catch (error) {
          console.error(error);
          toast.error(error.response?.data?.error || "Bulk Processing Failed", { id: 'bulk' });
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        toast.error("Failed to read CSV file.", { id: 'bulk' });
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 sm:p-12 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primaryAcc/10 rounded-full blur-[100px] -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-2xl w-full p-8 rounded-3xl text-center"
      >
        <div className="w-16 h-16 bg-primaryAcc/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <UploadCloud className="w-8 h-8 text-primaryAcc" />
        </div>
        
        <h1 className="text-3xl font-display font-bold mb-2">Bulk Dataset Upload</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Upload large quantities of historical feedback as a CSV. The AI will batched-process the rows and automatically map them to the Dashboard.</p>

        <div className={`border-2 border-dashed rounded-2xl p-12 transition-colors relative ${file ? 'border-success/50 bg-success/5' : 'border-white/20 hover:border-primaryAcc/50 bg-black/20'}`}>
           <input 
             type="file" 
             accept=".csv"
             onChange={handleFileUpload}
             disabled={loading}
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
           />
           {file ? (
             <div className="flex flex-col items-center text-success">
               <CheckCircle2 className="w-12 h-12 mb-4" />
               <p className="font-bold text-lg">{file.name}</p>
               <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(2)} KB Ready</p>
             </div>
           ) : (
             <div className="flex flex-col items-center text-gray-400">
               <UploadCloud className="w-12 h-12 mb-4 text-gray-500" />
               <p className="font-bold text-lg text-white mb-1">Drag & Drop CSV Here</p>
               <p className="text-sm">or click to browse local files</p>
             </div>
           )}
        </div>

        {file && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8">
            <button 
              onClick={processDataset}
              disabled={loading}
              className="w-full bg-primaryAcc hover:bg-primaryAcc/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Batch Processing to Gemini API...</>
              ) : (
                <><PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Execute AI Bulk Extraction</>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" /> Ensure your CSV has a column named "review" or "text".
            </p>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
