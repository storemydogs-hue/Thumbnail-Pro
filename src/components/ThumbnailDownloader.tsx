import React, { useState } from 'react';
import { Download, Link as LinkIcon, Search, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { extractVideoId, getThumbnailUrl, cn } from '../lib/utils';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { saveAs } from 'file-saver';

export default function ThumbnailDownloader() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeDownload, setActiveDownload] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(url);
    setVideoId(id);
    setSuccess(false);
  };

  const handleDownload = async (quality: string) => {
    if (!videoId) return;
    setLoading(true);
    setActiveDownload(quality);
    
    const thumbUrl = getThumbnailUrl(videoId, quality as any);
    
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(thumbUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      saveAs(blob, `${videoId}_${quality}.jpg`);

      // Log the download if user is logged in
      if (user) {
        try {
          await addDoc(collection(db, 'downloads'), {
            userId: user.uid,
            videoId,
            videoTitle: 'YouTube Video',
            thumbnailUrl: thumbUrl,
            resolution: quality,
            timestamp: serverTimestamp(),
            isBulk: false,
          });
          setSuccess(true);
        } catch (err) {
          console.error('Error logging download:', err);
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      window.alert('Failed to download image. Opening in new tab instead.');
      window.open(thumbUrl, '_blank');
    } finally {
      setLoading(false);
      setActiveDownload(null);
    }
  };

  const qualities = [
    { id: 'maxresdefault', label: 'Ultra HD (1080p+)', size: '1280x720' },
    { id: 'sddefault', label: 'Standard HD', size: '640x480' },
    { id: 'hqdefault', label: 'High Quality', size: '480x360' },
    { id: 'mqdefault', label: 'Medium Quality', size: '320x180' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.h1 
          className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Extractor <span className="text-red-600">Core</span>
        </motion.h1>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto">
          High-Precision Thumbnail Retrieval System
        </p>
      </div>

      <div className="bg-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Initialization</h2>
          <span className="text-[9px] font-mono text-slate-600">STATUS: READY_FOR_INPUT</span>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600">
              <LinkIcon size={18} />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="PASTE VIDEO URL..."
              className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-lg focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 outline-none transition-all text-emerald-400 font-mono text-sm tracking-tight"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 text-white px-8 py-4 rounded-lg font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 active:scale-95"
          >
            <Search size={16} />
            <span>Process</span>
          </button>
        </form>

        {!videoId && (
          <div className="mt-12 flex flex-col items-center justify-center py-20 text-slate-700 border border-dashed border-slate-800 rounded-xl">
            <ImageIcon size={48} strokeWidth={1} />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em]">Awaiting Data Input</p>
          </div>
        )}

        {videoId && (
          <motion.div 
            className="mt-12 space-y-8"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 relative group overflow-hidden rounded-xl bg-slate-950 border border-slate-800 p-2 shadow-inner">
                <img
                  src={getThumbnailUrl(videoId)}
                  alt="Thumbnail Preview"
                  className="w-full aspect-video object-cover rounded-lg"
                />
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Download className="text-red-600" size={14} />
                    Export Options
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {qualities.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleDownload(q.id)}
                      disabled={loading}
                      className="group flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                      <div>
                        <div className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors text-sm">{q.label}</div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{q.size}px • JPG</div>
                      </div>
                      <div className="text-slate-600 group-hover:text-emerald-400 transition-all">
                        {activeDownload === q.id ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                            <Search size={18} className="opacity-50" />
                          </motion.div>
                        ) : (
                          <Download size={18} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {success && (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    <CheckCircle2 size={14} />
                    Entry Logged
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
