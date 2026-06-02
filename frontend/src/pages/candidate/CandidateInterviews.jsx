import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import Toast from "../../components/Toast";
import axiosInstance from "../../api/axiosInstance";
import {
  Calendar,
  ExternalLink,
  MapPin,
  User,
  Briefcase,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const isValidUrl = (value) => {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const modeLabel = (mode) => {
  if (!mode) return "—";
  const map = {
    online: "Online Video Call",
    "face-to-face": "In-Person / Office",
    phone: "Phone Interview",
  };
  return map[mode] || mode;
};

// Shared table renderer — isPast controls Join Meeting visibility
const InterviewTable = ({ interviews, isPast = false }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[900px] text-left">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50">
          <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">Job Title</th>
          <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">Date &amp; Time</th>
          <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">Mode</th>
          <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">Interviewer</th>
          <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            {isPast ? "Location / Link" : "Meeting Link / Location"}
          </th>
          <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {interviews.map((interview) => (
          <tr
            key={interview.id}
            className={`align-top transition hover:bg-slate-50/70 ${isPast ? "opacity-75" : ""}`}
          >
            {/* Job Title */}
            <td className="px-5 py-4 align-top">
              <div className="flex items-start gap-2">
                <Briefcase size={14} className="mt-0.5 shrink-0 text-brand-500" />
                <div>
                  <span className="block text-sm font-bold text-slate-800">
                    {interview.job_title || interview.title || "—"}
                  </span>
                  {interview.company_name && (
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                      {interview.company_name}
                    </p>
                  )}
                </div>
              </div>
            </td>

            {/* Date & Time */}
            <td className="px-5 py-4 align-top">
              <div className="flex items-start gap-2">
                <Calendar size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <span
                  className={`text-sm font-semibold ${
                    isPast
                      ? "text-slate-400 line-through decoration-slate-300"
                      : "text-slate-700"
                  }`}
                >
                  {formatDateTime(interview.date_time)}
                </span>
              </div>
            </td>

            {/* Mode */}
            <td className="px-5 py-4 align-top">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                  isPast
                    ? "border-slate-200 bg-slate-50 text-slate-400"
                    : "border-indigo-100 bg-indigo-50 text-indigo-700"
                }`}
              >
                {modeLabel(interview.interview_mode)}
              </span>
            </td>

            {/* Interviewer */}
            <td className="px-5 py-4 align-top">
              <div className="flex items-start gap-2">
                <User size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <span
                  className={`text-sm font-semibold ${
                    isPast ? "text-slate-400" : "text-slate-700"
                  }`}
                >
                  {interview.interviewer_name || "Not specified"}
                </span>
              </div>
            </td>

            {/* Meeting Link / Location */}
            <td className="px-5 py-4 align-top">
              {interview.location_or_link ? (
                isValidUrl(interview.location_or_link) ? (
                  isPast ? (
                    // Expired — no join button, just a neutral label
                    <span className="text-xs font-semibold text-slate-400 line-through decoration-slate-300">
                      Meeting link (expired)
                    </span>
                  ) : (
                    <a
                      href={interview.location_or_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
                    >
                      <ExternalLink size={13} />
                      Join Meeting
                    </a>
                  )
                ) : (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    <span
                      className={`text-sm font-semibold ${
                        isPast ? "text-slate-400" : "text-slate-700"
                      }`}
                    >
                      {interview.location_or_link}
                    </span>
                  </div>
                )
              ) : (
                <span className="text-xs font-semibold text-slate-400">
                  Meeting link / location not added
                </span>
              )}
            </td>

            {/* Status */}
            <td className="px-5 py-4 text-center align-top">
              <div className="flex justify-center">
                {isPast ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    <CheckCircle2 size={11} />
                    Completed
                  </span>
                ) : (
                  <StatusBadge status={interview.status || "scheduled"} />
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CandidateInterviews = () => {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/interviews/my-interviews");
      const data = response.data;
      // New API returns .upcoming and .past; legacy fallback uses .items
      setUpcoming(data.upcoming ?? data.items ?? []);
      setPast(data.past ?? []);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load your scheduled interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg("")} />

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                    <Calendar size={14} />
                    Interview Schedule
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    My Interviews
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                    View all upcoming interviews scheduled for you. Click &quot;Join Meeting&quot; to open your video call link.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {/* ── Upcoming Interviews ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-brand-500" />
              Upcoming Interviews
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {loading
                ? "Loading..."
                : `${upcoming.length} upcoming interview${upcoming.length !== 1 ? "s" : ""} scheduled.`}
            </p>
          </div>

          {loading ? (
            <div className="p-8">
              <Loader message="Loading your interviews..." />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Upcoming Interviews Scheduled"
                description="You don't have any upcoming interviews. Check back after applying to jobs or wait for a recruiter to schedule one."
                icon={Calendar}
              />
            </div>
          ) : (
            <InterviewTable interviews={upcoming} isPast={false} />
          )}
        </div>

        {/* ── Past Interviews (collapsible) ── */}
        {!loading && past.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setShowPast((v) => !v)}
              className="w-full border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6 flex items-center justify-between text-left hover:bg-slate-100 transition"
            >
              <div>
                <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-slate-400" />
                  Past Interviews
                  <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-500">
                    {past.length}
                  </span>
                </h3>
                <p className="mt-0.5 text-xs font-medium text-slate-400">
                  Interviews whose scheduled time has already passed.
                </p>
              </div>
              {showPast ? (
                <ChevronUp size={18} className="text-slate-400 shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-slate-400 shrink-0" />
              )}
            </button>

            {showPast && <InterviewTable interviews={past} isPast={true} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateInterviews;
