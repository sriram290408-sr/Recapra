import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import Toast from "../../components/Toast";
import axiosInstance from "../../api/axiosInstance";
import {
  Activity,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Monitor,
  Phone,
  PieChart,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

const pct = (value, total) => {
  if (!total || Number(total) <= 0) return 0;
  return Math.min(100, Math.round((Number(value || 0) / Number(total)) * 100));
};

const fmt = (value) => Number(value || 0).toLocaleString();

const safeMax = (...values) => Math.max(...values.map((v) => Number(v || 0)), 1);

const formatTimestamp = (dateValue) => {
  if (!dateValue) return "—";

  try {
    return new Date(dateValue).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateValue;
  }
};

const getValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return 0;
};

const KpiCard = ({ icon: Icon, title, value, subtext, color = "brand" }) => {
  const colorMap = {
    brand: "bg-brand-50 text-brand-600 border-brand-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const iconClass = colorMap[color] || colorMap.brand;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            {fmt(value)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {subtext}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon size={18} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="p-5">{children}</div>
  </div>
);

const ProgressRow = ({ label, value, max, color = "bg-brand-600" }) => {
  const width = pct(value, max);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <span className="text-xs font-black text-slate-900">{fmt(value)}</span>
      </div>

      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    applied: "border-blue-200 bg-blue-50 text-blue-700",
    under_review: "border-amber-200 bg-amber-50 text-amber-700",
    need_improvement: "border-orange-200 bg-orange-50 text-orange-700",
    shortlisted: "border-indigo-200 bg-indigo-50 text-indigo-700",
    interview_scheduled: "border-violet-200 bg-violet-50 text-violet-700",
    selected: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const className = map[status] || "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${className}`}
    >
      {(status || "activity").replace(/_/g, " ")}
    </span>
  );
};

const AnalyticsGraphs = ({ overview, companyActivity, applicationPipeline }) => {
  const platformData = [
    {
      label: "Candidates",
      shortLabel: "Candidates",
      value: overview.total_candidates || 0,
    },
    {
      label: "Companies",
      shortLabel: "Companies",
      value: overview.total_companies || 0,
    },
    {
      label: "Jobs",
      shortLabel: "Jobs",
      value: overview.total_jobs || 0,
    },
    {
      label: "Applications",
      shortLabel: "Applications",
      value: overview.total_applications || 0,
    },
    {
      label: "Interviews",
      shortLabel: "Interviews",
      value: overview.total_interviews || 0,
    },
  ];

  const verificationData = [
    {
      label: "Pending",
      value: companyActivity.pending_verifications || 0,
      color: "#f59e0b",
    },
    {
      label: "Approved",
      value: companyActivity.approved_companies || 0,
      color: "#10b981",
    },
    {
      label: "Rejected",
      value: companyActivity.rejected_companies || 0,
      color: "#ef4444",
    },
  ];

  const pipelineTotal = Object.values(applicationPipeline || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const selectedCount = Number(applicationPipeline?.selected || 0);
  const interviewCount = Number(applicationPipeline?.interview_scheduled || 0);
  const rejectedCount = Number(applicationPipeline?.rejected || 0);
  const selectedRate = pct(selectedCount, pipelineTotal || 1);

  const maxPlatform = safeMax(...platformData.map((item) => item.value));
  const maxVerification = safeMax(...verificationData.map((item) => item.value));

  const linePoints = platformData
    .map((item, index) => {
      const x = 20 + index * 45;
      const y = 120 - (Number(item.value || 0) / maxPlatform) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <BarChart3 size={20} />
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              Platform Analytics Graphs
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Visual overview of platform growth, verification status, and
              application pipeline health.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-1 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
          <TrendingUp size={13} />
          Live Analytics
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Platform Growth Line */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Platform Growth Trend
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

            {platformData.map((item, index) => {
              const x = 20 + index * 45;
              const y = 120 - (Number(item.value || 0) / maxPlatform) * 90;

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

        {/* Verification Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Verification Status
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

            {verificationData.map((item, index) => {
              const height = (Number(item.value || 0) / maxVerification) * 90;
              const x = 35 + index * 58;
              const y = 120 - height;

              return (
                <g key={item.label}>
                  <rect
                    x={x}
                    y={y}
                    width="30"
                    height={height}
                    rx="5"
                    fill={item.color}
                  />
                  <text
                    x={x + 15}
                    y="136"
                    textAnchor="middle"
                    className="fill-slate-500 text-[8px] font-bold"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Application Pipeline Donut */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Application Pipeline
            </h4>
            <PieChart size={16} className="text-indigo-600" />
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-slate-200">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#10b981 ${selectedRate}%, #e2e8f0 0)`,
                }}
              />

              <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                <span className="text-2xl font-black text-slate-900">
                  {selectedRate}%
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Selected
                </span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <ProgressRow
                label="Selected"
                value={selectedCount}
                max={pipelineTotal || 1}
                color="bg-emerald-500"
              />
              <ProgressRow
                label="Interview Scheduled"
                value={interviewCount}
                max={pipelineTotal || 1}
                color="bg-violet-500"
              />
              <ProgressRow
                label="Rejected"
                value={rejectedCount}
                max={pipelineTotal || 1}
                color="bg-rose-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/admin/insights");
      setData(response.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load admin insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return <Loader fullPage message="Loading platform insights..." />;
  }

  const overview = data?.overview || {};
  const candidateReadiness = data?.candidate_readiness || {};
  const companyActivity = data?.company_activity || {};
  const jobActivity = data?.job_activity || {};
  const applicationPipeline = data?.application_pipeline || {};
  const interviewInsights = data?.interview_insights || {};
  const topHiringCompanies = data?.top_hiring_companies || [];
  const recentActivity = data?.recent_activity || [];

  const pipelineLabels = {
    applied: "Applied",
    under_review: "Under Review",
    need_improvement: "Needs Improvement",
    shortlisted: "Shortlisted",
    interview_scheduled: "Interview Scheduled",
    selected: "Selected",
    rejected: "Rejected",
  };

  const pipelineColors = {
    applied: "bg-blue-400",
    under_review: "bg-amber-400",
    need_improvement: "bg-orange-400",
    shortlisted: "bg-indigo-400",
    interview_scheduled: "bg-violet-500",
    selected: "bg-emerald-500",
    rejected: "bg-rose-400",
  };

  const maxPipeline = safeMax(...Object.values(applicationPipeline));

  const funnelSteps = [
    {
      label: "Registered Candidates",
      value: overview.total_candidates || 0,
      percent: 100,
      color: "bg-brand-600",
    },
    {
      label: "Completed Profiles",
      value: overview.completed_profiles || 0,
      percent: pct(overview.completed_profiles, overview.total_candidates),
      color: "bg-indigo-500",
    },
    {
      label: "Applications",
      value: overview.total_applications || 0,
      percent: pct(
        overview.total_applications,
        overview.completed_profiles || overview.total_candidates
      ),
      color: "bg-violet-500",
    },
    {
      label: "Interviews",
      value: overview.total_interviews || 0,
      percent: pct(overview.total_interviews, overview.total_applications),
      color: "bg-amber-500",
    },
    {
      label: "Selected",
      value: overview.selected_candidates || 0,
      percent: pct(overview.selected_candidates, overview.total_interviews),
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                  <BarChart3 size={24} />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                    <Activity size={14} />
                    Platform Analytics
                  </div>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    Admin Insights
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                    Track platform growth, hiring performance, candidate
                    readiness, company activity, applications, interviews, and
                    ATS analytics.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchInsights}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <KpiCard
            icon={Users}
            title="Total Candidates"
            value={overview.total_candidates}
            subtext="Registered candidates"
            color="indigo"
          />

          <KpiCard
            icon={UserCheck}
            title="Completed Profiles"
            value={overview.completed_profiles}
            subtext={`${pct(
              overview.completed_profiles,
              overview.total_candidates
            )}% profile readiness`}
            color="brand"
          />

          <KpiCard
            icon={Building2}
            title="Total Companies"
            value={overview.total_companies}
            subtext="Employer accounts"
            color="sky"
          />

          <KpiCard
            icon={ShieldCheck}
            title="Verified Companies"
            value={overview.verified_companies}
            subtext={`${pct(
              overview.verified_companies,
              overview.total_companies
            )}% verified`}
            color="emerald"
          />

          <KpiCard
            icon={Briefcase}
            title="Total Jobs"
            value={overview.total_jobs}
            subtext={`${overview.active_jobs || 0} active jobs`}
            color="violet"
          />

          <KpiCard
            icon={Send}
            title="Applications"
            value={overview.total_applications}
            subtext="Total applications"
            color="amber"
          />

          <KpiCard
            icon={Calendar}
            title="Interviews"
            value={overview.total_interviews}
            subtext={`${interviewInsights.upcoming_interviews || 0} upcoming`}
            color="brand"
          />

          <KpiCard
            icon={CheckCircle2}
            title="Selected"
            value={overview.selected_candidates}
            subtext="Candidates selected"
            color="emerald"
          />

          <KpiCard
            icon={Clock}
            title="Pending Audits"
            value={companyActivity.pending_verifications}
            subtext="Verification requests"
            color="amber"
          />

          <KpiCard
            icon={Award}
            title="ATS Phase"
            value="2"
            subtext="Analytics placeholder"
            color="slate"
          />
        </div>

        {/* Graphs */}
        <AnalyticsGraphs
          overview={overview}
          companyActivity={companyActivity}
          applicationPipeline={applicationPipeline}
        />

        {/* Funnel + Pipeline */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Platform Hiring Funnel"
            subtitle="Registered Candidates → Completed Profiles → Applications → Interviews → Selected"
            icon={TrendingUp}
          >
            <div className="space-y-1">
              {funnelSteps.map((step, index) => (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white shadow-sm ${step.color}`}
                    >
                      {step.percent}%
                    </div>
                    {index !== funnelSteps.length - 1 && (
                      <div className="mt-1 h-6 w-0.5 bg-slate-200" />
                    )}
                  </div>

                  <div className="flex-1 pb-2">
                    <p className="text-sm font-bold text-slate-800">
                      {step.label}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {fmt(step.value)} records
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Application Pipeline"
            subtitle="Application status breakdown"
            icon={Send}
          >
            <div className="space-y-4">
              {Object.entries(pipelineLabels).map(([key, label]) => (
                <ProgressRow
                  key={key}
                  label={label}
                  value={applicationPipeline[key] || 0}
                  max={maxPipeline}
                  color={pipelineColors[key]}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Candidate + Company */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Candidate Readiness"
            subtitle="Profile completion and portfolio readiness"
            icon={Users}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                    Average Completion
                  </p>
                  <p className="mt-1 text-2xl font-black text-indigo-800">
                    {candidateReadiness.average_profile_completion || 0}%
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                    100% Profiles
                  </p>
                  <p className="mt-1 text-2xl font-black text-emerald-800">
                    {fmt(candidateReadiness.profiles_100_percent)}
                  </p>
                </div>
              </div>

              <ProgressRow
                label="Resume Uploaded"
                value={candidateReadiness.resume_uploaded || 0}
                max={overview.total_candidates || 1}
                color="bg-brand-500"
              />

              <ProgressRow
                label="Portfolio Added"
                value={candidateReadiness.portfolio_added || 0}
                max={overview.total_candidates || 1}
                color="bg-violet-500"
              />

              <ProgressRow
                label="Incomplete Profiles"
                value={candidateReadiness.profiles_incomplete || 0}
                max={overview.total_candidates || 1}
                color="bg-rose-400"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Company Activity"
            subtitle="Verification and job posting status"
            icon={Building2}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
                    Pending
                  </p>
                  <p className="mt-1 text-xl font-black text-amber-900">
                    {fmt(companyActivity.pending_verifications)}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                    Approved
                  </p>
                  <p className="mt-1 text-xl font-black text-emerald-900">
                    {fmt(companyActivity.approved_companies)}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-rose-700">
                    Rejected
                  </p>
                  <p className="mt-1 text-xl font-black text-rose-900">
                    {fmt(companyActivity.rejected_companies)}
                  </p>
                </div>
              </div>

              <ProgressRow
                label="Companies With Jobs"
                value={companyActivity.companies_with_jobs || 0}
                max={overview.total_companies || 1}
                color="bg-brand-500"
              />

              <ProgressRow
                label="Companies Without Jobs"
                value={companyActivity.companies_without_jobs || 0}
                max={overview.total_companies || 1}
                color="bg-slate-400"
              />
            </div>
          </SectionCard>
        </div>

        {/* Jobs + Interviews */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Job Activity"
            subtitle="Active, paused, and closed job listings"
            icon={Briefcase}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Active" value={jobActivity.active_jobs} tone="emerald" />
                <MiniStat label="Paused" value={jobActivity.paused_jobs} tone="amber" />
                <MiniStat label="Closed" value={jobActivity.closed_jobs} tone="slate" />
              </div>

              <ProgressRow
                label="Active Jobs"
                value={jobActivity.active_jobs || 0}
                max={overview.total_jobs || 1}
                color="bg-emerald-500"
              />

              <ProgressRow
                label="Paused Jobs"
                value={jobActivity.paused_jobs || 0}
                max={overview.total_jobs || 1}
                color="bg-amber-400"
              />

              <ProgressRow
                label="Closed Jobs"
                value={jobActivity.closed_jobs || 0}
                max={overview.total_jobs || 1}
                color="bg-slate-400"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Interview Insights"
            subtitle="Scheduled interviews by mode"
            icon={Calendar}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
                    Total Interviews
                  </p>
                  <p className="mt-1 text-2xl font-black text-brand-800">
                    {fmt(interviewInsights.total_interviews)}
                  </p>
                </div>

                <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                    Upcoming
                  </p>
                  <p className="mt-1 text-2xl font-black text-violet-800">
                    {fmt(interviewInsights.upcoming_interviews)}
                  </p>
                </div>
              </div>

              <IconValueRow
                icon={Monitor}
                label="Online Interviews"
                value={interviewInsights.online_interviews}
              />

              <IconValueRow
                icon={Users}
                label="Face-to-face Interviews"
                value={interviewInsights.face_to_face_interviews}
              />

              <IconValueRow
                icon={Phone}
                label="Phone Interviews"
                value={interviewInsights.phone_interviews}
              />
            </div>
          </SectionCard>
        </div>

        {/* Top Hiring Companies */}
        <SectionCard
          title="Top Hiring Companies"
          subtitle="Companies ranked by hiring activity"
          icon={Award}
        >
          {topHiringCompanies.length === 0 ? (
            <p className="py-4 text-center text-sm font-semibold text-slate-400">
              No company hiring data available yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Rank
                    </th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Company
                    </th>
                    <th className="pb-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                      Jobs Posted
                    </th>
                    <th className="pb-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                      Applications
                    </th>
                    <th className="pb-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                      Interviews
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {topHiringCompanies.map((company, index) => {
                    const jobs = getValue(company.jobs_count, company.job_count);
                    const applications = getValue(
                      company.applications_count,
                      company.application_count
                    );
                    const interviews = getValue(
                      company.interviews_count,
                      company.interview_count
                    );

                    return (
                      <tr
                        key={`${company.company_name}-${index}`}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="py-3 pr-3 text-xs font-black text-slate-400">
                          #{index + 1}
                        </td>

                        <td className="py-3 text-sm font-bold text-slate-800">
                          {company.company_name || "Unnamed Company"}
                        </td>

                        <td className="py-3 text-center">
                          <Badge value={jobs} color="brand" />
                        </td>

                        <td className="py-3 text-center">
                          <Badge value={applications} color="indigo" />
                        </td>

                        <td className="py-3 text-center">
                          <Badge value={interviews} color="violet" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard
          title="Recent Platform Activity"
          subtitle="Latest platform movements"
          icon={Activity}
        >
          {recentActivity.length === 0 ? (
            <p className="py-4 text-center text-sm font-semibold text-slate-400">
              No recent platform activity recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, index) => {
                const title =
                  item.title ||
                  `${item.candidate_name || "Candidate"} applied to ${
                    item.job_title || "a job"
                  }`;

                const description =
                  item.description ||
                  `${item.company_name || "Company"} · ${formatTimestamp(
                    item.timestamp || item.created_at
                  )}`;

                return (
                  <div
                    key={`${title}-${index}`}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">
                        {title}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {description}
                      </p>
                    </div>

                    <StatusBadge status={item.status || item.type} />
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ATS Placeholder */}
        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 shadow-none">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
              <FileText size={20} />
            </div>

            <div>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Phase 2 Analytics
              </span>

              <h3 className="mt-2 text-sm font-bold text-slate-700">
                ATS Analytics Insights
              </h3>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                ATS score trends, resume match analysis, skill gap insights, and
                job-candidate match quality will appear here in Phase 2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, tone = "brand" }) => {
  const styles = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-800",
    brand: "border-brand-100 bg-brand-50 text-brand-800",
  };

  return (
    <div className={`rounded-xl border p-3 text-center ${styles[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-black">{fmt(value)}</p>
    </div>
  );
};

const IconValueRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <Icon size={15} className="text-brand-500" />
      {label}
    </div>

    <span className="text-sm font-black text-slate-900">{fmt(value)}</span>
  </div>
);

const Badge = ({ value, color = "brand" }) => {
  const styles = {
    brand: "bg-brand-50 text-brand-700",
    indigo: "bg-indigo-50 text-indigo-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-black ${
        styles[color] || styles.brand
      }`}
    >
      {fmt(value)}
    </span>
  );
};

export default AdminInsights;