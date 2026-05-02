import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, SlidersHorizontal, CheckCircle2, XCircle } from 'lucide-react';

function ResultCard({ filename, detections = [] }) {
  const imageUrl = `http://127.0.0.1:8000/uploads/${filename}`;
  const imgRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  
  // Default-a 25% confidence set panrom
  const [minConfidence, setMinConfidence] = useState(25);

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight, width, height } = imgRef.current;
      setScale({ x: width / naturalWidth, y: height / naturalHeight });
    }
  };

  // Filter Logic
  const filteredDetections = detections.filter(
    (det) => Math.round(det.confidence * 100) >= minConfidence
  );

  const downloadCSV = () => {
    if (!filteredDetections || filteredDetections.length === 0) return;
    let csvContent = "Tag,Confidence (%),X1,Y1,X2,Y2\n";
    
    filteredDetections.forEach(det => {
      const conf = Math.round(det.confidence * 100);
      const [x1, y1, x2, y2] = det.box;
      csvContent += `${det.tag},${conf},${x1},${y1},${x2},${y2}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}_filtered_metadata.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-lg border border-white/20 dark:border-slate-800/50">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Result for: 
            <span className="font-normal text-slate-500 dark:text-slate-400 text-lg truncate max-w-xs">{filename}</span>
          </h3>
        </div>

        {filteredDetections.length > 0 && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadCSV} 
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-colors"
          >
            <Download className="w-4 h-4" /> Download CSV
          </motion.button>
        )}
      </div>

      {/* Confidence Slider Box (Premium UI) */}
      <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 transition-colors">
        <div className="flex justify-between items-center mb-3">
          <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-500" />
            Confidence Filter
          </label>
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-bold shadow-inner">
            {minConfidence}%
          </span>
        </div>
        
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
          className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <p className="mt-3 text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Move the slider to instantly hide objects with a score below {minConfidence}%.
        </p>
      </div>
      
      {/* Dynamic Badge */}
      <div className="mb-8 flex justify-center">
        <AnimatePresence mode="wait">
          {filteredDetections.length > 0 ? (
            <motion.span 
              key="found"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-bold border border-emerald-200 dark:border-emerald-800/50"
            >
              <CheckCircle2 className="w-4 h-4" /> Showing {filteredDetections.length} matching object(s)
            </motion.span>
          ) : (
            <motion.span 
              key="not-found"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-full text-sm font-bold border border-rose-200 dark:border-rose-800/50"
            >
              <XCircle className="w-4 h-4" /> No objects meet the {minConfidence}% confidence level
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Image & Bounding Boxes */}
      <div className="flex justify-center relative w-full overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-900">
        <div className="relative inline-block">
          <img 
            ref={imgRef}
            src={imageUrl} 
            alt={filename} 
            onLoad={handleImageLoad}
            className="max-w-full max-h-[600px] block"
          />

          {/* Render Filtered Detections with Animation */}
          <AnimatePresence>
            {filteredDetections.map((det, index) => {
              const scaledLeft = det.box[0] * scale.x;
              const scaledTop = det.box[1] * scale.y;
              const scaledWidth = (det.box[2] - det.box[0]) * scale.x;
              const scaledHeight = (det.box[3] - det.box[1]) * scale.y;

              return (
                <motion.div
                  key={`${det.tag}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute', 
                    left: `${scaledLeft}px`, 
                    top: `${scaledTop}px`,
                    width: `${scaledWidth}px`, 
                    height: `${scaledHeight}px`,
                    pointerEvents: 'none'
                  }}
                  className="border-[2.5px] border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)] rounded-sm z-10"
                >
                  <motion.span 
                    initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="absolute -top-7 -left-[2.5px] bg-pink-500 text-white text-xs font-bold px-2 py-1 whitespace-nowrap rounded-t-md rounded-br-md shadow-md"
                  >
                    {det.tag} ({Math.round(det.confidence * 100)}%)
                  </motion.span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ResultCard;