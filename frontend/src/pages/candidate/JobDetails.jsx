import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import Toast from "../../components/Toast";
import TextArea from "../../components/TextArea";
import axiosInstance from "../../api/axiosInstance";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Calendar,
  ShieldCheck,
  Send,
  Building2,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ClipboardList,
  Users,
  FileText,
  ArrowRight,
} from "lucide-react";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchJobDetails = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get(`/jobs/${id}`);
      setJob(response.data);

      const appResponse = await axiosInstance.get(
        "/applications/my-applications"
      );

      const matched = (appResponse.data.items || []).some(
        (app) => app.job_id === parseInt(id)
      );

      setHasApplied(matched);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load job details. Redirecting...");

      setTimeout(() => navigate("/candidate/jobs"), 1500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();

    setApplying(true);

    try {
      await axiosInstance.post(`/applications/apply/${id}`, {
        cover_letter: coverLetter,
      });

      setToastType("success");
      setToastMsg("Application submitted successfully!");
      setHasApplied(true);
      setCoverLetter("");
    } catch (err) {
      setToastType("error");
      setToastMsg(
        err.response?.data?.detail || "Failed to submit application."
      );
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";

    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderSkills = (skills) => {
    if (!skills) return null;

    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .map((skill, index) => (
        <span
          key={`${skill}-${index}`}
          className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"
        >
          {skill}
        </span>
      ));
  };

  if (loading) {
    return <Loader fullPage message="Accessing job records..." />;
  }

  if (!job) return null;

  const canApply = job.status === "active" && job.company?.is_verified;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Back Button */}
        <div>
          <button
            type="button"
            onClick={() => navigate("/candidate/jobs")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <ArrowLeft size={16} />
            Back to Jobs
          </button>
        </div>

        {/* Hero Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                  <Briefcase size={28} />
                </div>

                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                    <Briefcase size={14} />
                    Job Opportunity
                  </div>

                  <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    {job.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700">
                      <Building2 size={15} className="text-slate-400" />
                      {job.company?.company_name || "Company not specified"}
                    </span>

                    {job.company?.is_verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                        <ShieldCheck size={14} />
                        Verified Employer
                      </span>
                    )}

                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                        job.status === "active"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {job.status || "Status not available"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-left lg:text-right">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700 lg:justify-end">
                  <IndianRupee size={14} />
                  Salary Range
                </p>
                <p className="mt-1 text-lg font-black text-emerald-800">
                  {job.salary_range || "Not disclosed"}
                </p>
              </div>
            </div>

            {/* Meta Row */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetaCard
                icon={MapPin}
                label="Location"
                value={job.location || "Remote"}
              />
              <MetaCard
                icon={Briefcase}
                label="Job Type"
                value={`${job.job_type || "Not specified"} · ${
                  job.work_mode || "Work mode not set"
                }`}
              />
              <MetaCard
                icon={Users}
                label="Openings"
                value={job.openings_count || 0}
              />
              <MetaCard
                icon={Calendar}
                label="Posted On"
                value={formatDate(job.created_at)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-8">
            <JobSection
              icon={FileText}
              title="Role Description"
              description="Understand the responsibilities, expectations, and daily activities for this position."
            >
              <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
                {job.description}
              </p>
            </JobSection>

            {job.requirements && (
              <JobSection
                icon={ClipboardList}
                title="Role Requirements"
                description="Review the technical, academic, and experience requirements for this role."
              >
                <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
                  {job.requirements}
                </p>
              </JobSection>
            )}

            {job.required_skills && (
              <JobSection
                icon={CheckCircle2}
                title="Required Skills"
                description="These skills are mentioned by the employer for this opening."
              >
                <div className="flex flex-wrap gap-2">
                  {renderSkills(job.required_skills)}
                </div>
              </JobSection>
            )}

            {(job.experience_required || job.education_required) && (
              <JobSection
                icon={Briefcase}
                title="Eligibility Details"
                description="Experience and education expectations provided by the company."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailBox
                    label="Experience Required"
                    value={job.experience_required || "Not specified"}
                  />
                  <DetailBox
                    label="Education Required"
                    value={job.education_required || "Not specified"}
                  />
                </div>
              </JobSection>
            )}

            {job.selection_process && (
              <JobSection
                icon={ClipboardList}
                title="Selection Process & Interview Stages"
                description="Know how the company plans to evaluate applicants."
              >
                <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
                  {job.selection_process}
                </p>
              </JobSection>
            )}
          </div>

          {/* Apply Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              {hasApplied ? (
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={34} />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-emerald-700">
                    Application Submitted
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    You have already applied for this opening. Track your
                    application status from your applications page.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/candidate/applications")}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    View My Applications
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply}>
                  <div className="mb-5 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      Apply for This Role
                    </h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                      Submit your candidate profile and optional cover letter to
                      this employer.
                    </p>
                  </div>

                  <TextArea
                    label="Cover Letter / Introduction Statement"
                    id="coverLetter"
                    placeholder="Introduce yourself, explain your career transition context, and describe why you are a good fit..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    disabled={applying}
                  />

                  {!canApply && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <div className="flex gap-2">
                        <AlertTriangle
                          size={17}
                          className="mt-0.5 shrink-0 text-red-600"
                        />
                        <p className="text-sm font-semibold leading-6 text-red-700">
                          This job cannot receive applications because the
                          employer is unverified or the job post is inactive.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={applying || !canApply}
                  >
                    <Send size={16} />
                    <span>
                      {applying
                        ? "Submitting Application..."
                        : "Submit Application"}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetaCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-brand-600">
        <Icon size={17} />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-bold capitalize text-slate-800">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const JobSection = ({ icon: Icon, title, description, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
          <Icon size={20} />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>

    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

const DetailBox = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
  </div>
);

export default JobDetails;