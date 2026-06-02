import React, { useState, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge";
import Pagination from "../../components/Pagination";
import FormInput from "../../components/FormInput";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import axiosInstance, { ASSET_BASE_URL } from "../../api/axiosInstance";
import {
  Check,
  X,
  FileText,
  ShieldCheck,
  Building2,
  ClipboardCheck,
  AlertTriangle,
  ExternalLink,
  Mail,
  Users,
  BadgeCheck,
} from "lucide-react";

const CompanyVerificationManagement = () => {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      const response = await axiosInstance.get(
        `/admin/companies/pending?${params.toString()}`
      );

      setPendingCompanies(response.data.items || []);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load verification audits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCompanies();
  }, [page]);

  const handleApprove = async (companyId) => {
    setActioning(true);

    try {
      await axiosInstance.put(`/admin/companies/${companyId}/approve`);
      setToastType("success");
      setToastMsg("Organization successfully approved and verified!");
      fetchPendingCompanies();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to approve company.");
    } finally {
      setActioning(false);
    }
  };

  const handleRejectPrompt = (companyId) => {
    setSelectedCompId(companyId);
    setRejectionReason("");
    setErrorMsg("");
    setRejectOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      setErrorMsg("Please specify a rejection reason.");
      return;
    }

    setActioning(true);

    try {
      await axiosInstance.put(`/admin/companies/${selectedCompId}/reject`, {
        rejection_reason: rejectionReason,
      });

      setToastType("success");
      setToastMsg("Company verification request rejected successfully.");
      setRejectOpen(false);
      setSelectedCompId(null);
      setRejectionReason("");
      fetchPendingCompanies();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to reject company verification.");
    } finally {
      setActioning(false);
    }
  };

  const closeRejectModal = () => {
    if (actioning) return;

    setRejectOpen(false);
    setSelectedCompId(null);
    setRejectionReason("");
    setErrorMsg("");
  };

  const getDocumentUrl = (path) => {
    if (!path) return "#";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return `${ASSET_BASE_URL}/${path}`;
  };

  if (loading) {
    return <Loader fullPage message="Loading verification audits..." />;
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Rejection Modal */}
        {rejectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
            <form
              onSubmit={handleRejectSubmit}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                      <AlertTriangle size={20} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Reject Verification Request
                      </h3>
                      <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
                        Provide a clear reason so the company can resubmit
                        corrected documents.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeRejectModal}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                    disabled={actioning}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {errorMsg && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {errorMsg}
                  </div>
                )}

                <FormInput
                  label="Audit Statement / Reason for Rejection"
                  id="rejectionReason"
                  placeholder="e.g. Uploaded document is blurred, GSTIN does not match corporate identity..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setErrorMsg("");
                  }}
                  required
                  disabled={actioning}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={actioning}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={actioning}
                >
                  <X size={16} />
                  {actioning ? "Submitting..." : "Reject Organization"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Page Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                <ShieldCheck size={24} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                  <ClipboardCheck size={14} />
                  Verification Audits
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                  Organization Verifications Queue
                </h2>

                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                  Review company details, verify submitted credentials, inspect
                  proof documents, and approve or reject hiring privileges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <FileText size={18} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pending Audit Queue
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {pendingCompanies.length} request
                  {pendingCompanies.length !== 1 ? "s" : ""} shown on this
                  page.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              Page {page} of {totalPages}
            </span>
          </div>
        </div>

        {/* Verification Cards */}
        <div className="space-y-5">
          {pendingCompanies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <ShieldCheck className="mx-auto text-slate-400" size={40} />

              <h3 className="mt-4 text-base font-bold text-slate-900">
                Verification Queue Clear
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                There are currently no pending corporate verification audits.
              </p>
            </div>
          ) : (
            pendingCompanies.map((company) => (
              <div
                key={company.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Card Header */}
                <div className="border-b border-slate-200 bg-slate-50/80 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                        <Building2 size={24} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {company.company_name || "Unnamed Company"}
                          </h3>

                          <StatusBadge
                            status={company.verification_status || "pending"}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                            {company.industry || "Industry N/A"}
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                            <Users size={13} />
                            Size: {company.company_size || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(company.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={actioning}
                        title="Approve verification"
                      >
                        <Check size={16} />
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectPrompt(company.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={actioning}
                        title="Reject verification"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-3">
                  {/* HR Details */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Mail size={17} className="text-brand-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        HR Representative
                      </h4>
                    </div>

                    <p className="text-sm font-bold text-slate-800">
                      {company.hr_name || "N/A"}
                    </p>

                    <p className="mt-1 break-all text-sm font-medium text-slate-500">
                      {company.hr_email || "Email not available"}
                    </p>
                  </div>

                  {/* Credentials */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <BadgeCheck size={17} className="text-brand-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Credentials Audit
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          GSTIN / Tax Number
                        </p>
                        <p className="mt-1 break-all text-sm font-bold text-slate-800">
                          {company.gst_number || "Pending"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Registration Number
                        </p>
                        <p className="mt-1 break-all text-sm font-bold text-slate-800">
                          {company.registration_number || "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Proof Document */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText size={17} className="text-brand-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Document Proof
                      </h4>
                    </div>

                    {company.doc_path ? (
                      <a
                        href={getDocumentUrl(company.doc_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <FileText size={16} />
                        View Proof Document
                        <ExternalLink size={13} className="text-slate-400" />
                      </a>
                    ) : (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
                        <p className="text-sm font-bold text-red-700">
                          No Proof File Uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pendingCompanies.length > 0 && (
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

export default CompanyVerificationManagement;