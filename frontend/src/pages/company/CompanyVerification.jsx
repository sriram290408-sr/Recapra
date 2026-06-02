import React, { useState, useEffect } from "react";
import FileUploadInput from "../../components/FileUploadInput";
import FormInput from "../../components/FormInput";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import axiosInstance, { ASSET_BASE_URL } from "../../api/axiosInstance";
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Upload,
  Building2,
  FileCheck,
  Clock,
  FileText,
  ExternalLink,
  Hash,
  BadgeCheck,
  Calendar,
} from "lucide-react";

const CompanyVerification = () => {
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [gstNumber, setGstNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchVerificationData = async () => {
    try {
      setLoading(true);

      const [statusResponse, profileResponse] = await Promise.all([
        axiosInstance.get("/company/verification-status"),
        axiosInstance.get("/company/profile"),
      ]);

      setStatus(statusResponse.data);
      setProfile(profileResponse.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to fetch verification details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationData();
  }, []);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!gstNumber.trim() || !registrationNumber.trim() || !selectedFile) {
      setErrorMsg(
        "All fields are mandatory. Please provide GST, Registration and Document."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("gst_number", gstNumber);
      formData.append("registration_number", registrationNumber);
      formData.append("file", selectedFile);

      await axiosInstance.post("/company/verification", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setToastType("success");
      setToastMsg("Verification documents submitted successfully!");

      setGstNumber("");
      setRegistrationNumber("");
      setSelectedFile(null);
      setFormKey((prev) => prev + 1);

      fetchVerificationData();
    } catch (err) {
      const errDetail =
        err.response?.data?.detail || "Failed to submit verification details.";

      setToastType("error");
      setToastMsg(errDetail);
      setErrorMsg(errDetail);
    } finally {
      setSubmitting(false);
    }
  };

  const getDocuments = () => {
    if (!Array.isArray(profile?.verification_documents)) return [];

    return [...profile.verification_documents].sort(
      (a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0)
    );
  };

  const documents = getDocuments();
  const hasSubmittedDocuments = documents.length > 0;
  const isPendingReview = status?.verification_status === "pending";
  const isApproved = status?.verification_status === "approved";
  const isRejected = status?.verification_status === "rejected";

  const canSubmitDocuments =
    !isApproved && (!hasSubmittedDocuments || isRejected);

  const getNotice = () => {
    if (isPendingReview && hasSubmittedDocuments) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6 animate-fade-in">
          <div className="flex items-center gap-3 text-amber-800">
            <Shield size={20} className="shrink-0 text-amber-600" />
            <span className="text-sm font-semibold">
              Documents submitted. Waiting for admin review. Editing is disabled until admin decision.
            </span>
          </div>
        </div>
      );
    }
    if (isApproved) {
      return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6 animate-fade-in">
          <div className="flex items-center gap-3 text-emerald-800">
            <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
            <span className="text-sm font-semibold">
              Verification approved. Submitted documents are locked.
            </span>
          </div>
        </div>
      );
    }
    if (isRejected) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6 animate-fade-in">
          <div className="flex items-center gap-3 text-red-800">
            <ShieldAlert size={20} className="shrink-0 text-red-600" />
            <span className="text-sm font-semibold">
              Verification rejected. Please review the reason and resubmit corrected documents.
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const getDocumentUrl = (filePath) => {
    if (!filePath) return "";

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    return `${ASSET_BASE_URL}/${cleanPath}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not available";

    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Not available";

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getStatusCard = () => {
    if (!status) return null;

    if (status.verification_status === "approved") {
      return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <ShieldCheck size={34} />
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <ShieldCheck size={14} />
                Approved
              </div>

              <h3 className="mt-3 text-xl font-bold text-emerald-950">
                Corporate Account Verified
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-emerald-800">
                Your organization has been successfully verified. You now have
                access to job posting tools and applicant management workflows.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status.verification_status === "rejected") {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
              <ShieldAlert size={34} />
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                <ShieldAlert size={14} />
                Rejected
              </div>

              <h3 className="mt-3 text-xl font-bold text-red-950">
                Verification Request Rejected
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-red-800">
                Please review the admin reason, correct your GST/registration
                details, upload proper proof, and submit again.
              </p>

              <div className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                  Rejection Reason
                </p>

                <p className="mt-1 text-sm font-semibold italic leading-6 text-red-800">
                  "
                  {status.rejection_reason ||
                    "Incomplete registration documents."}
                  "
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
            <Shield size={34} className="animate-pulse" />
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              <Clock size={14} />
              Pending Review
            </div>

            <h3 className="mt-3 text-xl font-bold text-amber-950">
              Verification Awaiting Approval
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-amber-800">
              Your registration is currently being audited by the admin team.
              Verification usually completes within 24 hours.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmittedDocuments = () => {
    const documents = getDocuments();

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
              <FileText size={20} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Submitted Verification Documents
              </h3>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                View the GST number, registration number, and document already
                submitted from your company account.
              </p>
            </div>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <FileText className="mx-auto text-slate-400" size={32} />

              <h4 className="mt-3 text-sm font-bold text-slate-800">
                No submitted documents found
              </h4>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                After you upload GST, registration details, and proof document,
                they will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc, index) => {
              const documentUrl = getDocumentUrl(doc.file_path);

              return (
                <div key={doc.id || index} className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                    <InfoBox
                      icon={Hash}
                      label="GST / Tax Number"
                      value={doc.gst_number || "Not available"}
                    />

                    <InfoBox
                      icon={BadgeCheck}
                      label="Registration Number"
                      value={doc.registration_number || "Not available"}
                    />

                    <InfoBox
                      icon={Calendar}
                      label="Uploaded At"
                      value={formatDate(doc.uploaded_at)}
                    />

                    <InfoBox
                      icon={FileCheck}
                      label="File Size"
                      value={formatFileSize(doc.file_size)}
                    />
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Uploaded Document
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {doc.original_file_name || "Verification document"}
                        </p>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {doc.document_type ||
                            "company verification document"}
                        </p>
                      </div>

                      {documentUrl ? (
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 sm:w-auto"
                        >
                          View Document
                          <ExternalLink size={15} />
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">
                          File path not available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <Loader fullPage message="Accessing security vault status..." />;
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Main Heading Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <ShieldCheck size={24} />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                <Building2 size={14} />
                Company Verification
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                Company Trust Verification
              </h2>

              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Submit official business credentials to verify your company.
                Verified companies can post jobs, review applicants, and build
                candidate trust.
              </p>
            </div>
          </div>
        </div>

        {/* Status Section */}
        {getStatusCard()}

        {/* Notice Section */}
        {getNotice()}

        {/* Submitted Documents Section */}
        {renderSubmittedDocuments()}

        {/* Upload Form */}
        {status && canSubmitDocuments && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
                  <FileCheck size={20} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isRejected ? "Resubmit Verification Documents" : "Upload Verification Documents"}
                  </h3>

                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    Provide GST, registration details, and a valid proof file to
                    verify that this account represents a genuine business.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
              {errorMsg && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormInput
                  label="GSTIN / Corporate Tax Number"
                  id="gstNumber"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  required
                  disabled={submitting}
                />

                <FormInput
                  label="Business Registration Number"
                  id="registrationNumber"
                  placeholder="e.g. L01234MH2021PTC123456"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="mt-5">
                <FileUploadInput
                  key={formKey}
                  label="Incorporation Certificate / Tax Statement"
                  id="businessDoc"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  helperText="Allowed: PDF, JPG, JPEG, PNG. Max: 5 MB"
                  required
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Submit Verification Documents
                    </h4>

                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      Your request will be reviewed by the admin team after
                      submission.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={submitting || !selectedFile}
                  >
                    <Upload size={16} />
                    <span>
                      {submitting
                        ? "Uploading Credentials..."
                        : "Submit Verification Documents"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoBox = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-bold text-slate-800">
            {value || "Not available"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyVerification;