import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/StatCard";
import Loader from "../../components/Loader";
import Toast from "../../components/Toast";
import Button from "../../components/Button";
import ProfileAvatar from "../../components/ProfileAvatar";
import axiosInstance from "../../api/axiosInstance";
import {
  Briefcase,
  Users,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Plus,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
} from "lucide-react";

const CompanyDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const dashboardResponse = await axiosInstance.get("/company/dashboard");
      const dashboardData = dashboardResponse.data;
      setStats(dashboardData);

      const jobsResponse = await axiosInstance.get(
        "/jobs/company/my-jobs?page=1&limit=5"
      );

      const jobItems = jobsResponse.data?.items || [];

      const jobsWithApplicants = await Promise.all(
        jobItems.map(async (job) => {
          try {
            const applicantsResponse = await axiosInstance.get(
              `/applications/company-applicants/${job.id}`
            );

            const applicants = applicantsResponse.data?.items || [];

            return {
              ...job,
              applications_count: applicants.length,
              applicants,
            };
          } catch (err) {
            return {
              ...job,
              applications_count: 0,
              applicants: [],
            };
          }
        })
      );

      setRecentJobs(jobsWithApplicants);

      const allApplicants = jobsWithApplicants
        .flatMap((job) =>
          (job.applicants || []).map((applicant) => ({
            ...applicant,
            job_id: job.id,
            job_title: job.title || job.job_title || "Job opening",
          }))
        )
        .sort(
          (a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0)
        )
        .slice(0, 5);

      setRecentApplicants(allApplicants);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load company metrics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const getVerificationVariant = (status) => {
    if (status === "approved") return "success";
    if (status === "rejected") return "danger";
    return "warning";
  };

  const getApplicantName = (applicant) => {
    return (
      applicant.candidate_name ||
      applicant.name ||
      applicant.candidate?.full_name ||
      applicant.candidate?.user?.name ||
      applicant.candidate_profile?.full_name ||
      "Candidate"
    );
  };

  const getApplicantRole = (applicant) => {
    return (
      applicant.target_role ||
      applicant.role ||
      applicant.job_title ||
      applicant.job?.title ||
      "Applied candidate"
    );
  };

  const getPercent = (value, total) => {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.round((Number(value || 0) / Number(total)) * 100));
  };

  const getChartValues = () => {
    const jobs = Number(stats?.jobs_posted_count || 0);
    const activeJobs = Number(stats?.active_jobs_count || 0);
    const applications = Number(stats?.applications_received_count || 0);
    const shortlisted = Number(stats?.shortlisted_candidates_count || 0);
    const interviews = Number(stats?.interviews_scheduled_count || 0);

    return {
      jobs,
      activeJobs,
      applications,
      shortlisted,
      interviews,
      shortlistRate: getPercent(shortlisted, applications),
      interviewRate: getPercent(interviews, shortlisted),
    };
  };

  if (loading) {
    return <Loader fullPage message="Fetching recruiter metrics..." />;
  }

  const chart = getChartValues();

  const maxValue = Math.max(
    chart.jobs,
    chart.activeJobs,
    chart.applications,
    chart.shortlisted,
    chart.interviews,
    1
  );

  const chartData = [
    { label: "Jobs", shortLabel: "Jobs", value: chart.jobs },
    { label: "Active Jobs", shortLabel: "Active", value: chart.activeJobs },
    { label: "Applications", shortLabel: "Apps", value: chart.applications },
    { label: "Shortlisted", shortLabel: "Short", value: chart.shortlisted },
    { label: "Interviews", shortLabel: "Interviews", value: chart.interviews },
  ];

  const linePoints = chartData
    .map((item, index) => {
      const x = 20 + index * 45;
      const y = 120 - (item.value / maxValue) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Page Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Company Dashboard
            </h1>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Track verification, job posts, applications, and hiring pipeline
              activity from one place.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:justify-end">
            <Button
              onClick={() => navigate("/company/jobs")}
              variant="secondary"
              size="sm"
              className="w-full justify-center rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
            >
              Manage All Jobs
            </Button>

            <Button
              onClick={() => navigate("/company/post-job")}
              variant="primary"
              size="sm"
              icon={Plus}
              disabled={stats && !stats.is_verified}
              className="w-full justify-center rounded-xl bg-brand-600 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              title={
                stats && !stats.is_verified
                  ? "Verify company account to post jobs"
                  : ""
              }
            >
              Post a New Job
            </Button>
          </div>
        </div>

        {stats && (
          <>
            {/* Verification Banner */}
            {!stats.is_verified && (
              <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                    <AlertTriangle size={22} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Company verification is required
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-amber-800">
                      Your company account must be approved by admin before you
                      can publish active job posts.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/company/verification")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 sm:w-auto"
                >
                  Complete Verification
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard
                title="Verification"
                value={(stats.verification_status || "pending").toUpperCase()}
                subtext={
                  stats.is_verified
                    ? "Vetted Employer"
                    : "Pending Admin Approval"
                }
                icon={stats.is_verified ? ShieldCheck : AlertTriangle}
                variant={getVerificationVariant(stats.verification_status)}
                onClick={() => navigate("/company/verification")}
              />

              <StatCard
                title="Jobs Posted"
                value={(stats.jobs_posted_count || 0).toString()}
                subtext="Total listed opportunities"
                icon={Briefcase}
                variant="brand"
                onClick={() => navigate("/company/jobs")}
              />

              <StatCard
                title="Active Jobs"
                value={(stats.active_jobs_count || 0).toString()}
                subtext="Accepting responses"
                icon={Briefcase}
                variant="info"
                onClick={() => navigate("/company/jobs")}
              />

              <StatCard
                title="Applications"
                value={(stats.applications_received_count || 0).toString()}
                subtext="Applications received"
                icon={Users}
                variant="info"
                onClick={() => navigate("/company/jobs")}
              />

              <StatCard
                title="Shortlisted"
                value={(stats.shortlisted_candidates_count || 0).toString()}
                subtext="Qualified talent pool"
                icon={UserCheck}
                variant="success"
                onClick={() => navigate("/company/jobs")}
              />

              <StatCard
                title="Interviews"
                value={(stats.interviews_scheduled_count || 0).toString()}
                subtext="Scheduled discussions"
                icon={Calendar}
                variant="brand"
                onClick={() => navigate("/company/jobs")}
              />
            </div>

            {/* Hiring Analytics Graph Board - Only 3 Graphs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <BarChart3 size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      Hiring Analytics Graphs
                    </h3>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Three key hiring charts based on live company dashboard
                      data.
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                  <TrendingUp size={13} />
                  Live Backend Data
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* 1. Hiring Trend Line */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      Hiring Trend Line
                    </h4>
                    <Activity size={16} className="text-brand-600" />
                  </div>

                  <svg viewBox="0 0 220 140" className="h-40 w-full">
                    {[20, 50, 80, 110].map((y) => (
                      <line
                        key={y}
                        x1="10"
                        y1={y}
                        x2="210"
                        y2={y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    ))}

                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {chartData.map((item, index) => {
                      const x = 20 + index * 45;
                      const y = 120 - (item.value / maxValue) * 90;

                      return (
                        <g key={item.label}>
                          <circle cx={x} cy={y} r="4" fill="#4f46e5" />
                          <text
                            x={x}
                            y="136"
                            textAnchor="middle"
                            className="fill-slate-500 text-[8px] font-bold"
                          >
                            {item.shortLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* 2. Hiring Volume Bars */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      Hiring Volume Bars
                    </h4>
                    <BarChart3 size={16} className="text-emerald-600" />
                  </div>

                  <svg viewBox="0 0 220 140" className="h-40 w-full">
                    {[20, 50, 80, 110].map((y) => (
                      <line
                        key={y}
                        x1="10"
                        y1={y}
                        x2="210"
                        y2={y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    ))}

                    {chartData.map((item, index) => {
                      const height = (item.value / maxValue) * 90;
                      const x = 18 + index * 40;
                      const y = 120 - height;

                      return (
                        <g key={item.label}>
                          <rect
                            x={x}
                            y={y}
                            width="24"
                            height={height}
                            rx="4"
                            fill={index % 2 === 0 ? "#14b8a6" : "#4f46e5"}
                          />
                          <text
                            x={x + 12}
                            y="136"
                            textAnchor="middle"
                            className="fill-slate-500 text-[8px] font-bold"
                          >
                            {item.shortLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* 3. Conversion Donut */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      Conversion Donut
                    </h4>
                    <PieChart size={16} className="text-indigo-600" />
                  </div>

                  <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:flex-col">
                    <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-slate-200">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#4f46e5 ${chart.shortlistRate}%, #e2e8f0 0)`,
                        }}
                      />

                      <div className="relative flex h-22 w-22 flex-col items-center justify-center rounded-full bg-white p-4 shadow-sm">
                        <span className="text-2xl font-black text-slate-900">
                          {chart.shortlistRate}%
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Shortlist
                        </span>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      <div>
                        <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
                          <span>Shortlist Rate</span>
                          <span>{chart.shortlistRate}%</span>
                        </div>

                        <div className="h-2 rounded-full bg-white">
                          <div
                            className="h-2 rounded-full bg-indigo-600"
                            style={{ width: `${chart.shortlistRate}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
                          <span>Interview Rate</span>
                          <span>{chart.interviewRate}%</span>
                        </div>

                        <div className="h-2 rounded-full bg-white">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${chart.interviewRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              {/* Recent Job Postings */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-8">
                <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      Recent Job Postings
                    </h3>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Real job posting activity from your company account.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/company/jobs")}
                    className="inline-flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-600 transition hover:bg-brand-50"
                  >
                    View all jobs
                    <ChevronRight size={14} />
                  </button>
                </div>

                {recentJobs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <Briefcase className="mx-auto text-slate-400" size={30} />

                    <h4 className="mt-3 text-sm font-bold text-slate-800">
                      No job postings yet
                    </h4>

                    <p className="mx-auto mt-1 max-w-md text-sm font-medium leading-6 text-slate-500">
                      Once you post jobs, your recent job activity will appear
                      here using live backend data.
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate("/company/post-job")}
                      disabled={!stats.is_verified}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus size={16} />
                      Post Job
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          <th className="pb-3 pr-4">Role Name</th>
                          <th className="px-4 pb-3 text-center">Status</th>
                          <th className="px-4 pb-3 text-center">
                            Applications
                          </th>
                          <th className="pb-3 pl-4 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {recentJobs.map((job) => (
                          <tr
                            key={job.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="py-4 pr-4">
                              <p className="text-sm font-bold text-slate-900">
                                {job.title || job.job_title || "Untitled Job"}
                              </p>
                              <p className="mt-1 text-xs font-medium text-slate-500">
                                {job.location || "Location not added"}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                                {job.status || "active"}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-center text-sm font-extrabold text-slate-800">
                              {job.applications_count ||
                                job.applicants_count ||
                                0}
                            </td>

                            <td className="py-4 pl-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/company/applicants/${job.id}`)
                                }
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-600 transition hover:bg-brand-50"
                              >
                                View
                                <ArrowUpRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Applicants */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-4">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      New Applicants
                    </h3>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Latest applicants from backend.
                    </p>
                  </div>

                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
                    {recentApplicants.length} New
                  </span>
                </div>

                {recentApplicants.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <Users className="mx-auto text-slate-400" size={30} />

                    <h4 className="mt-3 text-sm font-bold text-slate-800">
                      No applicants yet
                    </h4>

                    <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                      Applicants will appear here after candidates apply to your
                      active job posts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentApplicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-transparent p-2 transition hover:border-slate-100 hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <ProfileAvatar
                            name={getApplicantName(applicant)}
                            size={34}
                            className="rounded-xl shadow-sm"
                          />

                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-bold text-slate-900">
                              {getApplicantName(applicant)}
                            </h4>

                            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                              {getApplicantRole(applicant)}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="inline-flex rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-600">
                            {applicant.status || "Applied"}
                          </span>

                          <p className="mt-1 text-[11px] font-bold text-slate-400">
                            {applicant.applied_at
                              ? new Date(
                                  applicant.applied_at
                                ).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;