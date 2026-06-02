import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../../components/SearchBar";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import Toast from "../../components/Toast";
import axiosInstance from "../../api/axiosInstance";
import {
  MapPin,
  Briefcase,
  Calendar,
  ShieldCheck,
  Search,
  ArrowRight,
  Building2,
  IndianRupee,
  Filter,
} from "lucide-react";

const CompaniesAndJobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "6",
      });

      if (search.trim()) params.append("search", search.trim());
      if (location.trim()) params.append("location", location.trim());
      if (jobType) params.append("job_type", jobType);
      if (workMode) params.append("work_mode", workMode);

      const response = await axiosInstance.get(`/jobs?${params.toString()}`);

      setJobs(response.data.items || []);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to search jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, jobType, workMode]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchJobs();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not available";

    const date = new Date(dateStr);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderSkillPills = (skills) => {
    if (!skills) return null;

    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((skill, index) => (
        <span
          key={`${skill}-${index}`}
          className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700"
        >
          {skill}
        </span>
      ));
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Main Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                <Search size={24} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                  <ShieldCheck size={14} />
                  Verified Employer Network
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                  Browse Verified Companies & Active Jobs
                </h2>

                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                  Explore job opportunities from verified companies and apply to
                  roles that match your skills, location, and career goals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search / Filter Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-brand-600 ring-1 ring-slate-200">
              <Filter size={18} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Search & Filter Jobs
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Search by role, company, location, job type, and work mode.
              </p>
            </div>
          </div>

          <SearchBar
            searchQuery={search}
            onSearchChange={setSearch}
            locationQuery={location}
            onLocationChange={setLocation}
            jobTypeQuery={jobType}
            onJobTypeChange={setJobType}
            workModeQuery={workMode}
            onWorkModeChange={setWorkMode}
            onSearchSubmit={handleSearchSubmit}
          />
        </div>

        {/* Results Header */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Job Results
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {loading
                ? "Searching open opportunities..."
                : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} found on this page.`}
            </p>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Page {page} of {totalPages}
          </span>
        </div>

        {/* Job Results */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <Loader message="Searching open opportunities..." />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <EmptyState
              title="No Matching Openings"
              description="We couldn't find any job posts matching your criteria. Try adjusting your location, keywords, job type, or work mode."
              icon={Briefcase}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => navigate(`/candidate/jobs/${job.id}`)}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md sm:p-6"
                >
                  {/* Top */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                        {job.job_type || "Job"}
                      </span>

                      <h3 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-brand-700">
                        {job.title || "Untitled Job"}
                      </h3>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-brand-50 group-hover:text-brand-600">
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Building2 size={16} className="shrink-0 text-slate-400" />

                    <span className="truncate text-sm font-bold text-slate-700">
                      {job.company?.company_name || "Company not specified"}
                    </span>

                    {job.company?.is_verified && (
                      <ShieldCheck
                        size={15}
                        className="shrink-0 text-emerald-600"
                        title="Verified Company"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-4 space-y-2 text-sm font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="shrink-0 text-slate-400" />
                      <span className="truncate">
                        {job.location || "Remote"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase
                        size={15}
                        className="shrink-0 text-slate-400"
                      />
                      <span className="capitalize">
                        {job.job_type || "Not specified"} ·{" "}
                        {job.work_mode || "Work mode not specified"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar
                        size={15}
                        className="shrink-0 text-slate-400"
                      />
                      <span>Posted {formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  {job.required_skills && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {renderSkillPills(job.required_skills)}
                    </div>
                  )}

                  {/* Salary */}
                  <div className="mt-auto pt-5">
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee
                          size={16}
                          className="shrink-0 text-emerald-600"
                        />

                        <span className="text-sm font-extrabold text-emerald-700">
                          {job.salary_range || "Salary not disclosed"}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-brand-600 group-hover:underline">
                        View Details
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompaniesAndJobs;