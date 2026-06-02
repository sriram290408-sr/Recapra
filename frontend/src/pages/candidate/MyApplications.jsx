import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import Pagination from "../../components/Pagination";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import Button from "../../components/Button";
import axiosInstance from "../../api/axiosInstance";
import {
  Eye,
  MessageSquare,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  Briefcase,
} from "lucide-react";

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchApplications = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        limit: 10,
        status: statusFilter,
      });

      const response = await axiosInstance.get(
        `/applications/my-applications?${params.toString()}`
      );

      setApplications(response.data.items || []);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not available";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Metric calculation - only current candidate's real applications
  const totalCount = applications.length || 0;

  const activeCount =
    applications.filter(
      (a) => a.status !== "rejected" && a.status !== "closed"
    ).length || 0;

  const interviewCount =
    applications.filter(
      (a) => a.status === "interview_scheduled" || a.status === "selected"
    ).length || 0;

  const tabs = [
    { id: "", label: "All Applications" },
    { id: "applied", label: "Applied" },
    { id: "under_review", label: "Under Review" },
    { id: "shortlisted", label: "Shortlisted" },
    { id: "interview_scheduled", label: "Interviewing" },
    { id: "selected", label: "Offered" },
    { id: "rejected", label: "Rejected" },
  ];

  // Map dynamic next steps text based on status
  const getNextStepText = (status) => {
    switch (status) {
      case "applied":
        return {
          text: "Resume screening",
          color: "text-slate-500 bg-slate-50",
        };

      case "under_review":
        return {
          text: "Hiring Manager Intro",
          color: "text-amber-600 bg-amber-50",
        };

      case "shortlisted":
        return {
          text: "Technical round assessment",
          color: "text-blue-600 bg-blue-50",
        };

      case "interview_scheduled":
        return {
          text: "Panel Interview scheduled",
          color: "text-purple-600 bg-purple-50",
        };

      case "selected":
        return {
          text: "Offer Letter Sent",
          color: "text-green-600 bg-green-50",
        };

      case "rejected":
        return {
          text: "Awaiting response",
          color: "text-red-500 bg-red-50/50",
        };

      default:
        return {
          text: "Resume screening",
          color: "text-slate-500 bg-slate-50",
        };
    }
  };

  const handleExportCSV = () => {
    setToastType("info");
    setToastMsg("Exporting CSV file...");
  };

  const filteredApps = applications.filter((app) => {
    const query = searchQuery.toLowerCase();
    const title = app.job?.title?.toLowerCase() || "";
    const company = app.job?.company?.company_name?.toLowerCase() || "";

    return title.includes(query) || company.includes(query);
  });

  return (
    <div className="space-y-6">
      <Toast
        message={toastMsg}
        type={toastType}
        onClose={() => setToastMsg("")}
      />

      {/* Top Header & Dynamic Metrics */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Applications
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Track and manage your progress with all potential employers in one
            place.
          </p>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 px-5 text-center shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total
            </span>
            <span className="text-lg font-extrabold text-slate-800">
              {totalCount}
            </span>
          </div>

          <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 px-5 text-center shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active
            </span>
            <span className="text-lg font-extrabold text-brand-600">
              {activeCount}
            </span>
          </div>

          <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 px-5 text-center shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Interviews
            </span>
            <span className="text-lg font-extrabold text-amber-500">
              {interviewCount}
            </span>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-slate-200 pt-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(1);
            }}
            className={`-mb-[2px] whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? "border-brand-600 font-extrabold text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search / Filter Row */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row">
        <div className="relative w-full md:max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />

          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex w-full items-center justify-end gap-2.5 md:w-auto">
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            size="sm"
            icon={Download}
            className="shrink-0 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader message="Fetching applications..." />
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="space-y-2 py-20 text-center">
            <Briefcase className="mx-auto text-slate-300" size={40} />

            <h3 className="text-sm font-bold text-slate-700">
              No applications found
            </h3>

            <p className="mx-auto max-w-sm text-xs text-slate-500">
              {searchQuery
                ? "Try refining your search keywords."
                : "You have not submitted applications for any job openings yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 py-3">Role & Company</th>
                  <th className="p-4 py-3">Date Applied</th>
                  <th className="p-4 py-3">Status</th>
                  <th className="p-4 py-3">Next Steps</th>
                  <th className="p-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const stepInfo = getNextStepText(app.status);

                  return (
                    <tr
                      key={app.id}
                      className="transition-colors hover:bg-slate-50/40"
                    >
                      <td className="p-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-600">
                            <Briefcase size={16} />
                          </div>

                          <div>
                            <strong className="block text-sm font-bold leading-tight text-slate-900">
                              {app.job?.title}
                            </strong>

                            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                              {app.job?.company?.company_name ||
                                "Vetted Company"}{" "}
                              • {app.job?.work_mode}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 py-3.5 font-bold text-slate-500">
                        {formatDate(app.applied_at)}
                      </td>

                      <td className="p-4 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>

                      <td className="p-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold ${stepInfo.color}`}
                        >
                          {stepInfo.text}
                        </span>
                      </td>

                      <td className="p-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() =>
                              navigate(`/candidate/jobs/${app.job_id}`)
                            }
                            variant="ghost"
                            size="sm"
                            className="text-xs font-bold text-slate-500 hover:text-slate-800"
                          >
                            View Job
                          </Button>

                          <Button
                            onClick={() => navigate("/candidate/notifications")}
                            variant="primary"
                            size="sm"
                            icon={MessageSquare}
                            className="rounded-lg bg-brand-600 py-1.5 text-[10px] font-bold text-white hover:bg-brand-700"
                          >
                            Message
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Insights row */}
      <div className="grid select-none grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-start gap-3 space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <TrendingUp
            className="mt-0.5 shrink-0 text-brand-600"
            size={20}
          />

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
              Response rate is high
            </h4>

            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
              Applications with complete profile parameters receive responses
              40% faster than general applicants.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <Award
            className="mt-0.5 shrink-0 text-emerald-600"
            size={20}
          />

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
              Keep it active
            </h4>

            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
              Applying to 3-5 high-match vetted job opportunities per week keeps
              your professional rebuilding path active.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <Calendar
            className="mt-0.5 shrink-0 text-indigo-600"
            size={20}
          />

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
              Update your resume
            </h4>

            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
              Regular updates to your project details and certifications ensure
              company coordinators have highly accurate data.
            </p>
          </div>
        </div>
      </div>

      {/* Pagination component */}
      {!loading && totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default MyApplications;