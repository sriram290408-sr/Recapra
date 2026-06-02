import React from "react";

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = "brand",
  onClick
}) => {
  const bgColors = {
    brand: "bg-indigo-50 text-indigo-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700",
    neutral: "bg-slate-50 text-slate-700",
  };

  const bgStyle = bgColors[variant] || bgColors.brand;

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[140px] transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-md hover:border-indigo-500 hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${bgStyle}`}>
            <Icon size={22} className="shrink-0" />
          </div>
        )}
      </div>
      {subtext && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">{subtext}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
