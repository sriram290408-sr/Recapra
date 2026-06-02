import React from "react";

const Loader = ({ fullPage = false, message = "Loading..." }) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center z-50 animate-fade-in">
        <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-8 flex flex-col items-center max-w-xs text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          {message && <p className="text-slate-700 text-sm font-semibold">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
      {message && <span className="text-slate-500 text-xs font-medium">{message}</span>}
    </div>
  );
};

export default Loader;
