import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const UnauthorizedPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (user?.role) {
      navigate(`/${user.role}/dashboard`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white/90 p-8 text-center shadow-xl backdrop-blur-md">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert size={42} strokeWidth={1.8} />
        </div>

        {/* Status */}
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-red-500">
          Unauthorized Access
        </p>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold text-slate-900">
          Access Denied
        </h1>

        {/* Message */}
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-slate-600">
          You do not have permission to view this page. Please return to your
          dashboard or sign in again with the correct account role.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
          >
            <ArrowLeft size={16} />
            Go to Dashboard
          </button>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogIn size={16} />
            Sign In Again
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;