import React from 'react';
import { useAuth } from './AuthProvider';
import { loginWithGoogle, logout } from '../lib/firebase';
import { Youtube, LayoutDashboard, Layers, LogIn, LogOut, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  currentView: 'home' | 'bulk' | 'dashboard';
  onViewChange: (view: 'home' | 'bulk' | 'dashboard') => void;
}

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const { user } = useAuth();

  const navItems = [
    { id: 'home', label: 'Single', icon: Download },
    { id: 'bulk', label: 'Bulk', icon: Layers },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ] as const;

  return (
    <nav className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onViewChange('home')}
        >
          <div className="bg-red-600 w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
            YT
          </div>
          <span className="font-bold text-xl tracking-tight text-white uppercase hidden sm:inline">Studio<span className="text-red-500">Pro</span></span>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  currentView === id 
                    ? "bg-slate-700 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-800 mx-2" />

          {user ? (
            <div className="flex items-center gap-3 bg-slate-800/30 pl-1 pr-3 py-1 rounded-full border border-slate-700/50">
              <img 
                src={user.photoURL || ''} 
                alt="Profile" 
                className="w-7 h-7 rounded-full border border-white/10"
              />
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[11px] font-bold text-white leading-none">{user.displayName}</span>
              </div>
              <button 
                onClick={logout}
                className="ml-2 p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
            >
              <LogIn size={16} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
