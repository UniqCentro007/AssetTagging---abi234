import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Image as ImageIcon, Video, Music, ArchiveX, Edit2, Check, X, ScanFace } from 'lucide-react';

// ==========================================
// NEW FEATURE: Smart Auto-Cropping Thumbnail
// ==========================================
const CroppedThumbnail = ({ imageUrl, box, altText }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Box illana athu Audio/Video va irukkum, so thavirthudalam
    let coords = typeof box === 'string' ? JSON.parse(box) : box;
    if (!coords || coords.length !== 4 || coords[2] === 0) {
      setError(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.src = imageUrl;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const [x1, y1, x2, y2] = coords;
      
      // Mugam theliva theriya oru 30px padding add panrom
      const padding = 30;
      const sX = Math.max(0, x1 - padding);
      const sY = Math.max(0, y1 - padding);
      const sW = Math.min(img.width - sX, (x2 - x1) + (padding * 2));
      const sH = Math.min(img.height - sY, (y2 - y1) + (padding * 2));

      canvas.width = sW;
      canvas.height = sH;
      
      // Image-la irunthu antha specific aaloda face/body-a mattum crop panni draw panrom
      ctx.drawImage(img, sX, sY, sW, sH, 0, 0, sW, sH);
    };
    img.onerror = () => setError(true);
  }, [imageUrl, box]);

  if (error) {
    return <img src={imageUrl} alt={altText} className="w-full h-full object-cover" />;
  }

  return (
    <>
     <ScanFace className="absolute top-2 left-2 w-4 h-4 text-white/90 z-10 drop-shadow-md" />
      <canvas ref={canvasRef} className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-500" />
    </>
  );
};


// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================
function HistoryDashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTagValue, setEditTagValue] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/history");
      setHistory(response.data.history);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching history:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this detection record?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/history/${id}`);
      setHistory(history.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    
    // Tag perusa iruntha (confidence oda iruntha), pera mattum edukkum
    let cleanName = item.tag.split(" (")[0].replace("🎥 ", "").replace("🎵 ", "");
    setEditTagValue(cleanName);
  };

  const handleUpdateTag = async (id) => {
    if (!editTagValue.trim()) {
      alert("Name cannot be empty!");
      return;
    }

    try {
      await axios.put(`http://127.0.0.1:8000/history/${id}`, { new_tag: editTagValue });
      setHistory(history.map(item => item.id === id ? { ...item, tag: editTagValue } : item));
      setEditingId(null); 
    } catch (error) {
      console.error("Error updating tag:", error);
      alert("Backend error: Could not save the name.");
    }
  };

  const tanglishDict = {
    "vandi": "car", "paattu": "music", "song": "music", 
    "pesurathu": "speech", "pechu": "speech", "aalu": "person",
    "payan": "person", "naai": "dog", "poona": "cat",
    "maram": "tree", "kurivi": "bird"
  };

  const filteredHistory = history.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true; 

    const tag = item.tag.toLowerCase();
    const filename = item.filename.toLowerCase();

    if (tag.includes(query) || filename.includes(query)) return true;

    for (let tanglishWord in tanglishDict) {
      if (query.includes(tanglishWord)) {
        if (tag.includes(tanglishDict[tanglishWord])) return true;
      }
    }
    return false;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 md:p-10 rounded-3xl shadow-lg border border-white/20 dark:border-slate-800/50">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
          <ArchiveX className="w-6 h-6 text-indigo-500" />
          AI Faces & Object Database
        </h2>
      </div>
      
      <div className="flex justify-center mb-10">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by names (e.g., Abish, Car) or tags..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-400"
          />
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <ArchiveX className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No saved objects found. Upload media to detect!</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-rose-500 dark:text-rose-400 font-semibold">
          <p className="text-lg">No results found for "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredHistory.map((item) => {
              const isAudio = item.filename.match(/\.(mp3|wav|ogg)$/i);
              const isVideo = item.filename.match(/\.(mp4|webm|mov)$/i);
              const fileUrl = `http://127.0.0.1:8000/uploads/${item.filename}`;

              // Is this an Image detection with a valid bounding box?
              const coords = typeof item.box === 'string' ? JSON.parse(item.box) : item.box;
              const hasBoundingBox = !isAudio && !isVideo && coords && coords.length === 4 && coords[2] > 0;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ duration: 0.2 }}
                  key={item.id} 
                  className="group relative bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-2 right-2 z-20 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* SMART MEDIA RENDERER WITH AUTO-CROP */}
                  <div className="h-40 w-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-slate-700/50 relative">
                    {isAudio ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <Music className="w-10 h-10 text-emerald-500" />
                        <audio controls className="w-11/12 h-8 max-w-[200px]"><source src={fileUrl} /></audio>
                      </div>
                    ) : isVideo ? (
                      <><Video className="absolute top-2 left-2 w-4 h-4 text-white/70 z-10 drop-shadow-md" /><video src={fileUrl} className="w-full h-full object-cover" controls /></>
                    ) : hasBoundingBox ? (
                      // 🌟 INGA THAAN ANTHA MAGIC NADAKKUTHU 🌟
                      <CroppedThumbnail imageUrl={fileUrl} box={coords} altText={item.filename} />
                    ) : (
                      <><ImageIcon className="absolute top-2 left-2 w-4 h-4 text-white/70 z-10 drop-shadow-md" /><img src={fileUrl} alt={item.filename} className="w-full h-full object-cover" /></>
                    )}
                  </div>

                  {/* Tags & Edit Feature */}
                  <div className="p-4 flex flex-col items-center flex-grow w-full">
                    
                    {editingId === item.id ? (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 w-full justify-center mt-2">
                        <input
                          type="text"
                          value={editTagValue}
                          onChange={(e) => setEditTagValue(e.target.value)}
                          placeholder="Enter Name..."
                          className="w-28 px-3 py-1.5 text-sm font-semibold bg-white dark:bg-slate-950 border-2 border-indigo-500 rounded-lg focus:outline-none text-slate-800 dark:text-slate-100 shadow-inner"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateTag(item.id)}
                        />
                        <button onClick={() => handleUpdateTag(item.id)} className="p-1.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-full transition-colors shadow-sm" title="Save">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-400 rounded-full transition-colors shadow-sm" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <span className={`mt-2 group/tag relative px-4 py-1.5 rounded-full text-sm font-bold shadow-inner flex items-center gap-2 transition-all cursor-pointer ${isAudio ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                        {item.tag} 
                        
                        <button 
                          onClick={() => startEditing(item)}
                          className="ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity p-1.5 bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-full text-blue-600 dark:text-blue-400 shadow-sm"
                          title="Set Custom Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )}
                    
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 truncate w-full text-center" title={item.filename}>
                      From: {item.filename}
                    </p>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default HistoryDashboard;