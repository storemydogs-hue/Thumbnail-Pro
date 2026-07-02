import React from 'react';
import { Youtube, Shield, FileText, Mail, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="h-14 border-t border-slate-800 bg-slate-900 px-8 flex items-center justify-between text-[11px] font-medium text-slate-500">
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
          Systems Ready
        </div>
        <div className="flex items-center gap-2">Uptime: 99.98%</div>
        <div className="flex items-center gap-2 hidden sm:flex">Environment: Production</div>
      </div>
      <div className="flex gap-6">
        <a href="#" className="hover:text-white transition-colors">Documentation</a>
        <a href="#" className="hover:text-white transition-colors">API Reference</a>
        <a href="#" className="text-red-500 hover:text-red-400 font-bold transition-colors">v4.2.0-stable</a>
      </div>
    </footer>
  );
}
