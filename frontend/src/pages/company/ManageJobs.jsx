import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import axiosInstance from "../../api/axiosInstance";
import {
  Plus,
  Trash2,
  Users,
  Briefcase,
  Filter,
  ChevronRight,
  Search,
  MapPin,
  Calendar,
} from "lucide-react";

const ManageJobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await axiosInstance.get(
        `/jobs/company/my-jobs?${params.toString()}`
      );

      setJobs(response.data.items || []);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to fetch listed jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const handleDeletePrompt = (id) => {
    setSelectedJobId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/jobs/${selectedJobId}`);

      setToastType("success");
      setToastMsg("Job opening deleted successfully.");
      setDeleteModalOpen(false);
      setSelectedJobId(null);
      fetchJobs();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to delete job post.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";

    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getJobTitle = (job) => {
    return job.title || job.job_title || "Untitled Job";
  };

  const getApplicationsCount = (job) => {
    return job.applications_count || job.applicants_count || 0;
  };

  const renderSkills = (skills) => {
    if (!skills) return null;

    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((skill, index) => (
        <span
          key={`${skill}-${index}`}
          className="inline-flex max-w-full rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700"
        >
          {skill}
        </span>
      ));
  };

  return (
    <div className="min-h-screen w-full bg-slate-50/40">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Delete Job Opening"
          message="Are you sure you want to permanently delete this job post? Previous candidate applications linked to this job opening may also be affected."
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedJobId(null);
          }}
        />

        {/* Page Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                  <Briefcase size={24} />
                </div>

                <div className="min-w-0">
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                    <Briefcase size={14} className="shrink-0" />
                    <span className="truncate">Job Management</span>
                  </div>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Manage Active Job Postings
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                    Review backend job records, track applicants, and manage
                    openings created by your company.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/company/post-job")}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:w-auto"
              >
                <Plus size={16} />
                <span>Post a Job</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-brand-600 ring-1 ring-slate-200">
                <Filter size={18} />
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Job Listing Filters
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Filter job posts by current status and review live backend job
                  data.
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>

              <ChevronRight
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 rotate-90 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Posted Jobs
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {jobs.length} job{jobs.length !== 1 ? "s" : ""} found on this
                  page from backend.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/company/post-job")}
                className="inline-flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-600 transition hover:bg-brand-50"
              >
                Create another job
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8">
              <Loader message="Fetching listed jobs..." />
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="mx-auto text-slate-400" size={40} />

              <h3 className="mt-4 text-base font-bold text-slate-900">
                No Jobs Posted
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                Your company has not posted any job openings yet.
              </p>

              <button
                type="button"
                onClick={() => navigate("/company/post-job")}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
              >
                <Plus size={16} />
                Post a Job
              </button>
            </div>
          ) : (
            <>
              {/* Mobile / Tablet Card View */}
              <div className="grid gap-4 p-4 lg:hidden">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Briefcase size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                          {getJobTitle(job)}
                        </h4>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">
                            {job.job_type || "Job type not set"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">
                            {job.work_mode || "Work mode not set"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {job.required_skills && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {renderSkills(job.required_skills)}
                      </div>
                    )}

                    {job.salary_range && (
                      <p className="mt-3 text-xs font-bold text-emerald-700">
                        {job.salary_range}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Location
                        </p>
                        <div className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-700">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <span>{job.location || "Location not added"}</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Posted
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Calendar size={15} className="text-slate-400" />
                          <span>{formatDate(job.created_at)}</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Openings
                        </p>
                        <p className="mt-1 text-sm font-black text-brand-700">
                          {job.openings_count || 0}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Status
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={job.status || "active"} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/company/applicants/${job.id}`)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                        title="View applicants"
                      >
                        <Users size={14} />
                        Applicants ({getApplicationsCount(job)})
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePrompt(job.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                        title="Delete job"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>

                    <p className="mt-3 text-right text-[11px] font-semibold text-slate-400">
                      Last updated: {formatDate(job.updated_at)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1180px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[31%]" />
                    <col className="w-[15%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[22%]" />
                  </colgroup>

                  <thead className="bg-white">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Job Details
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Location
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                        Posted
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                        Openings
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="align-top transition hover:bg-slate-50/70"
                      >
                        {/* Job Details */}
                        <td className="px-5 py-5 align-top">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                              <Briefcase size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                                {getJobTitle(job)}
                              </h4>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">
                                  {job.job_type || "Job type not set"}
                                </span>

                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">
                                  {job.work_mode || "Work mode not set"}
                                </span>
                              </div>

                              {job.required_skills && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {renderSkills(job.required_skills)}
                                </div>
                              )}

                              {job.salary_range && (
                                <p className="mt-2 text-xs font-bold text-emerald-700">
                                  {job.salary_range}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-5 align-top">
                          <div className="flex min-w-0 items-start gap-2 text-sm font-semibold text-slate-600">
                            <MapPin
                              size={15}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />
                            <span className="break-words">
                              {job.location || "Location not added"}
                            </span>
                          </div>
                        </td>

                        {/* Posted */}
                        <td className="px-5 py-5 text-center align-top">
                          <div className="inline-flex items-center justify-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                            <Calendar size={13} className="shrink-0" />
                            <span>{formatDate(job.created_at)}</span>
                          </div>
                        </td>

                        {/* Openings */}
                        <td className="px-5 py-5 text-center align-top">
                          <div className="inline-flex min-w-10 items-center justify-center rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
                            {job.openings_count || 0}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-5 text-center align-top">
                          <div className="flex justify-center">
                            <StatusBadge status={job.status || "active"} />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-5 text-right align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/company/applicants/${job.id}`)
                              }
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                              title="View applicants"
                            >
                              <Users size={14} />
                              Applicants
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                                {getApplicationsCount(job)}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePrompt(job.id)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                              title="Delete job"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <p className="mt-2 text-right text-[11px] font-semibold text-slate-400">
                            Last updated: {formatDate(job.updated_at)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {jobs.length > 0 && (
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageJobs;