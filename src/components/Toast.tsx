import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp, Toast as ToastType } from '../context/AppContext';
import { cn } from '../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-sm px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: ToastType;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const variants = {
    success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    error: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    info: { icon: Info, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  };

  const { icon: Icon, color, bg } = variants[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-full glass border shadow-2xl backdrop-blur-xl w-full sm:w-auto min-w-[280px]",
        bg
      )}
    >
      <Icon className={cn("shrink-0", color)} size={20} />
      <span className="text-sm font-medium pr-2 flex-1">{toast.message}</span>
      <button 
        onClick={onRemove}
        className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};
