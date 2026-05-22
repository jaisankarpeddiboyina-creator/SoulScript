import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Zap, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

interface GatingModalProps {
  onSignInOpen: () => void;
}

export const GatingModal: React.FC<GatingModalProps> = ({ onSignInOpen }) => {
  const { gatingType, setGatingType } = useAuth();
  const { setActiveTab } = useApp();
  
  if (!gatingType) return null;

  const getContent = () => {
    switch (gatingType) {
      case 'guest_limit':
        return {
          title: "Limit Reached",
          message: "You've used your 3 free downloads today. Sign in to get 5 downloads daily and access more features.",
          icon: <Lock className="text-white" />,
          primaryAction: () => { onSignInOpen(); setGatingType(null); },
          primaryLabel: "Sign In",
          secondaryLabel: "Create Account",
          secondaryAction: () => { onSignInOpen(); setGatingType(null); }
        };
      case 'free_limit':
        return {
          title: "Daily Limit Reached",
          message: "You've reached today's limit of 5 downloads. Upgrade to a paid plan for more high-quality downloads and features.",
          icon: <Zap className="text-white" />,
          primaryAction: () => { setActiveTab('pricing'); setGatingType(null); },
          primaryLabel: "Upgrade Now",
          secondaryLabel: "Maybe Later",
          secondaryAction: () => setGatingType(null)
        };
      case 'basic_limit':
        return {
          title: "Daily Limit Reached",
          message: "You've reached today's limit of 100 downloads for the BASIC plan. Upgrade to PRO for unlimited downloads and more.",
          icon: <Zap className="text-white" />,
          primaryAction: () => { setActiveTab('pricing'); setGatingType(null); },
          primaryLabel: "Upgrade to PRO",
          secondaryLabel: "Maybe Later",
          secondaryAction: () => setGatingType(null)
        };
      case 'premium_feature':
        return {
          title: "Premium Feature",
          message: "Custom fonts and high-res exports are a paid feature. Upgrade your plan to unlock the full SoulScript experience.",
          icon: <Sparkles className="text-white" />,
          primaryAction: () => { setActiveTab('pricing'); setGatingType(null); },
          primaryLabel: "Upgrade Now",
          secondaryLabel: "Maybe Later",
          secondaryAction: () => setGatingType(null)
        };
      case 'auth_required':
        return {
          title: "Sign In Required",
          message: "Please sign in to create playlists, save quotes, and set up delivery alerts.",
          icon: <LogIn className="text-white" />,
          primaryAction: () => { onSignInOpen(); setGatingType(null); },
          primaryLabel: "Sign In",
          secondaryLabel: "Cancel",
          secondaryAction: () => setGatingType(null)
        };
      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setGatingType(null)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full md:max-w-sm glass border border-[var(--border-color)] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl gradient-bg shadow-xl shadow-indigo-500/20 mb-6 group-hover:scale-110 transition-transform">
              {content.icon}
            </div>
            
            <h2 className="text-2xl font-bold font-serif text-[var(--text-primary)] mb-3">
              {content.title}
            </h2>
            
            <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
              {content.message}
            </p>
            
            <div className="w-full space-y-3">
              <button
                onClick={content.primaryAction}
                className="w-full gradient-bg text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20"
              >
                <span>{content.primaryLabel}</span>
                <ArrowRight size={18} />
              </button>
              
              <button
                onClick={content.secondaryAction}
                className="w-full px-4 py-3 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {content.secondaryLabel}
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setGatingType(null)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
          >
            <X size={18} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
