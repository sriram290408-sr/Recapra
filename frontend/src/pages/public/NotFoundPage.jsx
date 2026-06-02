import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, SearchX } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-md p-8 text-center">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <SearchX size={42} strokeWidth={1.8} />
        </div>

        {/* Error Code */}
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Error 404
        </p>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold text-slate-900">
          Page Not Found
        </h1>

        {/* Message */}
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-slate-600">
          Sorry, the page you are looking for does not exist, may have been moved,
          or is currently unavailable.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Home size={16} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;