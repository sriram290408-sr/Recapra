import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const Toast = ({ message, type = "info", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, message]); // Include message dependency to reset timer on new alert

  const getStyle = () => {
    switch (type) {
      case "success":
        return {
          border: "border-emerald-200 bg-emerald-50 text-emerald-800",
          icon: <CheckCircle className="text-emerald-600 shrink-0" size={20} />
        };
      case "error":
        return {
          border: "border-red-200 bg-red-50 text-red-800",
          icon: <AlertCircle className="text-red-600 shrink-0" size={20} />
        };
      case "warning":
        return {
          border: "border-amber-200 bg-amber-50 text-amber-850",
          icon: <AlertTriangle className="text-amber-600 shrink-0" size={20} />
        };
      case "info":
      default:
        return {
          border: "border-blue-200 bg-blue-50 text-blue-800",
          icon: <Info className="text-blue-600 shrink-0" size={20} />
        };
    }
  };

  if (!message) return null;

  const styles = getStyle();

  return (
    <div className={`fixed bottom-6 right-6 flex items-center justify-between gap-4 p-4 border rounded-xl shadow-lg z-50 min-w-[320px] max-w-md animate-slide-up ${styles.border}`}>
      <div className="flex items-center gap-3">
        {styles.icon}
        <span className="text-sm font-bold">{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="p-1 hover:bg-slate-900/5 hover:text-slate-900/40 rounded-md transition-colors" 
          aria-label="Close toast"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
