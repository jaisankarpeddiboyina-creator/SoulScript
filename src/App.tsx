/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { Explore } from './pages/Explore';
import { Generate } from './pages/Generate';
import { Playlists } from './pages/Playlists';
import { PlaylistModal } from './components/PlaylistModal';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300">
      {/* Background blobs for mood */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full -z-10" />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pb-32 md:pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Explore />
            </motion.div>
          )}
          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Generate />
            </motion.div>
          )}
          {activeTab === 'playlists' && (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Playlists />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Modals & Notifications */}
      <PlaylistModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
