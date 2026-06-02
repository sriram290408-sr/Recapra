import React from "react";

const SectionCard = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-6 animate-fade-in ${className}`}>
      {title && (
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
          {title}
        </h3>
      )}
      <div>{children}</div>
    </div>
  );
};

export default SectionCard;
