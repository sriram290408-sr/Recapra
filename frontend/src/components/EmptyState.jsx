import React from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

const EmptyState = ({ 
  title = "No Data Found", 
  description = "There is nothing to display here at the moment.", 
  actionText, 
  onAction,
  icon: Icon = Inbox
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-12 animate-fade-in select-none">
      <div className="p-4 bg-slate-50 border border-slate-100 shadow-xs text-slate-400 rounded-2xl mb-4">
        <Icon size={38} className="shrink-0" />
      </div>
      <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 font-medium max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
