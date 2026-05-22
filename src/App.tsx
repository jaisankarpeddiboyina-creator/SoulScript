/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNavigation } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { Explore } from './pages/Explore';
import { Collections } from './pages/Collections';
import { Generate } from './pages/Generate';
import { Playlists } from './pages/Playlists';
import { Delivery } from './pages/Delivery';
import { Profile } from './pages/Profile';
import { Pricing } from './pages/Pricing';
import { PlaylistModal } from './components/PlaylistModal';
import { AuthModal } from './components/AuthModal';
import { GatingModal } from './components/GatingModal';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';

function AppContent() {
  const { activeTab } = useApp();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileActive, setIsProfileActive] = useState(false);

  return (
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300 bg-[var(--bg-primary)]">
      {/* Background blobs for mood */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full -z-10" />
      
      {!isProfileActive && (
        <Header 
          onSignInClick={() => setIsAuthModalOpen(true)} 
          onProfileClick={() => setIsProfileActive(true)}
        />
      )}
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-24 md:pb-12 pt-4 md:pt-6">
        <AnimatePresence mode="wait">
          {isProfileActive ? (
            <Profile key="profile" onBack={() => setIsProfileActive(false)} />
          ) : (
            <>
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
              {activeTab === 'collections' && (
                <motion.div
                  key="collections"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Collections />
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
              {activeTab === 'delivery' && (
                <motion.div
                  key="delivery"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Delivery />
                </motion.div>
              )}
              {activeTab === 'pricing' && (
                <motion.div
                  key="pricing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Pricing onSignInOpen={() => setIsAuthModalOpen(true)} />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Global Modals & Notifications */}
      <PlaylistModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <GatingModal onSignInOpen={() => setIsAuthModalOpen(true)} />
      <ToastContainer />
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
