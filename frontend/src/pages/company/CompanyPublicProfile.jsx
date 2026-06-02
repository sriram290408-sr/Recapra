import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import Toast from "../../components/Toast";
import axiosInstance from "../../api/axiosInstance";
import {
  ShieldCheck,
  Globe,
  MapPin,
  Briefcase,
  Calendar,
  Building2,
  Users,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const CompanyPublicProfile = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchProfileAndJobs = async () => {
    try {
      setLoading(true);

      const profileResponse = await axiosInstance.get(
        `/company/public/${companyId}`
      );

      setCompany(profileResponse.data);

      const companyName = encodeURIComponent(
        profileResponse.data.company_name || ""
      );

      const jobsResponse = await axiosInstance.get(`/jobs?search=${companyName}`);
      setJobs(jobsResponse.data.items || []);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load company profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndJobs();
  }, [companyId]);

  const openWebsite = (url) => {
    if (!url) return "#";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    return `https://${url}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;

    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return <Loader fullPage message="Fetching corporate profile..." />;
  }

  if (!company) {
    return (
      <div className="w-full">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Toast
            message={toastMsg}
            type={toastType}
            onClose={() => setToastMsg("")}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <Building2 className="mx-auto text-slate-400" size={36} />
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Company profile not available
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              The requested company profile could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Company Hero Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                  <Building2 size={28} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      {company.company_name}
                    </h1>

                    {company.is_verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                        <ShieldCheck size={14} />
                        Verified Employer
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                      <Briefcase size={14} className="text-slate-400" />
                      {company.industry || "Industry not specified"}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                      <Users size={14} className="text-slate-400" />
                      {company.company_size || "Company size not specified"}
                    </span>

                    {company.location && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {company.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {company.website && (
                <a
                  href={openWebsite(company.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:w-auto"
                >
                  <Globe size={16} />
                  Website
                  <ExternalLink size={13} className="text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {company.description && (
            <div className="border-t border-slate-200 p-5 sm:p-6 lg:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Building2 size={20} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Company Mission & Overview
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    Public organization information for candidates.
                  </p>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
                {company.description}
              </p>
            </div>
          )}
        </div>

        {/* Open Positions Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Briefcase size={20} />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Active Openings
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Explore available career opportunities posted by{" "}
                  <span className="font-bold text-slate-700">
                    {company.company_name}
                  </span>
                  .
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
              {jobs.length} opening{jobs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Jobs */}
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <Briefcase className="mx-auto text-slate-400" size={38} />

            <h4 className="mt-4 text-base font-bold text-slate-900">
              No Active Openings
            </h4>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
              There are no active job postings for this company at the moment.
              Please check again later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => navigate(`/candidate/jobs/${job.id}`)}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                      {job.job_type || "Job"}
                    </span>

                    <h4 className="mt-3 line-clamp-2 text-base font-bold text-slate-900 group-hover:text-brand-700">
                      {job.title}
                    </h4>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-brand-50 group-hover:text-brand-600">
                    <ArrowRight size={17} />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-slate-400" />
                    <span>{job.location || "Remote"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase size={15} className="text-slate-400" />
                    <span>{job.work_mode || "Work mode not specified"}</span>
                  </div>

                  {job.last_date_to_apply && (
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-slate-400" />
                      <span>Apply by {formatDate(job.last_date_to_apply)}</span>
                    </div>
                  )}
                </div>

                {job.salary_range && (
                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                    {job.salary_range}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyPublicProfile;