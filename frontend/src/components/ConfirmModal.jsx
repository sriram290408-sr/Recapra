import React from "react";
import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

const ConfirmModal = ({
  isOpen = false,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-md w-11/12 animate-slide-up relative">
        <button 
          onClick={onCancel} 
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors duration-200" 
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex gap-4">
          <div className={`p-3 rounded-xl shrink-0 h-fit ${
            variant === "danger" ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"
          }`}>
            <AlertTriangle size={24} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 leading-none">{title}</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button 
            onClick={onCancel} 
            variant="secondary" 
            size="sm"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm} 
            variant={variant === "danger" ? "danger" : "primary"} 
            size="sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
