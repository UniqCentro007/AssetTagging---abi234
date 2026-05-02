import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, UploadCloud, Moon, Sun, Loader2, Image as ImageIcon, Video, Music, Sparkles, Send, Bot, X, MessageSquareText } from 'lucide-react';

import ResultCard from './components/ResultCard';
import HistoryDashboard from './components/HistoryDashboard'; 
import VideoTimeline from './components/VideoTimeline'; 
import AudioResult from './components/AudioResult';

function App() {
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("detect");
  const [darkMode, setDarkMode] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  // ==========================================
  // FLOATING RAG CHATBOT STATES
  // ==========================================
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      role: 'ai', 
      text: "Hello! 👋 I am Nexus AI. I have analyzed your media. What would you like to know?" 
    }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isTyping, isChatOpen]);

  // --- UPLOAD LOGIC ---
  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select a file to upload.");
      return;
    }

    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');

    if (!isVideo && !isImage && !isAudio) {
      alert("⚠️ Error: Please upload only Images, Videos, or Audio files.");
      return;
    }

    if (!isAudio && !tags) {
      alert("Please enter tags (e.g., car, person) for Image/Video detection.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setProcessingStep("Uploading File...");
    setResults(null); 

    const formData = new FormData();
    files.forEach(f => formData.append("file", f));
    if (tags) formData.append("tags", tags);
    else if (isAudio) formData.append("tags", "audio");

    try {
      let endpoint = "http://127.0.0.1:8000/tag-search";
      if (isVideo) endpoint = "http://127.0.0.1:8000/video-tag-search";
      if (isAudio) endpoint = "http://127.0.0.1:8000/audio-tag-search";
      
      const response = await axios.post(endpoint, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          if (percentCompleted === 100) setProcessingStep("AI is analyzing the media... Please wait ⏳");
        }
      });
      
      if (response.data.error) {
        alert("⚠️ Backend AI Error: " + response.data.error);
        setLoading(false);
        return;
      }

      if (response.data.status === "processing") {
        alert("✅ Upload Success! AI is working in the background. You can check History later.");
        setTags(""); setFiles([]); document.querySelector('input[type="file"]').value = ''; 
        setLoading(false);
        return;
      }

      setResults(response.data);
      setTags(""); setFiles([]); document.querySelector('input[type="file"]').value = ''; 

    } catch (error) {
      console.error("Upload error", error);
      alert("Backend error! Make sure FastAPI is running.");
    }
    setLoading(false);
  };

  // --- RAG CHAT LOGIC (WITH REAL API CONNECTION) ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput("");
    setIsTyping(true);

    try {
      // 🚀 REAL BACKEND API CALL 
      const response = await axios.post("http://127.0.0.1:8000/ask-ai", { query: userText });
      
      if (response.data.error) {
        setChatMessages(prev => [...prev, { role: 'ai', text: "❌ Backend Error: " + response.data.error }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: response.data.response }]);
      }
      setIsTyping(false);

    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "❌ Error connecting to AI. Make sure FastAPI and Llama 3 are running." }]);
      setIsTyping(false);
    }
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen transition-colors duration-500 relative`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500 selection:text-white pb-24">
        
        {/* Header */}
        <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Search className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Nexus AI Engine
            </h1>
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
        </header>

        {/* --- Navigation Tabs --- */}
        <div className="max-w-md mx-auto mb-10 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl flex backdrop-blur-sm">
          <button onClick={() => setActiveTab("detect")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "detect" ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <UploadCloud className="w-4 h-4" /> Detection
          </button>
          <button onClick={() => setActiveTab("history")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "history" ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <History className="w-4 h-4" /> History
          </button>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <AnimatePresence mode="wait">
          {activeTab === "detect" && (
            <motion.div key="detect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/20 dark:border-slate-800/50">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Analyze Any Media</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-3">
                    <ImageIcon className="w-4 h-4"/> Image <Video className="w-4 h-4"/> Video <Music className="w-4 h-4"/> Audio
                  </p>
                </div>
                
                <div className="flex flex-col gap-5 max-w-md mx-auto">
                  <input type="text" value={tags} placeholder="Enter tags (e.g. car, person) *Skip for Audio*" onChange={(e) => setTags(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400 cursor-pointer" />

                  {!loading ? (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUpload} className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transition-all">
                      <UploadCloud className="w-5 h-5" /> Start Detection
                    </motion.button>
                  ) : (
                    <div className="mt-4 p-5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold flex items-center gap-2">{uploadProgress === 100 ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <UploadCloud className="w-4 h-4 text-blue-500" />}{processingStep}</span>
                        <span className="text-sm font-bold text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-300 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${uploadProgress}%` }} transition={{ ease: "easeOut", duration: 0.5 }} className={`h-full rounded-full ${uploadProgress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {results && !loading && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-10">
                  {results.audio_tags ? <AudioResult filename={results.filename} audioTags={results.audio_tags} /> : results.timeline ? <VideoTimeline filename={results.filename} timeline={results.timeline} /> : <ResultCard filename={results.filename} detections={results.detections} />}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
              <HistoryDashboard />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================== */}
        {/* SMALL FLOATING CHATBOT WIDGET              */}
        {/* ========================================== */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.2 }}
                // INGE THAAN SIZE MAATHI IRUKKEN: w-[280px] sm:w-[320px] h-[500px]
                className="mb-4 w-[280px] sm:w-[320px] h-[500px] max-h-[75vh] origin-bottom-right bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
              >
                {/* Widget Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <div>
                      <h3 className="font-bold text-sm">Nexus AI</h3>
                      <p className="text-[10px] opacity-80">Powered by Llama 3.3</p>
                    </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Widget Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4 scroll-smooth">
                  {chatMessages.map((msg, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'ai' && <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0"><Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /></div>}
                      
                      <div className={`max-w-[85%] p-2.5 rounded-2xl text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700/50'}`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center"><Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /></div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-2xl rounded-bl-none flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Widget Input */}
                <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-2 relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask me anything..."
                      className="w-full pl-3 pr-9 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim()}
                      className={`absolute right-1.5 p-1.5 rounded-lg transition-all ${chatInput.trim() ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-slate-400 cursor-not-allowed'}`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isChatOpen ? 'bg-slate-700 dark:bg-slate-800 text-white hover:bg-slate-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30'}`}
          >
            {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquareText className="w-6 h-6" />}
          </motion.button>
        </div>

      </div>
    </div>
  );
}

export default App;