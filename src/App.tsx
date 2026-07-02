/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Navbar from './components/Navbar';
import ThumbnailDownloader from './components/ThumbnailDownloader';
import BulkDownloader from './components/BulkDownloader';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import { AnimatePresence, motion } from 'motion/react';

type View = 'home' | 'bulk' | 'dashboard';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('home');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 flex flex-col">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-grow container mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'home' && <ThumbnailDownloader />}
            {currentView === 'bulk' && <BulkDownloader />}
            {currentView === 'dashboard' && <Dashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

