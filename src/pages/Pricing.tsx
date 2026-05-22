import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

interface PricingProps {
  onSignInOpen: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSignInOpen }) => {
  const { user, plan, isGuest } = useAuth();
  const { addToast, setActiveTab, theme } = useApp();

  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastTargetPlan, setLastTargetPlan] = useState<'basic' | 'pro' | null>(null);
  
  // Modal states
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; planName: string } | null>(null);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string } | null>(null);

  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (targetPlan: 'basic' | 'pro') => {
    if (loading) return; // Prevent double clicks on subscribe buttons
    if (isGuest || !user) {
      addToast('Please sign in to subscribe.', 'info');
      onSignInOpen();
      return;
    }

    setLoading(true);
    setLastTargetPlan(targetPlan);

    try {
      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded) {
        throw new Error('Failed to load payment checkout system. Please check your internet connection.');
      }

      // Create Payment Order via Server
      const billingCycle = targetPlan === 'pro' && isYearly ? 'yearly' : 'monthly';
      const targetAmount = targetPlan === 'basic' ? 4900 : (isYearly ? 99900 : 14900);
      const targetName = targetPlan === 'basic' ? "SoulScript Basic Plan" : "SoulScript Pro Elite";
      
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, billingCycle }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.error || 'Failed to create payment order');
      }

      const orderData = await orderRes.json();

      const options = {
        key: orderData.keyId || 'rzp_test_dummy_key',
        amount: targetAmount,
        currency: 'INR',
        name: targetName,
        description: `Upgrade to ${targetPlan.toUpperCase()} ${billingCycle}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          setLoading(true);
          try {
            // Verify Payment Server-Side and save plan status to user account in database
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
                plan: targetPlan,
              }),
            });

            if (!verifyRes.ok) {
              const errVerify = await verifyRes.json();
              throw new Error(errVerify.error || 'Signature verification failed');
            }

            const verifyResult = await verifyRes.json();
            
            if (verifyResult.success) {
              // Trigger Confetti!
              triggerConfettiCelebration();
              setSuccessModal({ isOpen: true, planName: targetPlan.toUpperCase() });
              addToast(`Successfully upgraded to ${targetPlan.toUpperCase()}!`, 'success');
              
              // Soft force-reload auth token to refresh context plan state
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            } else {
              throw new Error('Verification failed');
            }
          } catch (verificationError: any) {
            setErrorModal({ isOpen: true, message: verificationError.message || 'Payment signature verification failed.' });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: '#818cf8',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      
      // Register payment fail handler to ensure modal opens
      razorpayInstance.on('payment.failed', function (resp: any) {
        console.error('Razorpay payment failed:', resp.error);
        setErrorModal({ 
          isOpen: true, 
          message: resp.error?.description || 'The transaction was declined by the Secure Gateway.' 
        });
        setLoading(false);
      });

      razorpayInstance.open();

    } catch (e: any) {
      console.error(e);
      setErrorModal({ isOpen: true, message: e.message || 'An unexpected error occurred during subscription setup.' });
      setLoading(false);
    }
  };

  const triggerConfettiCelebration = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 120 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const currentPlanNormalized = plan || 'free';

  return (
    <div className={`py-8 md:py-16 max-w-6xl mx-auto px-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
      {/* Dynamic Header */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
          Write Your Soul's Script
        </h1>
        <p className={`max-w-xl mx-auto text-sm md:text-base ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Unlock the ultimate journaling, sharing, and download experience. Empower your daily routines.
        </p>

        {/* PRO Billing Toggle */}
        <div className="pt-6 flex justify-center items-center gap-4">
          <span className={`text-sm font-bold uppercase tracking-wider ${
            !isYearly 
              ? (theme === 'light' ? 'text-indigo-600' : 'text-indigo-400') 
              : 'text-zinc-400 dark:text-zinc-500'
          }`}>Monthly</span>
          <button
            disabled={loading}
            onClick={() => !loading && setIsYearly(!isYearly)}
            className={`w-14 h-8 rounded-full p-1 relative flex items-center transition-colors focus:outline-none border disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'light' 
                ? 'bg-zinc-200 border-zinc-300' 
                : 'bg-white/10 border-white/10'
            }`}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              style={{ x: isYearly ? 24 : 0 }}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold uppercase tracking-wider ${
              isYearly 
                ? (theme === 'light' ? 'text-indigo-600' : 'text-indigo-400') 
                : 'text-zinc-400 dark:text-zinc-500'
            }`}>Yearly</span>
            <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-rose-500/20">
              Save 44%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6">
        
        {/* FREE PLAN */}
        <motion.div
          whileHover={loading ? {} : { y: -6 }}
          className={`flex flex-col relative rounded-3xl glass p-8 border ${
            currentPlanNormalized === 'free' && !isGuest
              ? (theme === 'light' ? 'border-indigo-500/60 bg-indigo-50' : 'border-indigo-500/60 bg-indigo-950/10')
              : (theme === 'light' ? 'border-zinc-200/80' : 'border-white/10')
          } overflow-hidden shadow-2xl transition-all h-full ${
            theme === 'light' ? 'bg-white/90 shadow-indigo-100/30' : 'bg-[#0a0a0c]/80'
          }`}
        >
          {currentPlanNormalized === 'free' && !isGuest && (
            <div className={`absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
              theme === 'light'
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
            }`}>
              Active Plan
            </div>
          )}
          <div className="space-y-4 flex-1">
            <p className={`uppercase text-xs font-black tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>Free Plan</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl lg:text-5xl font-serif font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>₹0</span>
              <span className={`${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'} text-sm`}>/ forever</span>
            </div>
            <p className={`${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'} text-sm leading-relaxed`}>
              Begin your beautiful routine with essential downloads.
            </p>

            <div className={`h-[1px] ${theme === 'light' ? 'bg-zinc-200' : 'bg-white/5'} my-6`} />

            <ul className="space-y-4">
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                <span><strong>5 saves</strong> per day</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                <span className={theme === 'light' ? 'text-zinc-500' : 'text-gray-400'}>Watermarked quote cards</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-500' : 'text-gray-400'}`}>
                <Check size={16} className="text-green-400/50 mt-0.5 shrink-0" />
                <span>Basic categories only</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-500' : 'text-gray-400'}`}>
                <Check size={16} className="text-green-400/50 mt-0.5 shrink-0" />
                <span>Email delivery only</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-500' : 'text-gray-400'}`}>
                <Check size={16} className="text-green-400/50 mt-0.5 shrink-0" />
                <span>No credit card required</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              disabled={loading || (user && currentPlanNormalized === 'free')}
              onClick={() => !loading && onSignInOpen()}
              className={`w-full py-4 rounded-xl font-bold transition-all text-sm uppercase tracking-wider ${
                (user && currentPlanNormalized === 'free')
                  ? theme === 'light'
                    ? 'bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'
                  : loading
                    ? theme === 'light'
                      ? 'bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed opacity-50'
                      : 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed opacity-50'
                    : theme === 'light'
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300/60'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              {isGuest ? 'Get Started' : 'Current Plan'}
            </button>
          </div>
        </motion.div>

        {/* BASIC PLAN */}
        <motion.div
          whileHover={loading ? {} : { y: -6 }}
          className={`flex flex-col relative rounded-3xl glass p-8 border ${
            currentPlanNormalized === 'basic'
              ? (theme === 'light' ? 'border-pink-500/70 bg-pink-50/50' : 'border-pink-500/70 bg-pink-950/10')
              : (theme === 'light' ? 'border-pink-300' : 'border-pink-500/40')
          } overflow-hidden shadow-2xl transition-all h-full ${
            theme === 'light' ? 'bg-white/90 shadow-[0_0_40px_rgba(219,39,119,0.08)]' : 'bg-[#0a0a0c]/80 shadow-[0_0_40px_rgba(219,39,119,0.08)]'
          }`}
        >
          {/* Most Popular Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-pink-400/30">
            <Sparkles size={8} className="animate-pulse" />
            <span>Most Popular</span>
          </div>

          <div className="space-y-4 flex-1">
            <p className={`${theme === 'light' ? 'text-pink-600' : 'text-pink-400'} uppercase text-xs font-black tracking-widest`}>Basic Plan</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl lg:text-5xl font-serif font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>₹49</span>
              <span className={`${theme === 'light' ? 'text-zinc-500' : 'text-gray-400'} text-sm`}>/ month</span>
            </div>
            <p className={`${theme === 'light' ? 'text-zinc-600' : 'text-gray-400'} text-sm leading-relaxed`}>
              Amplify your storage and share pristine assets.
            </p>

            <div className={`h-[1px] ${theme === 'light' ? 'bg-pink-100' : 'bg-white/5'} my-6`} />

            <ul className="space-y-4">
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-gray-200'}`}>
                <Check size={16} className="text-pink-400 mt-0.5 shrink-0" />
                <span><strong>100 saves</strong> per day</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-gray-200'}`}>
                <Check size={16} className="text-pink-400 mt-0.5 shrink-0" />
                <span className={`font-bold ${theme === 'light' ? 'text-pink-600' : 'text-pink-300'}`}>Clean cards, no watermark</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-gray-300'}`}>
                <Check size={16} className="text-pink-400/70 mt-0.5 shrink-0" />
                <span>All categories unlocked</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-gray-300'}`}>
                <Check size={16} className="text-pink-400/70 mt-0.5 shrink-0" />
                <span>Email schedule delivery</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              disabled={loading || currentPlanNormalized === 'basic'}
              onClick={() => !loading && handleSubscribe('basic')}
              className={`w-full py-4 rounded-xl font-bold transition-all text-sm uppercase tracking-wider ${
                currentPlanNormalized === 'basic'
                  ? theme === 'light'
                    ? 'bg-zinc-100 text-pink-600 border border-pink-200 cursor-not-allowed'
                    : 'bg-[#18181b] text-pink-400 border border-pink-500/20 cursor-not-allowed'
                  : loading
                    ? theme === 'light'
                      ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed opacity-50'
                      : 'bg-[#18181b] text-gray-500 border border-white/5 cursor-not-allowed opacity-50'
                    : 'gradient-bg text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-pink-500/20'
              } flex items-center justify-center gap-2`}
            >
              {loading && lastTargetPlan === 'basic' ? (
                <Loader2 className="animate-spin" size={18} />
              ) : currentPlanNormalized === 'basic' ? (
                'Current Active'
              ) : (
                'Subscribe Now'
              )}
            </button>
          </div>
        </motion.div>

        {/* PRO PLAN */}
        <motion.div
          whileHover={loading ? {} : { y: -6 }}
          className={`flex flex-col relative rounded-3xl glass p-8 border ${
            currentPlanNormalized === 'pro' || currentPlanNormalized === 'premium'
              ? (theme === 'light' ? 'border-amber-500/70 bg-amber-50/50' : 'border-amber-500/70 bg-amber-950/10')
              : (theme === 'light' ? 'border-zinc-200' : 'border-white/10')
          } overflow-hidden shadow-2xl transition-all h-full ${
            theme === 'light' ? 'bg-white/90 shadow-amber-100/20' : 'bg-[#0a0a0c]/80'
          }`}
        >
          {/* Best Value Badge */}
          <div className={`absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            theme === 'light'
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            Best Value
          </div>

          <div className="space-y-4 flex-1">
            <p className={`${theme === 'light' ? 'text-amber-600' : 'text-amber-400'} uppercase text-xs font-black tracking-widest`}>Pro Elite</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl lg:text-5xl font-serif font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {isYearly ? '₹999' : '₹149'}
              </span>
              <span className={`${theme === 'light' ? 'text-zinc-500' : 'text-gray-400'} text-sm`}>/{isYearly ? 'year' : 'month'}</span>
            </div>
            <p className={`${theme === 'light' ? 'text-zinc-600' : 'text-gray-400'} text-sm leading-relaxed`}>
              Complete creative freedom. Seamless daily summaries.
            </p>

            <div className={`h-[1px] ${theme === 'light' ? 'bg-amber-100' : 'bg-white/5'} my-6`} />

            <ul className="space-y-4">
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-gray-100'}`}>
                <Check size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <span className="font-bold">Unlimited saves</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-gray-100'}`}>
                <Check size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <span className={`font-bold ${theme === 'light' ? 'text-amber-600' : 'text-amber-300'}`}>Clean HD Cards, No watermark</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-gray-200'}`}>
                <Check size={16} className="text-amber-400/80 mt-0.5 shrink-0" />
                <span>All original categories unlocked</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700 font-medium' : 'text-gray-200'}`}>
                <Check size={16} className="text-amber-400/80 mt-0.5 shrink-0" />
                <span className={`font-bold ${theme === 'light' ? 'text-amber-600' : 'text-amber-200'}`}>Email + Telegram delivery</span>
              </li>
              <li className={`flex items-start gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-gray-300'}`}>
                <Check size={16} className="text-amber-400/60 mt-0.5 shrink-0" />
                <span>Early access to new releases</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              disabled={loading || currentPlanNormalized === 'pro' || currentPlanNormalized === 'premium'}
              onClick={() => !loading && handleSubscribe('pro')}
              className={`w-full py-4 rounded-xl font-bold transition-all text-sm uppercase tracking-wider ${
                currentPlanNormalized === 'pro' || currentPlanNormalized === 'premium'
                  ? theme === 'light'
                    ? 'bg-zinc-100 text-amber-600 border border-amber-200 cursor-not-allowed'
                    : 'bg-[#18181b] text-amber-400 border border-amber-500/20 cursor-not-allowed'
                  : loading
                    ? theme === 'light'
                      ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed opacity-50'
                      : 'bg-[#18181b] text-gray-500 border border-white/5 cursor-not-allowed opacity-50'
                    : theme === 'light'
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10'
                      : 'bg-white hover:bg-gray-100 text-black'
              } flex items-center justify-center gap-2`}
            >
              {loading && lastTargetPlan === 'pro' ? (
                <Loader2 className="animate-spin" size={18} />
              ) : currentPlanNormalized === 'pro' || currentPlanNormalized === 'premium' ? (
                'Current Active'
              ) : (
                'Subscribe Now'
              )}
            </button>
          </div>
        </motion.div>

      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {successModal?.isOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSuccessModal(null); setActiveTab('explore'); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md glass border border-green-500/30 rounded-3xl p-8 text-center bg-[#050c05]/95 shadow-[0_20px_50px_rgba(0,128,0,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20 shadow-lg shadow-green-500/10 mb-2">
                  <Shield size={32} />
                </div>
                <h3 className="text-2xl font-serif font-black text-white">Thank You for Your Subscription!</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Excellent choice! Your upgrade to the <strong className="text-green-400 font-serif text-lg">{successModal.planName} Plan</strong> has been processed successfully. We truly appreciate your purchase and support!
                </p>
                <div className="pt-4 w-full">
                  <button
                    onClick={() => { setSuccessModal(null); setActiveTab('explore'); }}
                    className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 text-sm uppercase tracking-widest"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ERROR MODAL */}
      <AnimatePresence>
        {errorModal?.isOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setErrorModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-sm glass border border-red-500/30 rounded-3xl p-8 text-center bg-[#0c0505]/95 shadow-[0_20px_50px_rgba(255,0,0,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 mb-2">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-serif font-black text-white">Payment Declined</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {errorModal.message || 'The Secure Payment Gateway rejected this transaction. Please try again or inspect your credit lines.'}
                </p>
                <div className="pt-4 grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setErrorModal(null)}
                    className="py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const prevPlan = lastTargetPlan;
                      setErrorModal(null);
                      if (prevPlan) {
                        handleSubscribe(prevPlan);
                      }
                    }}
                    className="py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider"
                  >
                    Retry Payment
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
