import React from 'react';
import { motion } from 'framer-motion';
import { AudioLines, Volume2, AlertCircle, Music } from 'lucide-react';

function AudioResult({ filename, audioTags = [] }) {
  const audioUrl = `http://127.0.0.1:8000/uploads/${filename}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-lg border border-white/20 dark:border-slate-800/50 text-center max-w-3xl mx-auto"
    >
      {/* Header Section */}
      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3 mb-3">
        <AudioLines className="w-8 h-8 text-emerald-500 animate-pulse" />
        Audio AI Analysis
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Result for: <span className="font-semibold text-slate-700 dark:text-slate-300">{filename}</span>
      </p>

      {/* Premium Audio Player Wrapper */}
      <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-800/60 p-5 rounded-2xl shadow-inner mb-10 border border-slate-200 dark:border-slate-700/50 relative overflow-hidden group">
        {/* Decorative Background Elements */}
        <div className="absolute -right-6 -top-6 text-emerald-500/10 dark:text-emerald-500/5 group-hover:scale-110 transition-transform duration-500">
          <Music className="w-24 h-24" />
        </div>
        
        <audio 
          controls 
          className="w-full relative z-10 outline-none rounded-lg"
          style={{ height: '45px' }}
        >
          <source src={audioUrl} type="audio/mpeg" />
          <source src={audioUrl} type="audio/wav" />
          <source src={audioUrl} type="audio/ogg" />
          Your browser does not support the audio element.
        </audio>
      </div>

      {/* Detected Audio Tags Section */}
      <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/30">
        <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-5">
          Detected Sound Profiles
        </h4>
        
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {audioTags.length > 0 ? (
            audioTags.map((tag, index) => (
              <motion.span 
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-shadow"
              >
                <Volume2 className="w-4 h-4" /> 
                {tag.tag} 
                <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs ml-1">
                  {tag.confidence}%
                </span>
              </motion.span>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 px-5 py-3 rounded-xl border border-rose-100 dark:border-rose-900/30"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">No specific sounds detected clearly.</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AudioResult;