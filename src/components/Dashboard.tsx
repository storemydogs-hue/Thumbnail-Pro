import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, limit, deleteDoc, doc } from 'firebase/firestore';
import { DownloadLog, AnalyticsSummary } from '../types';
import { 
  BarChart3, History, Search, Filter, Download as DownloadIcon, 
  Trash2, ExternalLink, Calendar, Video, TrendingUp, Users, Clock,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { saveAs } from 'file-saver';

export default function Dashboard() {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'single' | 'bulk'>('all');
  const [stats, setStats] = useState({
    total: 0,
    bulkTotal: 0,
    recentCount: 0
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'downloads'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DownloadLog[];
      setDownloads(data);
      
      // Calculate stats
      const total = data.length;
      const bulkTotal = data.filter(d => d.isBulk).length;
      const recentCount = data.filter(d => {
        const date = d.timestamp?.toDate() || new Date();
        return (new Date().getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
      }).length;

      setStats({ total, bulkTotal, recentCount });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredDownloads = downloads.filter(d => {
    const matchesSearch = d.videoId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.videoTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'single' && !d.isBulk) || 
                         (activeFilter === 'bulk' && d.isBulk);
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Erase this record from logs?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'downloads', id));
    } catch (err) {
      console.error('Error deleting document:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (item: DownloadLog) => {
    setDownloadingId(item.id);
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(item.thumbnailUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      saveAs(blob, `${item.videoId}_${item.resolution}.jpg`);
    } catch (err) {
      console.error('Download error:', err);
      window.alert('Failed to download image. Opening in new tab instead.');
      window.open(item.thumbnailUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Video ID,Resolution,Bulk,Timestamp\n"
      + filteredDownloads.map(d => `${d.videoId},${d.resolution},${d.isBulk},${d.timestamp?.toDate()?.toISOString() || ''}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `thumbnail_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="bg-slate-100 p-8 rounded-full text-slate-300">
          <Users size={64} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Sign in to access your dashboard</h2>
          <p className="text-slate-500 max-w-md mx-auto mt-2">
            Keep track of your downloads, view advanced analytics, and export custom reports for your workflow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            <BarChart3 size={14} />
            Diagnostic Reports
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Activity Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
          >
            <DownloadIcon size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Extractions', value: stats.total, icon: Video, trend: '+12%', color: 'bg-red-950/20 text-red-500 border-red-900/20' },
          { label: 'Bulk Batch', value: stats.bulkTotal, icon: TrendingUp, trend: 'Stable', color: 'bg-emerald-950/20 text-emerald-500 border-emerald-900/20' },
          { label: '24H Activity', value: stats.recentCount, icon: Clock, trend: 'Active', color: 'bg-slate-900 text-slate-300 border-slate-800' },
          { label: 'System Load', value: '0.02%', icon: History, trend: 'Optimal', color: 'bg-slate-900 text-slate-300 border-slate-800' },
        ].map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-xl border flex flex-col gap-1", stat.color)}>
            <div className="flex justify-between items-start">
              <stat.icon size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{stat.trend}</span>
            </div>
            <div className="mt-4">
              <div className="text-[9px] font-bold uppercase tracking-widest opacity-50">{stat.label}</div>
              <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="FILTER LOGS..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border-slate-800 border rounded-lg focus:border-red-600/50 outline-none transition-all text-xs font-mono text-emerald-400"
              />
            </div>
            
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['all', 'single', 'bulk'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                    activeFilter === f ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {filteredDownloads.length} Records Found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                <th className="px-6 py-4">Preview</th>
                <th className="px-6 py-4">Source Metadata</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Resolution</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <AnimatePresence initial={false}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="w-20 h-12 bg-slate-800 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-3 w-32 bg-slate-800 rounded mb-2"></div><div className="h-2 w-48 bg-slate-800/50 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-5 w-12 bg-slate-800 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-3 w-10 bg-slate-800 rounded"></div></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : filteredDownloads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-600 text-xs font-bold uppercase tracking-widest italic">
                      Diagnostic: No Data Available
                    </td>
                  </tr>
                ) : (
                  filteredDownloads.map((d) => (
                    <motion.tr 
                      key={d.id} 
                      className="hover:bg-slate-800/50 transition-colors group"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td className="px-6 py-4">
                        <div className="relative w-24 aspect-video rounded border border-slate-800 overflow-hidden">
                          <img 
                            src={d.thumbnailUrl} 
                            alt="Thumb" 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-200 text-xs truncate max-w-[200px] uppercase tracking-tight">{d.videoTitle}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1 uppercase">
                          <Calendar size={10} />
                          {d.timestamp?.toDate() ? format(d.timestamp.toDate(), 'yy.MM.dd • HH:mm') : 'PENDING'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                          d.isBulk ? "bg-purple-900/30 text-purple-400 border border-purple-800/50" : "bg-blue-900/30 text-blue-400 border border-blue-800/50"
                        )}>
                          {d.isBulk ? 'Bulk' : 'Single'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-mono text-slate-400 font-bold">
                        {d.resolution.replace('default', '').replace('maxres', 'MAX')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleDownload(d)}
                            disabled={downloadingId === d.id}
                            className="p-2 text-slate-600 hover:text-emerald-400 hover:bg-slate-800 rounded transition-all disabled:opacity-50"
                            title="Download Image"
                          >
                            {downloadingId === d.id ? <Loader2 size={14} className="animate-spin" /> : <DownloadIcon size={14} />}
                          </button>
                          <button 
                            onClick={() => window.open(`https://youtube.com/watch?v=${d.videoId}`, '_blank')}
                            className="p-2 text-slate-600 hover:text-blue-400 hover:bg-slate-800 rounded transition-all"
                            title="View Video"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(d.id)}
                            disabled={deletingId === d.id}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-slate-800 rounded transition-all disabled:opacity-50"
                            title="Delete Log"
                          >
                            {deletingId === d.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
