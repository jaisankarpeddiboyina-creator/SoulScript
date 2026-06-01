import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Coffee, Sparkles, Gift, ThumbsUp, Loader2, Award, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

interface PricingProps {
  onSignInOpen: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSignInOpen }) => {
  const { user, isGuest } = useAuth();
  const { addToast, theme } = useApp();

  const [supportAmount, setSupportAmount] = useState<number>(30);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [supporterName, setSupporterName] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState<string>('');
  
  // Modal states
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; amount: number } | null>(null);
  const [deactivatedModalOpen, setDeactivatedModalOpen] = useState<boolean>(false);

  const presets = [20, 30, 49, 99];

  const handlePresetSelect = (amount: number) => {
    setSupportAmount(amount);
    setIsCustomMode(false);
  };

  const handleCustomModeEnable = () => {
    setIsCustomMode(true);
    setCustomAmountInput(supportAmount.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setSupportAmount(num);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalAmount = isCustomMode ? parseInt(customAmountInput, 10) : supportAmount;

    if (isNaN(finalAmount) || finalAmount < 20) {
      addToast('Minimum support amount is ₹20. Thank you for your support!', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate connection to secure sandbox checkout flow for feedback
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setDeactivatedModalOpen(true);
      addToast('Information: Support portal is currently inactive', 'info');
      
      // Reset support form
      setCustomAmountInput('');
      setIsCustomMode(false);
      setSupporterName('');
      setSupportMessage('');
    } catch (e: any) {
      console.error(e);
      addToast('Simulation encountered an issue. Please try again!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerConfettiCelebration = () => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 120 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 60 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  return (
    <div className={`py-8 md:py-16 max-w-4xl mx-auto px-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
      {/* Absolute Announcement Header */}
      <div className="text-center space-y-5 mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-500/20">
          <Sparkles size={12} className="animate-spin" />
          <span>Community First • 100% Free Application</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent leading-tight md:leading-normal">
          SoulScript is Completely Free
        </h1>
        
        <p className={`max-w-2xl mx-auto text-sm md:text-base leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Yes, you heard that right! We removed all restrictions, paywalls, and monthly subscriptions. 
          Enjoy <strong>unlimited HD exports</strong>, custom fonts, offline playlists, and daily downloads completely free.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4">
        {/* Left Side: What we are offering for free now! */}
        <div className="space-y-6">
          <div className={`p-6 md:p-8 rounded-3xl border ${theme === 'light' ? 'border-zinc-200/80 bg-zinc-50/50' : 'border-white/5 bg-white/[0.01]'} space-y-6`}>
            <h2 className="text-lg font-serif font-black flex items-center gap-2">
              <Award className="text-indigo-400" size={20} />
              <span>Features Unlocked For Everyone</span>
            </h2>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Unlimited HD Downloads & Saves</h3>
                  <p className={`text-[11px] leading-relaxed mt-0.5 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Export high-definition customized canvas cards containing your beloved thoughts with zero restrictions.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Premium Editorial Typography</h3>
                  <p className={`text-[11px] leading-relaxed mt-0.5 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    All gorgeous serif fonts (Playfair Display, Lora, Cormorant, Crimson) are unlocked by default.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mt-0.5 shrink-0">
                  <Check size={12} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Complete Aesthetic Collection</h3>
                  <p className={`text-[11px] leading-relaxed mt-0.5 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Access the complete catalogs of categories, tags, author filters, and modern canvas custom backgrounds.
                  </p>
                </div>
              </li>
            </ul>

            <div className={`h-[1px] ${theme === 'light' ? 'bg-zinc-200' : 'bg-white/5'} !my-6`} />

            <div className="rounded-2xl p-4 bg-indigo-500/5 border border-indigo-500/10 flex gap-3 text-xs leading-relaxed text-indigo-400">
              <Sparkles size={20} className="shrink-0" />
              <span>
                <strong>Why make it free?</strong> SoulScript is a non-profit utility designed to enrich daily mental routines. We migrated from forced billing to a purely donation-based community supporting model.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Buy me a coffee card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`relative rounded-3xl border p-6 md:p-8 flex flex-col shadow-2xl ${
            theme === 'light' 
              ? 'border-indigo-100 bg-white shadow-indigo-100/40' 
              : 'border-white/10 bg-[#0c0d11]/90 shadow-[0_20px_50px_rgba(0,0,0,0.4)]'
          }`}
        >
          {/* Support Hearts decoration */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/20">
            <Heart size={10} className="fill-rose-400 animate-pulse" />
            <span>Support Server</span>
          </div>

          <form onSubmit={handleDonate} className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-black flex items-center gap-2">
                  <Coffee className="text-amber-500 fill-amber-500/10" size={22} />
                  <span>Buy Me a Coffee</span>
                </h3>
                <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Your micro-donations directly fuel server hosting, database costs, and operational limits. Support as you see fit!
                </p>
              </div>

              {/* Interactive Donation selector */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  Select Contribution amount
                </label>
                
                <div className="grid grid-cols-4 gap-2">
                  {presets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handlePresetSelect(amount)}
                      className={`py-3 rounded-xl border text-sm font-black transition-all ${
                        !isCustomMode && supportAmount === amount
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 font-extrabold shadow-md'
                          : theme === 'light'
                            ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                            : 'border-white/10 hover:bg-white/5 text-zinc-300'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Slider */}
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleCustomModeEnable}
                      className={`text-xs font-bold transition-all ${
                        isCustomMode 
                          ? 'text-indigo-400 underline font-black' 
                          : 'text-zinc-400 hover:text-indigo-400 hover:underline'
                      }`}
                    >
                      {isCustomMode ? 'Editing Custom Amount:' : 'Or set a custom support amount'}
                    </button>
                    {!isCustomMode && (
                      <span className="text-sm font-black text-indigo-400">
                        ₹{supportAmount}
                      </span>
                    )}
                  </div>

                  {isCustomMode ? (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₹</span>
                      <input
                        type="text"
                        value={customAmountInput}
                        onChange={handleCustomAmountChange}
                        placeholder="Enter amount (min ₹20)"
                        className={`w-full pl-8 pr-4 py-3 text-sm rounded-xl border font-bold focus:outline-none focus:border-indigo-500/80 ${
                          theme === 'light'
                            ? 'bg-zinc-50/50 border-zinc-200 text-zinc-800'
                            : 'bg-white/5 border-white/15 text-white'
                        }`}
                      />
                    </div>
                  ) : (
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="5"
                      value={supportAmount}
                      onChange={(e) => {
                        setSupportAmount(parseInt(e.target.value, 10));
                        setIsCustomMode(false);
                      }}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800"
                    />
                  )}
                </div>
              </div>

              {/* Supporter Info Input Fields */}
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={supporterName}
                  onChange={(e) => setSupporterName(e.target.value)}
                  className={`w-full px-4 py-3 text-xs rounded-xl border focus:outline-none focus:border-indigo-500 ${
                    theme === 'light'
                      ? 'bg-zinc-50/50 border-zinc-200 text-zinc-800'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
                <textarea
                  placeholder="Say something nice! (Optional)"
                  rows={2}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className={`w-full px-4 py-3 text-xs rounded-xl border focus:outline-none focus:border-indigo-500 resize-none ${
                    theme === 'light'
                      ? 'bg-zinc-50/50 border-zinc-200 text-zinc-800'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full gradient-bg hover:scale-[1.01] active:scale-[0.99] font-serif font-black text-white text-sm tracking-wider py-4 rounded-xl shadow-lg shadow-indigo-500/20 uppercase flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Processing Secure Donation...</span>
                  </>
                ) : (
                  <>
                    <Gift size={16} />
                    <span>Support ₹{isCustomMode ? (parseInt(customAmountInput, 10) || 20) : supportAmount} via Sandbox Paytm/UPI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Support success notification dialog */}
      <AnimatePresence>
        {successModal?.isOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSuccessModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md glass border border-rose-500/20 rounded-3xl p-8 text-center bg-[#070505]/95 shadow-[0_20px_50px_rgba(255,100,100,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/10 mb-2">
                  <Heart size={32} className="fill-rose-400" />
                </div>
                <h3 className="text-2xl font-serif font-black text-white">Your Kind Support Received!</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Thank you so much! Your generous contribution of <strong className="text-rose-400 font-sans text-lg">₹{successModal.amount}</strong> is received beautifully in sandbox mode. Supporters like {supporterName || 'you'} keep our database running under community care.
                </p>
                <div className="pt-4 w-full">
                  <button
                    onClick={() => setSuccessModal(null)}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg text-xs uppercase tracking-widest"
                  >
                    You are AWESOME!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Support portal paused/deactivated dialog */}
      <AnimatePresence>
        {deactivatedModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeactivatedModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md border border-amber-500/20 rounded-3xl p-8 text-center bg-[#0d0912]/95 shadow-[0_20px_50px_rgba(245,158,11,0.2)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background gradient decoration blur */}
              <div className="absolute -top-24 -left-20 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-20 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col items-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5 mb-1 animate-pulse">
                  <AlertCircle size={32} />
                </div>
                
                <h3 className="text-2xl font-serif font-black text-white">Donations Paused</h3>
                
                <p className="text-zinc-200 text-sm leading-relaxed text-center">
                  Thank you so much for your generosity! To ensure SoulScript remains forever accessible and free of overhead, we have <span className="text-amber-400 font-extrabold">deactivated direct payment channels</span>.
                </p>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left space-y-2">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    🌟 SoulScript is 100% free and fully funded for the foreseeable future. We require no direct payment.
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    💬 Your daily practice, feedback, and beautiful rating reviews are all the true support we ask!
                  </p>
                </div>

                <div className="pt-2 w-full">
                  <button
                    onClick={() => setDeactivatedModalOpen(false)}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-serif font-black rounded-xl transition-all shadow-md text-xs uppercase tracking-widest active:scale-[0.98]"
                  >
                    Acknowledged, Thank you! ☕
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
