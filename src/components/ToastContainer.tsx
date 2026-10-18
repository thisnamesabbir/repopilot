import React from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useRepoPilot();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let icon = <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
        let borderColor = 'border-blue-500/30';
        let bg = 'bg-slate-900/95';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
          borderColor = 'border-emerald-500/30';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
          borderColor = 'border-amber-500/30';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
          borderColor = 'border-rose-500/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border ${borderColor} ${bg} backdrop-blur-md shadow-2xl text-slate-200 transition-all`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-400 mt-0.5 break-words">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
