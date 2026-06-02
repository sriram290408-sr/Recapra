import React from "react";

const StatusBadge = ({ status }) => {
  const getBadgeStyle = (stat) => {
    if (!stat) return "bg-slate-50 text-slate-700 border-slate-200";
    const s = stat.toLowerCase();
    
    switch (s) {
      // Successes / Green
      case "approved":
      case "selected":
      case "shortlisted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      
      // Pendings / Orange
      case "pending":
      case "under_review":
        return "bg-amber-50 text-amber-700 border-amber-200";
        
      // Rejections / Red
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
        
      // Info / Blue
      case "active":
      case "applied":
      case "offer_sent":
        return "bg-blue-50 text-blue-700 border-blue-200";

      // Purple
      case "interview_scheduled":
      case "interview":
        return "bg-violet-50 text-violet-700 border-violet-200";

      // Indigo for ATS
      case "ats":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
        
      // Neutral / Gray
      case "closed":
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatStatusText = (stat) => {
    if (!stat) return "";
    return stat.replace(/_/g, " ").toUpperCase();
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyle(status)}`}>
      {formatStatusText(status)}
    </span>
  );
};

export default StatusBadge;
