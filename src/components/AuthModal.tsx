import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Github, Loader2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { signIn, signUp, signInWithGoogle, requestPasswordReset } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError(null);
    setSuccess(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signUp({
        name,
        email,
        password,
        passwordConfirm: confirmPassword,
      });
      // After signup, PocketBase usually requires email verification or you can auto-login if configured
      // For simplicity, we'll try to auto-login
      await signIn(email, password);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSuccess('Password reset link sent to your email.');
    } catch (err: any) {
      setError('Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError('Google sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full md:max-w-[420px] glass border border-[var(--border-color)] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 md:p-6 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl gradient-bg shadow-lg shadow-indigo-500/20">
                <Lock size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold font-serif text-[var(--text-primary)]">
                {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          {mode !== 'forgot-password' && (
            <div className="flex px-5 md:px-6 mt-4 md:mt-6 gap-4">
              <button
                onClick={() => { setMode('signin'); setError(null); }}
                className={cn(
                  "pb-2 text-sm font-bold uppercase tracking-wider transition-colors relative",
                  mode === 'signin' ? "text-indigo-400" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                Sign In
                {mode === 'signin' && (
                  <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={cn(
                  "pb-2 text-sm font-bold uppercase tracking-wider transition-colors relative",
                  mode === 'signup' ? "text-indigo-400" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                Sign Up
                {mode === 'signup' && (
                  <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full" />
                )}
              </button>
            </div>
          )}

          <div className="p-5 md:p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {mode !== 'forgot-password' && (
              <div className="mb-6 space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-gray-100 active:scale-[0.98] shadow-lg shadow-white/5"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                    />
                  </svg>
                  <span className="text-[15px]">Continue with Google</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
                    <span className="bg-[#0a0a0b] px-4 text-gray-500">or continue with email</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleForgotPassword} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Password</label>
                    {mode === 'signin' && (
                      <button 
                        type="button" 
                        onClick={() => setMode('forgot-password')}
                        className="text-[10px] uppercase font-black tracking-widest text-indigo-400 hover:text-indigo-300"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full gradient-bg text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
            
            {mode === 'forgot-password' && (
              <button
                onClick={() => setMode('signin')}
                className="w-full mt-6 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
