import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  Clock, 
  Layers, 
  ChevronRight,
  Info,
  Edit2,
  Pause,
  Play,
  Trash2,
  Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  getSubscription, 
  saveSubscription, 
  updateSubscription, 
  pauseSubscription, 
  cancelSubscription,
  getVerification,
  saveVerification,
  clearVerification,
  incrementVerificationAttempts,
  Subscription 
} from '../services/storage';
import { cn } from '../lib/utils';
import axios from 'axios';

const CATEGORIES = ['All', 'Motivational', 'Wisdom', 'Love', 'Islamic', 'Life', 'Success'];
const MOODS = ['All', 'Uplifting', 'Calm', 'Energetic', 'Reflective'];
const COUNTS = [1, 3, 5, 10, 20];
const FREQUENCIES: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
const TIMES: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];

export const Delivery: React.FC = () => {
  const { addToast } = useApp();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState<'form' | 'verifying' | 'success'>('form');

  // Form State
  const [channel, setChannel] = useState<'email' | 'telegram'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('All');
  const [mood, setMood] = useState('All');
  const [count, setCount] = useState(5);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Verification State
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  useEffect(() => {
    const sub = getSubscription();
    setSubscription(sub);
    if (sub && sub.verified) {
      populateForm(sub);
    } else if (sub && !sub.verified) {
      // If there was an unverified sub, we might want to resume verification
      const ver = getVerification();
      if (ver) {
        setVerificationCode(ver.code);
        setStep('verifying');
      }
    }

    // Check for block
    const blockUntil = localStorage.getItem('soulscript_block_expiry');
    if (blockUntil) {
      const remaining = Math.max(0, Math.ceil((parseInt(blockUntil) - Date.now()) / 1000));
      if (remaining > 0) {
        setIsBlocked(true);
        setBlockTimeLeft(remaining);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'verifying' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBlocked && blockTimeLeft > 0) {
      timer = setInterval(() => setBlockTimeLeft(prev => prev - 1), 1000);
    } else if (blockTimeLeft === 0) {
      setIsBlocked(false);
    }
    return () => clearInterval(timer);
  }, [isBlocked, blockTimeLeft]);

  const populateForm = (sub: Subscription) => {
    setChannel(sub.channel);
    setEmail(sub.email || '');
    setUsername(sub.username || '');
    setCategory(sub.category);
    setMood(sub.mood);
    setCount(sub.count);
    setFrequency(sub.frequency);
    setTimeOfDay(sub.timeOfDay);
    setTimezone(sub.timezone);
  };

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleStartDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      addToast(`Too many attempts. Try again in ${Math.ceil(blockTimeLeft / 60)} minutes.`, 'error');
      return;
    }

    const code = generateCode();
    const identifier = channel === 'email' ? email : username;
    
    setVerificationCode(code);
    setTimeLeft(600);
    saveVerification(identifier, code);

    // Call backend to send email or create PB verification record
    try {
      if (channel === 'email') {
        await axios.post('/api/verify/email', { email, code });
      } else {
        await axios.post('/api/verify/telegram', { username, code });
      }
    } catch (err) {
      console.error("Verification initiation failed:", err);
    }

    const formData = {
      channel,
      email: channel === 'email' ? email : undefined,
      username: channel === 'telegram' ? username : undefined,
      category,
      mood,
      count,
      frequency,
      timeOfDay,
      timezone
    };

    saveSubscription(formData);
    setStep('verifying');
  };

  const handleVerifyEmail = () => {
    const ver = getVerification();
    if (!ver) {
      addToast('Verification expired. Please resend code.', 'error');
      return;
    }

    if (enteredCode === ver.code) {
      const sub = updateSubscription({ verified: true })!;
      setSubscription(sub);
      setStep('success');
      clearVerification();
      addToast('Email verified successfully!', 'success');
    } else {
      const attempts = incrementVerificationAttempts();
      if (attempts >= 3) {
        const expiry = Date.now() + 30 * 60 * 1000;
        localStorage.setItem('soulscript_block_expiry', expiry.toString());
        setIsBlocked(true);
        setBlockTimeLeft(30 * 60);
        addToast('Too many attempts. Blocked for 30 minutes.', 'error');
        setStep('form');
      } else {
        addToast(`Wrong code. ${3 - attempts} attempts left.`, 'error');
      }
    }
  };

  const checkTelegramStatus = async () => {
    try {
      const res = await axios.get('/api/verify/status', { params: { username } });
      if (res.data.verified) {
        const sub = updateSubscription({ verified: true, chatId: res.data.record.chatId })!;
        setSubscription(sub);
        setStep('success');
        clearVerification();
        addToast('Telegram verified successfully!', 'success');
      } else {
        addToast('Verification still pending...', 'info');
      }
    } catch (err) {
      addToast('Could not check status. Make sure you sent the code to the bot', 'error');
    }
  };

  const handleResend = async () => {
    const code = generateCode();
    setVerificationCode(code);
    setTimeLeft(600);
    saveVerification(channel === 'email' ? email : username, code);

    try {
      if (channel === 'email') {
        await axios.post('/api/verify/email', { email: email, code });
      } else {
        await axios.post('/api/verify/telegram', { username, code });
      }
      addToast('New code sent!', 'success');
    } catch (err) {
      addToast('Failed to resend code', 'error');
    }
  };

  const handlePause = () => {
    pauseSubscription();
    setSubscription(getSubscription());
    addToast(subscription?.paused ? 'Resumed deliveries' : 'Paused deliveries', 'info');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      cancelSubscription();
      setSubscription(null);
      setStep('form');
      addToast('Subscription cancelled', 'info');
    }
  };

  if (step === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-20 text-center"
      >
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={48} className="text-emerald-400" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-4">You're all set!</h1>
        <p className="text-[var(--text-secondary)] text-xl mb-12">
          Quote cards will arrive every <span className="text-indigo-400 font-bold capitalize">{timeOfDay}</span>.
        </p>
        <button 
          onClick={() => setStep('form')}
          className="px-8 py-4 gradient-bg rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          Manage Subscription
        </button>
      </motion.div>
    );
  }

  if (step === 'verifying') {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-12 py-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)]">
            {channel === 'email' ? 'Check your inbox' : 'Verify your Telegram'}
          </h1>
          <p className="text-[var(--text-secondary)]">
            {channel === 'email' ? `We sent a code to ${email}` : `Send this code to @SoulScriptBot on Telegram`}
          </p>
        </div>

        {channel === 'telegram' ? (
          <div className="space-y-8">
            <div className="p-12 glass-heavy border border-indigo-500/30 rounded-[2.5rem] text-center space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full gradient-bg opacity-5 group-hover:opacity-10 transition-opacity" />
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Your Verification Code</p>
              <div className="text-6xl font-black font-mono tracking-[0.2em] text-white">
                {verificationCode}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={checkTelegramStatus}
                className="w-full py-6 gradient-bg rounded-3xl text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                I've sent the code
              </button>
              <div className="flex items-center justify-between px-2">
                <button onClick={handleResend} className="text-indigo-400 font-bold hover:underline">Resend Code</button>
                <button onClick={() => setStep('form')} className="text-gray-500 font-bold hover:underline">Change Username</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-6">
              <label className="block text-xs font-black uppercase tracking-widest text-indigo-400 text-center">6-Digit Code</label>
              <input 
                type="text"
                maxLength={6}
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-4xl font-black font-mono tracking-[0.5em] py-8 bg-white/5 border-2 border-white/10 rounded-3xl focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleVerifyEmail}
                className="w-full py-6 gradient-bg rounded-3xl text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Verify
              </button>
              <div className="flex items-center justify-between px-2">
                <button onClick={handleResend} className="text-indigo-400 font-bold hover:underline">Resend Code</button>
                <button onClick={() => setStep('form')} className="text-gray-500 font-bold hover:underline">Change Email</button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center pt-8">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-colors",
            timeLeft < 120 ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-white/5 border-white/10 text-gray-500"
          )}>
            <Clock size={14} />
            {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : "Code expired"}
          </div>
          {timeLeft === 0 && (
            <p className="mt-4 text-xs text-rose-400 font-medium">Please tap Resend to get a new one.</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-2">Get Quotes Delivered</h1>
        <p className="text-[var(--text-secondary)] font-medium">Receive beautiful quote cards directly to your inbox or Telegram</p>
      </div>

      {subscription && subscription.verified && !isEditing ? (
        /* Management UI */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-heavy rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 gradient-bg" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                {subscription.channel === 'email' ? <Mail size={32} className="text-indigo-400" /> : <MessageSquare size={32} className="text-indigo-400" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold font-serif text-[var(--text-primary)]">Active Subscription</h2>
                <p className="text-indigo-400 font-medium">{subscription.channel === 'email' ? subscription.email : `${subscription.username}`}</p>
              </div>
            </div>
            
            {subscription.paused && (
              <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2 text-amber-500 text-xs font-black uppercase tracking-widest">
                <AlertCircle size={14} />
                Paused
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Category</p>
              <p className="text-[var(--text-primary)] font-bold">{subscription.category}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Frequency</p>
              <p className="text-[var(--text-primary)] font-bold capitalize">{subscription.frequency}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Time</p>
              <p className="text-[var(--text-primary)] font-bold capitalize">{subscription.timeOfDay}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Count</p>
              <p className="text-[var(--text-primary)] font-bold">{subscription.count} {subscription.count === 1 ? 'Quote' : 'Quotes'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-white/5">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 min-w-[140px] px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Edit2 size={16} />
              Edit Settings
            </button>
            <button 
              onClick={handlePause}
              className={cn(
                "flex-1 min-w-[140px] px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                subscription.paused ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              )}
            >
              {subscription.paused ? <Play size={16} /> : <Pause size={16} />}
              {subscription.paused ? 'Resume' : 'Pause'}
            </button>
            <button 
              onClick={handleCancel}
              className="w-full md:w-auto px-6 py-4 text-rose-400/60 hover:text-rose-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Cancel Subscription
            </button>
          </div>
        </motion.div>
      ) : (
        /* Subscription Form */
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleStartDelivery} 
          className="space-y-12"
        >
          {/* Channel Selection */}
          <div className="space-y-6">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Choose Delivery Channel</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setChannel('email')}
                className={cn(
                  "flex items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all",
                  channel === 'email' 
                    ? "bg-indigo-600/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]" 
                    : "bg-white/5 border-transparent hover:bg-white/10"
                )}
              >
                <Mail size={24} className={channel === 'email' ? "text-white" : "text-gray-500"} />
                <span className={cn("font-bold", channel === 'email' ? "text-white" : "text-gray-500")}>Email</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('telegram')}
                className={cn(
                  "flex items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all",
                  channel === 'telegram' 
                    ? "bg-sky-600/10 border-sky-500 shadow-[0_0_30px_rgba(14,165,233,0.2)]" 
                    : "bg-white/5 border-transparent hover:bg-white/10"
                )}
              >
                <MessageSquare size={24} className={channel === 'telegram' ? "text-white" : "text-gray-500"} />
                <span className={cn("font-bold", channel === 'telegram' ? "text-white" : "text-gray-500")}>Telegram</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {channel === 'email' ? (
              <motion.div 
                key="email-field"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/10 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="telegram-field"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="p-8 bg-sky-500/10 border border-sky-500/20 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 text-sky-400 font-bold">
                    <Info size={20} />
                    <span>How to verify</span>
                  </div>
                  <ol className="space-y-3 text-sky-200/80 text-sm">
                    <li>1. Open Telegram and search <span className="text-white font-mono bg-sky-500/20 px-2 py-0.5 rounded">@SoulScriptBot</span></li>
                    <li>2. Start the bot and send the code we give you next.</li>
                    <li>3. We'll link your account automatically.</li>
                  </ol>
                </div>
                
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Telegram Username</label>
                <div className="relative">
                  <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input 
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value)}
                    placeholder="@yourusername"
                    className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/10 rounded-3xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-lg"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categorical Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                <Layers size={14} />
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      category === c ? "gradient-bg text-white shadow-lg" : "bg-white/5 text-gray-500 hover:bg-white/10"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                <Bell size={14} />
                Mood
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      mood === m ? "gradient-bg text-white shadow-lg" : "bg-white/5 text-gray-500 hover:bg-white/10"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Number of Quotes */}
            <div className="space-y-6">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Quotes per delivery</label>
              <div className="flex flex-wrap gap-2">
                {COUNTS.map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={cn(
                      "w-12 h-12 rounded-xl text-xs font-black transition-all flex items-center justify-center",
                      count === num ? "bg-indigo-500 text-white shadow-lg" : "bg-white/5 text-gray-500 hover:bg-white/10"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-6">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Frequency</label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCIES.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      frequency === f ? "bg-indigo-500 text-white shadow-lg" : "bg-white/5 text-gray-500 hover:bg-white/10"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Time of Day */}
            <div className="space-y-6">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                <Clock size={14} />
                Time of Day
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeOfDay(t)}
                    className={cn(
                      "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      timeOfDay === t ? "bg-indigo-500 text-white shadow-lg" : "bg-white/5 text-gray-500 hover:bg-white/10"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-6">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                <Globe size={14} />
                Time Zone
              </label>
              <select 
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none transition-all focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {(Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone').map((tz: string) => (
                  <option key={tz} value={tz} className="bg-black text-white">{tz}</option>
                )) : (
                  <option value={timezone}>{timezone}</option>
                )}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-12 flex flex-col md:flex-row items-center gap-4">
            <button 
              type="submit"
              className={cn(
                "w-full md:flex-1 py-6 rounded-3xl text-white font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-lg flex items-center justify-center gap-3",
                isBlocked ? "bg-gray-800 cursor-not-allowed opacity-50" : "gradient-bg shadow-indigo-500/40"
              )}
              disabled={isBlocked}
            >
              <Send size={24} />
              {subscription ? 'Update Subscription' : 'Start Delivery'}
            </button>
            
            {isEditing && (
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full md:w-auto px-12 py-6 bg-white/5 rounded-3xl text-[var(--text-secondary)] font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </motion.form>
      )}
    </div>
  );
};
