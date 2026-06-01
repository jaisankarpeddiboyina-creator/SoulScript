import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Edit2, Check, X, Shield, Trash2, LogOut, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pocketbaseService, formatPocketBaseUrl } from '../services/pocketbase';
import { cn } from '../lib/utils';

interface ProfileProps {
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const { user, signOut, updateProfile, deleteAccount, isPremium, downloadsToday, downloadsLimit, plan } = useAuth();
  const { addToast, setActiveTab } = useApp();
  
  // Loading states
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  
  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      if (!user) return;
      await pocketbaseService.uploadAvatar(user.id, file);
      addToast('Avatar updated successfully', 'success');
    } catch (err: any) {
      addToast('Failed to update avatar', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === user?.name) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingName(true);
    try {
      await updateProfile({ name: editedName });
      addToast('Profile name updated', 'success');
      setIsEditingName(false);
    } catch (err: any) {
      addToast('Failed to update name', 'error');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await pocketbaseService.changePassword(oldPassword, newPassword, confirmPassword);
      addToast('Password updated successfully', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;

    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      addToast('Account deleted permanently', 'success');
      onBack();
    } catch (err: any) {
      addToast('Failed to delete account', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? This will instantly downgrade your account and limit your daily saves to 5.")) {
      return;
    }
    
    setIsCancelling(true);
    try {
      await pocketbaseService.updateProfile(user.id, { plan: 'free' });
      
      addToast('Subscription cancelled successfully', 'success');
      
      // Force reload page to pull fresh profile context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      addToast(e.message || 'Error processing cancellation. Please contact support.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const getAvatarUrl = (user: any) => {
    if (user?.avatar) {
      const baseUrl = formatPocketBaseUrl(import.meta.env.VITE_POCKETBASE_URL);
      return `${baseUrl}/api/files/users/${user.id}/${user.avatar}`;
    }
    return null;
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-widest text-xs">Back</span>
      </button>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="glass rounded-3xl p-8 border border-[var(--border-color)] shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Avatar Section */}
            <div className="relative group">
              <div 
                className="w-20 h-20 rounded-3xl gradient-bg p-1 shadow-2xl cursor-pointer overflow-hidden"
                onClick={handleAvatarClick}
              >
                <div className="w-full h-full rounded-[20px] bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden relative">
                  {getAvatarUrl(user) ? (
                    <img src={getAvatarUrl(user)} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-serif font-black text-indigo-400">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </span>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploadingAvatar ? <Loader2 className="animate-spin text-white" size={16} /> : <Camera className="text-white" size={16} />}
                  </div>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            {/* User Info Section */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-4">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-white/5 border border-indigo-500/30 rounded-lg px-3 py-1 text-xl font-bold font-serif text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={isUpdatingName} className="p-1 hover:text-green-400 transition-colors">
                      {isUpdatingName ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    </button>
                    <button onClick={() => { setIsEditingName(false); setEditedName(user.name || ''); }} className="p-1 hover:text-red-400 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold font-serif text-[var(--text-primary)]">{user.name || 'Set Name'}</h1>
                    <button onClick={() => setIsEditingName(true)} className="p-1 text-[var(--text-secondary)] hover:text-indigo-400 transition-colors">
                      <Edit2 size={18} />
                    </button>
                  </>
                )}
              </div>
              <p className="text-[var(--text-secondary)] font-medium">{user.email}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 animate-fade-in">
                <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/50 text-emerald-400 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  Community Elite (Free)
                </div>
                
                <button 
                  onClick={() => { onBack(); setActiveTab('pricing'); }}
                  className="text-[10px] font-black uppercase tracking-widest text-[#818cf8] hover:text-indigo-300 underline underline-offset-4"
                >
                  Buy Coffee☕
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-morphism p-4 rounded-2xl border border-[var(--border-color)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">Downloads Today</p>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    Unlimited
                  </span>
                  <span className="text-[10px] font-black uppercase text-indigo-400">
                    Sponsor Supported
                  </span>
                </div>
              </div>
            </div>
            <div className="glass-morphism p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">Account Status</p>
                <div className="flex items-center gap-2 text-green-400">
                  <Shield size={14} />
                  <span className="text-sm font-bold">Verified</span>
                </div>
              </div>
              <Sparkles className="text-indigo-400/30" size={32} />
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="glass rounded-3xl p-8 border border-[var(--border-color)] shadow-xl">
          <h2 className="text-xl font-bold font-serif text-[var(--text-primary)] mb-6">Security</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--border-color)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div className="hidden md:block" />
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--border-color)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--border-color)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2.5 gradient-bg text-white text-sm font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              {isChangingPassword ? <Loader2 size={18} className="animate-spin" /> : <span>Update Password</span>}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-3xl p-8 border border-red-500/20 shadow-xl">
          <h2 className="text-xl font-bold font-serif text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Once you delete your account, there is no going back. Please be certain.</p>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-xs hover:text-red-300 transition-colors px-4 py-2 border border-red-500/20 rounded-xl hover:bg-red-500/5"
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>

        <button
          onClick={() => { signOut(); onBack(); addToast('Signed out successfully', 'success'); }}
          className="w-full py-4 text-[var(--text-secondary)] hover:text-red-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors border-t border-[var(--border-color)] mt-8"
        >
          <LogOut size={18} />
          Sign Out of SoulScript
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass border border-red-500/30 rounded-3xl p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold font-serif text-[var(--text-primary)]">Delete Account?</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  To confirm, please type <span className="text-red-400 font-mono font-bold">DELETE</span> below. 
                  This will permanently erase your profile, saved quotes, and settings.
                </p>
                <input
                  type="text"
                  placeholder="Type DELETE"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full bg-white/5 border border-red-500/20 rounded-xl py-3 px-4 text-center font-mono font-bold text-red-400 focus:outline-none focus:border-red-500 transition-colors"
                />
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="py-3 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteConfirm !== 'DELETE' || isDeletingAccount}
                    onClick={handleDeleteAccount}
                    className="py-3 gradient-bg text-white text-sm font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                  >
                    {isDeletingAccount ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
