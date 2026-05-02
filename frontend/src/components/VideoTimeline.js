import React from 'react';
import { motion } from 'framer-motion';
import { Film, Clock, Tag, XCircle } from 'lucide-react';

function VideoTimeline({ filename, timeline }) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 md:p-10 rounded-3xl shadow-lg border border-white/20 dark:border-slate-800/50">
      
      {/* Header Section */}
      <div className="text-center mb-10">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3 mb-2">
          <Film className="w-7 h-7 text-indigo-500" />
          Video AI Timeline
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Result for: <span className="font-semibold text-slate-700 dark:text-slate-300">{filename}</span>
        </p>
      </div>

      {/* Vertical Timeline Container */}
      <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900/50 ml-4 md:ml-8 flex flex-col gap-8 pb-4">
        
        {timeline.map((frame, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15, duration: 0.4 }}
            className="relative pl-6 md:pl-10"
          >
            {/* Timeline Glowing Dot */}
            <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white dark:border-slate-900 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />

            {/* Frame Content Card */}
            <div className="flex flex-col md:flex-row gap-6 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors shadow-sm hover:shadow-md">
              
              {/* 1. Timestamp & Frame Image */}
              <div className="flex-shrink-0 w-full md:w-56 text-center">
                <div className="inline-flex items-center gap-1.5 bg-slate-800 dark:bg-slate-950 text-white px-4 py-1.5 rounded-full text-xs font-bold mb-4 shadow-inner">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> {frame.timestamp}
                </div>
                <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 aspect-video flex items-center justify-center">
                  <img 
                    src={`http://127.0.0.1:8000/uploads/${frame.image}`} 
                    alt={`Frame at ${frame.timestamp}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* 2. Detected Objects Array */}
              <div className="flex-grow flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Detected Objects
                </h4>
                
                {frame.objects.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {frame.objects.map((obj, i) => (
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        key={i} 
                        className="flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-sm font-bold border border-indigo-200 dark:border-indigo-800/50 shadow-sm"
                      >
                        <Tag className="w-3.5 h-3.5" /> 
                        {obj.tag} 
                        <span className="opacity-70 text-xs ml-1">({Math.round(obj.confidence * 100)}%)</span>
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/30 w-fit">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">No significant objects detected</span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        ))}
        
      </div>
    </div>
  );
}

export default VideoTimeline;