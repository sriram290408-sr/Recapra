import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../../components/FormInput";
import TextArea from "../../components/TextArea";
import SelectInput from "../../components/SelectInput";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import Button from "../../components/Button";
import ProfileAvatar from "../../components/ProfileAvatar";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Linkedin,
  Github,
  Globe,
  Link2,
  Edit2,
  Check,
  X,
  Award,
  ShieldAlert,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

const CandidateProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const [editBasic, setEditBasic] = useState(false);
  const [editPrefs, setEditPrefs] = useState(false);
  const [editLinks, setEditLinks] = useState(false);

  const [documents, setDocuments] = useState([]);

  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    phone: "",
    location: "",
    career_status: "active_seeking",
    job_loss_reason: "",
    target_job_role: "",
    preferred_job_type: "full-time",
    preferred_location: "",
    expected_salary: "",
    availability: "",
    notice_period: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    personal_website_url: "",
  });

  const [errors, setErrors] = useState({});

  const statusOptions = [
    { value: "active_seeking", label: "Actively Looking" },
    { value: "laid_off", label: "Laid Off" },
    { value: "career_break", label: "On a Career Break" },
    { value: "career_transition", label: "Transitioning to a New Domain" },
    { value: "employed_open", label: "Employed, but Open to Opportunities" },
  ];

  const typeOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "internship", label: "Internship" },
    { value: "contract", label: "Contractor / Freelancer" },
  ];

  const normalizeProfileData = (d) => ({
    full_name: d.full_name || "",
    bio: d.bio || "",
    phone: d.phone || "",
    location: d.location || "",
    career_status: d.career_status || "active_seeking",
    job_loss_reason: d.job_loss_reason || "",
    target_job_role: d.target_job_role || "",
    preferred_job_type: d.preferred_job_type || "full-time",
    preferred_location: d.preferred_location || "",
    expected_salary:
      d.expected_salary !== null && d.expected_salary !== undefined
        ? d.expected_salary.toString()
        : "",
    availability: d.availability || "",
    notice_period: d.notice_period || "",
    linkedin_url: d.linkedin_url || "",
    github_url: d.github_url || "",
    portfolio_url: d.portfolio_url || "",
    personal_website_url: d.personal_website_url || "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/candidate/profile");

      setFormData(normalizeProfileData(response.data));
      setDocuments(
        Array.isArray(response.data.documents) ? response.data.documents : []
      );
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load profile. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};

    if (!formData.full_name.trim()) {
      tempErrors.full_name = "Full Name is required.";
    }

    if (formData.expected_salary && isNaN(Number(formData.expected_salary))) {
      tempErrors.expected_salary = "Must be a valid number.";
    }

    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;

    if (formData.linkedin_url && !urlPattern.test(formData.linkedin_url)) {
      tempErrors.linkedin_url = "Invalid LinkedIn URL.";
    }

    if (formData.github_url && !urlPattern.test(formData.github_url)) {
      tempErrors.github_url = "Invalid GitHub URL.";
    }

    if (formData.portfolio_url && !urlPattern.test(formData.portfolio_url)) {
      tempErrors.portfolio_url = "Invalid Portfolio URL.";
    }

    if (
      formData.personal_website_url &&
      !urlPattern.test(formData.personal_website_url)
    ) {
      tempErrors.personal_website_url = "Invalid URL.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const hasResumeUploaded = () => {
    if (!Array.isArray(documents)) return false;

    return documents.some((doc) => {
      const type = String(doc.document_type || "").toLowerCase();
      const fileName = String(doc.original_file_name || "").toLowerCase();

      return type === "resume" || fileName.includes("resume");
    });
  };

  const hasPortfolioAdded = (data = formData) => {
    if (data.portfolio_url && String(data.portfolio_url).trim() !== "") {
      return true;
    }

    if (!Array.isArray(documents)) return false;

    return documents.some((doc) => {
      const type = String(doc.document_type || "").toLowerCase();
      const fileName = String(doc.original_file_name || "").toLowerCase();

      return type === "portfolio" || fileName.includes("portfolio");
    });
  };

  const calculateCompleteness = (data = formData) => {
    const checklist = [
      { key: "full_name", completed: Boolean(data.full_name?.trim()) },
      { key: "bio", completed: Boolean(data.bio?.trim()) },
      { key: "phone", completed: Boolean(data.phone?.trim()) },
      { key: "location", completed: Boolean(data.location?.trim()) },
      { key: "career_status", completed: Boolean(data.career_status?.trim()) },
      {
        key: "job_loss_reason",
        completed: Boolean(data.job_loss_reason?.trim()),
      },
      {
        key: "target_job_role",
        completed: Boolean(data.target_job_role?.trim()),
      },
      {
        key: "preferred_job_type",
        completed: Boolean(data.preferred_job_type?.trim()),
      },
      {
        key: "preferred_location",
        completed: Boolean(data.preferred_location?.trim()),
      },
      {
        key: "expected_salary",
        completed: Boolean(String(data.expected_salary || "").trim()),
      },
      { key: "availability", completed: Boolean(data.availability?.trim()) },
      { key: "notice_period", completed: Boolean(data.notice_period?.trim()) },
      { key: "linkedin_url", completed: Boolean(data.linkedin_url?.trim()) },
      { key: "github_url", completed: Boolean(data.github_url?.trim()) },
      { key: "portfolio", completed: hasPortfolioAdded(data) },
      { key: "resume", completed: hasResumeUploaded() },
    ];

    const completed = checklist.filter((item) => item.completed).length;

    return Math.round((completed / checklist.length) * 100);
  };

  const getMissingItems = () => {
    const items = [];

    if (!formData.full_name.trim()) items.push("Full name");
    if (!formData.bio.trim()) items.push("Professional bio");
    if (!formData.phone.trim()) items.push("Phone number");
    if (!formData.location.trim()) items.push("Location");
    if (!formData.job_loss_reason.trim()) {
      items.push("Career Context / Layoff Reason");
    }
    if (!formData.target_job_role.trim()) items.push("Target job role");
    if (!formData.preferred_location.trim()) items.push("Preferred location");
    if (!formData.expected_salary.trim()) items.push("Expected salary");
    if (!formData.availability.trim()) items.push("Availability");
    if (!formData.notice_period.trim()) items.push("Notice period");
    if (!formData.linkedin_url.trim()) items.push("LinkedIn URL");
    if (!formData.github_url.trim()) items.push("GitHub URL");
    if (!hasPortfolioAdded()) items.push("Portfolio link or portfolio document");
    if (!hasResumeUploaded()) items.push("Resume upload");

    return items;
  };

  const handleSaveSection = async (section) => {
    if (!validateForm()) {
      setToastType("error");
      setToastMsg("Please correct form errors before saving.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        expected_salary: formData.expected_salary
          ? parseFloat(formData.expected_salary)
          : null,
      };

      const response = await axiosInstance.put("/candidate/profile", payload);

      const normalizedData = normalizeProfileData(response.data);

      setFormData(normalizedData);

      if (Array.isArray(response.data.documents)) {
        setDocuments(response.data.documents);
      }

      const updatedCompletion = calculateCompleteness(normalizedData);

      setToastType("success");
      setToastMsg(
        `Profile updated successfully! Completion is now ${updatedCompletion}%.`
      );

      if (section === "basic") setEditBasic(false);
      if (section === "prefs") setEditPrefs(false);
      if (section === "links") setEditLinks(false);
    } catch (err) {
      setToastType("error");
      setToastMsg(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (val) => {
    const legacyLabels = {
      active_seeking: "Actively Looking",
      laid_off: "Laid Off",
      career_break: "On a Career Break",
      career_transition: "Transitioning to a New Domain",
      employed_open: "Employed, but Open to Opportunities",
    };

    return (
      statusOptions.find((option) => option.value === val)?.label ||
      legacyLabels[val] ||
      "Actively Looking"
    );
  };

  const getJobTypeLabel = (val) => {
    return (
      typeOptions.find((option) => option.value === val)?.label || "Full-time"
    );
  };

  const resumeUploaded = hasResumeUploaded();
  const portfolioAdded = hasPortfolioAdded();
  const completeness = calculateCompleteness();
  const isProfileComplete = completeness >= 100;
  const missingItems = getMissingItems();

  if (loading) {
    return <Loader fullPage message="Fetching profile details..." />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Toast
        message={toastMsg}
        type={toastType}
        onClose={() => setToastMsg("")}
      />

      {/* Header Card */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="shrink-0">
            <ProfileAvatar
              name={formData.full_name}
              size={90}
              className="rounded-full border-4 border-white shadow-md"
            />
          </div>

          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="flex flex-col items-center gap-2 md:flex-row">
              <h1 className="text-2xl font-bold text-slate-900">
                {formData.full_name || "New Candidate"}
              </h1>

              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                {getStatusLabel(formData.career_status)}
              </span>

              {isProfileComplete && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 size={12} />
                  Profile Completed
                </span>
              )}
            </div>

            <p className="max-w-2xl text-sm font-semibold leading-relaxed text-slate-600">
              {formData.bio ||
                "No professional summary added yet. Click edit below to add a brief bio detailing your technical background."}
            </p>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-1 text-xs font-bold text-slate-500 md:justify-start">
              {formData.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  {formData.location}
                </span>
              )}

              {formData.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  {formData.phone}
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                Joined Recapra
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Details */}
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <User size={18} className="text-brand-600" />
            Basic Details
          </h3>

          {!editBasic ? (
            <button
              type="button"
              onClick={() => setEditBasic(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-brand-200 hover:text-brand-600"
            >
              <Edit2 size={13} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSection("basic")}
                className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                <Check size={13} />
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditBasic(false);
                  fetchProfile();
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                disabled={submitting}
              >
                <X size={13} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {editBasic ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Full Name"
                id="full_name"
                placeholder="Alex Rivera"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                error={errors.full_name}
                required
                disabled={submitting}
              />

              <SelectInput
                label="Current Career Status"
                id="career_status"
                options={statusOptions}
                value={formData.career_status}
                onChange={(e) => handleChange("career_status", e.target.value)}
                required
                disabled={submitting}
              />

              <FormInput
                label="Phone Number"
                id="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={submitting}
              />

              <FormInput
                label="Location"
                id="location"
                placeholder="Chennai, Tamil Nadu"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                disabled={submitting}
              />
            </div>

            <TextArea
              label="Career Context / Layoff Reason"
              id="job_loss_reason"
              placeholder="Example: I was laid off due to company restructuring, and I am now actively looking for a Frontend Developer role."
              value={formData.job_loss_reason}
              onChange={(e) => handleChange("job_loss_reason", e.target.value)}
              disabled={submitting}
            />

            <TextArea
              label="Professional Bio"
              id="bio"
              placeholder="Describe your background and core technical values..."
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              disabled={submitting}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm font-semibold md:grid-cols-2">
              <InfoItem label="Full Name" value={formData.full_name} />
              <InfoItem
                label="Current Career Status"
                value={getStatusLabel(formData.career_status)}
              />
              <InfoItem label="Phone Number" value={formData.phone} />
              <InfoItem label="Location" value={formData.location} />
            </div>

            <div
              className={`flex gap-3 rounded-xl border p-4 ${formData.job_loss_reason
                  ? "border-amber-100 bg-amber-50 text-amber-900"
                  : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
            >
              <ShieldAlert
                size={18}
                className={`mt-0.5 shrink-0 ${formData.job_loss_reason
                    ? "text-amber-600"
                    : "text-slate-400"
                  }`}
              />

              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wide">
                  Career Context / Layoff Reason
                </h4>

                <p className="text-xs font-semibold leading-relaxed">
                  {formData.job_loss_reason ||
                    "Not added yet. Click Edit in Basic Details to add your career context or layoff reason."}
                </p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                Professional Bio
              </span>
              <p className="mt-1 leading-relaxed text-slate-700">
                {formData.bio || "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Career Preferences */}
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Briefcase size={18} className="text-brand-600" />
            Career Preferences
          </h3>

          {!editPrefs ? (
            <button
              type="button"
              onClick={() => setEditPrefs(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-brand-200 hover:text-brand-600"
            >
              <Edit2 size={13} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSection("prefs")}
                className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                <Check size={13} />
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditPrefs(false);
                  fetchProfile();
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                disabled={submitting}
              >
                <X size={13} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {editPrefs ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Target Job Role"
              id="target_job_role"
              placeholder="Frontend Developer"
              value={formData.target_job_role}
              onChange={(e) => handleChange("target_job_role", e.target.value)}
              disabled={submitting}
            />

            <SelectInput
              label="Preferred Job Type"
              id="preferred_job_type"
              options={typeOptions}
              value={formData.preferred_job_type}
              onChange={(e) =>
                handleChange("preferred_job_type", e.target.value)
              }
              disabled={submitting}
            />

            <FormInput
              label="Work Mode / Locations"
              id="preferred_location"
              placeholder="Remote, Chennai, Bengaluru"
              value={formData.preferred_location}
              onChange={(e) =>
                handleChange("preferred_location", e.target.value)
              }
              disabled={submitting}
            />

            <FormInput
              label="Expected Salary"
              id="expected_salary"
              placeholder="600000"
              value={formData.expected_salary}
              onChange={(e) => handleChange("expected_salary", e.target.value)}
              error={errors.expected_salary}
              disabled={submitting}
            />

            <FormInput
              label="Availability"
              id="availability"
              placeholder="Immediate"
              value={formData.availability}
              onChange={(e) => handleChange("availability", e.target.value)}
              disabled={submitting}
            />

            <FormInput
              label="Notice Period"
              id="notice_period"
              placeholder="15 days"
              value={formData.notice_period}
              onChange={(e) => handleChange("notice_period", e.target.value)}
              disabled={submitting}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-sm font-semibold md:grid-cols-3">
            <InfoItem label="Target Job Role" value={formData.target_job_role} />
            <InfoItem
              label="Preferred Job Type"
              value={getJobTypeLabel(formData.preferred_job_type)}
            />
            <InfoItem label="Work Mode" value={formData.preferred_location} />
            <InfoItem
              label="Expected Salary"
              value={
                formData.expected_salary
                  ? `₹${parseFloat(formData.expected_salary).toLocaleString()} / year`
                  : "—"
              }
            />
            <InfoItem label="Availability" value={formData.availability} />
            <InfoItem label="Notice Period" value={formData.notice_period} />
          </div>
        )}
      </div>

      {/* External Links */}
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Link2 size={18} className="text-brand-600" />
            External Links & Portfolio
          </h3>

          {!editLinks ? (
            <button
              type="button"
              onClick={() => setEditLinks(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-brand-200 hover:text-brand-600"
            >
              <Edit2 size={13} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveSection("links")}
                className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                <Check size={13} />
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditLinks(false);
                  fetchProfile();
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                disabled={submitting}
              >
                <X size={13} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {editLinks ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="LinkedIn Profile URL"
              id="linkedin_url"
              placeholder="https://linkedin.com/in/username"
              value={formData.linkedin_url}
              onChange={(e) => handleChange("linkedin_url", e.target.value)}
              error={errors.linkedin_url}
              disabled={submitting}
            />

            <FormInput
              label="Portfolio URL"
              id="portfolio_url"
              placeholder="https://yourportfolio.com"
              value={formData.portfolio_url}
              onChange={(e) => handleChange("portfolio_url", e.target.value)}
              error={errors.portfolio_url}
              disabled={submitting}
            />

            <FormInput
              label="GitHub Profile URL"
              id="github_url"
              placeholder="https://github.com/username"
              value={formData.github_url}
              onChange={(e) => handleChange("github_url", e.target.value)}
              error={errors.github_url}
              disabled={submitting}
            />

            <FormInput
              label="Other Professional Link URL"
              id="personal_website_url"
              placeholder="https://medium.com/@username"
              value={formData.personal_website_url}
              onChange={(e) =>
                handleChange("personal_website_url", e.target.value)
              }
              error={errors.personal_website_url}
              disabled={submitting}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LinkCard
              icon={Linkedin}
              label="LinkedIn Profile"
              value={formData.linkedin_url}
              iconClass="bg-blue-50 text-blue-600"
            />

            <LinkCard
              icon={Globe}
              label="Personal Portfolio"
              value={formData.portfolio_url}
              iconClass="bg-teal-50 text-teal-600"
              completed={portfolioAdded}
            />

            <LinkCard
              icon={Github}
              label="GitHub Profile"
              value={formData.github_url}
              iconClass="bg-slate-100 text-slate-800"
            />

            <LinkCard
              icon={Link2}
              label="Other Professional Link"
              value={formData.personal_website_url}
              iconClass="bg-indigo-50 text-indigo-600"
            />
          </div>
        )}
      </div>

      {/* Resume & Portfolio Tracking */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TrackingCard
          icon={FileText}
          title="Resume Upload"
          completed={resumeUploaded}
          completedText="Resume uploaded and linked to your profile."
          pendingText="Resume is not uploaded yet."
          actionText={resumeUploaded ? "Update Resume" : "Upload Resume"}
          onClick={() => navigate("/candidate/documents")}
        />

        <TrackingCard
          icon={Globe}
          title="Portfolio"
          completed={portfolioAdded}
          completedText="Portfolio is linked to your profile."
          pendingText="Portfolio is not added yet."
          actionText={portfolioAdded ? "Update Portfolio" : "Add Portfolio"}
          onClick={() => {
            setEditLinks(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>

      {/* Completion Card - hidden after 100% */}
      {!isProfileComplete && (
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6 md:flex-row md:text-left">
          <div className="w-full flex-1 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <Award size={18} className="text-brand-600" />
                Your Profile is {completeness}% Complete
              </span>

              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <AlertCircle size={13} />
                {missingItems.length} item
                {missingItems.length !== 1 ? "s" : ""} remaining
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {missingItems.slice(0, 6).map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600"
                >
                  {item}
                </span>
              ))}

              {missingItems.length > 6 && (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  +{missingItems.length - 6} more
                </span>
              )}
            </div>

            <p className="text-xs font-semibold leading-snug text-slate-400">
              Resume, portfolio, career status, and career context are tracked
              from your actual profile data. Once all required items are
              complete, this completion bar will disappear automatically.
            </p>
          </div>

          <Button
            onClick={() => navigate("/candidate/documents")}
            variant="primary"
            icon={ArrowRight}
            iconPosition="right"
            className="shrink-0 rounded-xl bg-brand-600 py-2.5 text-xs font-bold hover:bg-brand-700"
          >
            Manage Resume & Portfolio
          </Button>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span className="mt-1 block text-slate-800">{value || "—"}</span>
  </div>
);

const LinkCard = ({
  icon: Icon,
  label,
  value,
  iconClass,
  completed = false,
}) => {
  const displayValue = value ? value.replace(/^https?:\/\//, "") : "Not Added";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition hover:bg-slate-50">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>

        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="block max-w-[260px] truncate text-xs font-bold text-slate-700 hover:text-brand-600"
          >
            {displayValue}
          </a>
        ) : (
          <span className="block text-xs font-bold text-slate-400">
            Not Added
          </span>
        )}
      </div>

      {completed && (
        <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
      )}
    </div>
  );
};

const TrackingCard = ({
  icon: Icon,
  title,
  completed,
  completedText,
  pendingText,
  actionText,
  onClick,
}) => {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${completed
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
        }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white ${completed ? "text-emerald-600" : "text-amber-600"
            }`}
        >
          {completed ? <CheckCircle2 size={24} /> : <Icon size={24} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${completed
                  ? "bg-white text-emerald-700"
                  : "bg-white text-amber-700"
                }`}
            >
              {completed ? "Completed" : "Pending"}
            </span>
          </div>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
            {completed ? completedText : pendingText}
          </p>

          <button
            type="button"
            onClick={onClick}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            {actionText}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;