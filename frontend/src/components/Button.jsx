import React from "react";
import Loader from "./Loader";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconPosition = "left",
  className = "",
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-indigo-700 text-white hover:bg-indigo-800 active:bg-indigo-900 focus:ring-indigo-500 shadow-sm border border-transparent",
    secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-indigo-500 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm border border-transparent",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus:ring-slate-500 border border-transparent",
    outline: "bg-transparent border border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 focus:ring-indigo-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-base rounded-xl gap-2.5"
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {loading && <Loader message="" />}
      {!loading && Icon && iconPosition === "left" && <Icon className="shrink-0" size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === "right" && <Icon className="shrink-0" size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />}
    </button>
  );
};

export default Button;
