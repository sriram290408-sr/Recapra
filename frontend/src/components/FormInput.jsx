import React from "react";
import { AlertCircle } from "lucide-react";

const FormInput = ({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  ...props
}) => {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-500 ${
          error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-slate-200"
        }`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
      {error && (
        <span className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
};

export default FormInput;
