import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../../components/FormInput";
import TextArea from "../../components/TextArea";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import axiosInstance from "../../api/axiosInstance";
import {
  Building2,
  Mail,
  UserRound,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Users,
  Save,
  ArrowLeft,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

const CompanyProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    hr_name: "",
    hr_email: "",
    contact_number: "",
    website: "",
    linkedin_page: "",
    location: "",
    industry: "",
    company_type: "",
    company_size: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/company/profile");
      const d = response.data;

      setFormData({
        company_name: d.company_name || "",
        company_email: d.company_email || "",
        hr_name: d.hr_name || "",
        hr_email: d.hr_email || "",
        contact_number: d.contact_number || "",
        website: d.website || "",
        linkedin_page: d.linkedin_page || "",
        location: d.location || "",
        industry: d.industry || "",
        company_type: d.company_type || "",
        company_size: d.company_size || "",
        description: d.description || "",
      });
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

    if (!formData.company_name.trim()) {
      tempErrors.company_name = "Company Name is required.";
    }

    if (!formData.company_email.trim()) {
      tempErrors.company_email = "Company Email is required.";
    }

    if (!formData.hr_name.trim()) {
      tempErrors.hr_name = "HR Name is required.";
    }

    if (!formData.hr_email.trim()) {
      tempErrors.hr_email = "HR Email is required.";
    }

    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;

    if (formData.website && !urlPattern.test(formData.website)) {
      tempErrors.website = "Please enter a valid website URL.";
    }

    if (formData.linkedin_page && !urlPattern.test(formData.linkedin_page)) {
      tempErrors.linkedin_page = "Please enter a valid LinkedIn page URL.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setToastType("error");
      setToastMsg("Please correct form errors before saving.");
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.put("/company/profile", formData);
      setToastType("success");
      setToastMsg("Company profile details updated successfully!");
      fetchProfile();
    } catch (err) {
      setToastType("error");
      setToastMsg(
        err.response?.data?.detail || "Failed to update company profile."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullPage message="Fetching company registry details..." />;
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                  <Building2 size={24} />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck size={14} />
                    Company Profile
                  </div>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    Company & Corporate Registry
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                    Maintain company identity, HR contact details, organization
                    profile, and public hiring information.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/company/dashboard")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:w-auto"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Identity */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeadingCard
              icon={Building2}
              title="Company Identity"
              description="Official company information shown across job posts and recruiter workflows."
            />

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormInput
                  label="Company Name"
                  id="company_name"
                  placeholder="Official company name"
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  error={errors.company_name}
                  required
                  disabled={submitting}
                  icon={Building2}
                />

                <FormInput
                  label="Corporate Contact Email"
                  id="company_email"
                  type="email"
                  placeholder="e.g. corporate@company.com"
                  value={formData.company_email}
                  onChange={(e) => handleChange("company_email", e.target.value)}
                  error={errors.company_email}
                  required
                  disabled={submitting}
                  icon={Mail}
                />

                <FormInput
                  label="Registry Contact Phone"
                  id="contact_number"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.contact_number}
                  onChange={(e) =>
                    handleChange("contact_number", e.target.value)
                  }
                  disabled={submitting}
                  icon={Phone}
                />

                <FormInput
                  label="HQ Location"
                  id="location"
                  placeholder="e.g. Chennai, Tamil Nadu"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  disabled={submitting}
                  icon={MapPin}
                />
              </div>
            </div>
          </section>

          {/* HR Contact */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeadingCard
              icon={UserRound}
              title="HR Contact"
              description="Primary recruiter or company representative details used for hiring communication."
            />

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormInput
                  label="HR / Representative Name"
                  id="hr_name"
                  placeholder="Name of contact person"
                  value={formData.hr_name}
                  onChange={(e) => handleChange("hr_name", e.target.value)}
                  error={errors.hr_name}
                  required
                  disabled={submitting}
                  icon={UserRound}
                />

                <FormInput
                  label="HR Contact Email"
                  id="hr_email"
                  type="email"
                  placeholder="e.g. hr@company.com"
                  value={formData.hr_email}
                  onChange={(e) => handleChange("hr_email", e.target.value)}
                  error={errors.hr_email}
                  required
                  disabled={submitting}
                  icon={Mail}
                />
              </div>
            </div>
          </section>

          {/* Company Details */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeadingCard
              icon={Briefcase}
              title="Company Details"
              description="Help candidates understand your company domain, size, category, and digital presence."
            />

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormInput
                  label="Website Address"
                  id="website"
                  placeholder="https://company.com"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  error={errors.website}
                  disabled={submitting}
                  icon={Globe}
                />

                <FormInput
                  label="LinkedIn Page URL"
                  id="linkedin_page"
                  placeholder="https://linkedin.com/company/name"
                  value={formData.linkedin_page}
                  onChange={(e) =>
                    handleChange("linkedin_page", e.target.value)
                  }
                  error={errors.linkedin_page}
                  disabled={submitting}
                  icon={Linkedin}
                />

                <FormInput
                  label="Industry Domain"
                  id="industry"
                  placeholder="e.g. IT Services, SaaS, Healthcare"
                  value={formData.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  disabled={submitting}
                  icon={Briefcase}
                />

                <FormInput
                  label="Company Size"
                  id="company_size"
                  placeholder="e.g. 50-100 employees"
                  value={formData.company_size}
                  onChange={(e) => handleChange("company_size", e.target.value)}
                  disabled={submitting}
                  icon={Users}
                />

                <FormInput
                  label="Company Type"
                  id="company_type"
                  placeholder="e.g. Private, Public, Startup, MNC"
                  value={formData.company_type}
                  onChange={(e) => handleChange("company_type", e.target.value)}
                  disabled={submitting}
                  icon={Building2}
                />
              </div>

              <div className="mt-5">
                <TextArea
                  label="Company Overview"
                  id="description"
                  placeholder="Tell candidates about your company, work culture, hiring focus, growth opportunities, and why they should apply..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>

          {/* Save Button Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Save Corporate Details
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Click the button to update your company profile information.
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={submitting}
              >
                <Save size={16} />
                <span>
                  {submitting ? "Saving Profile..." : "Save Corporate Details"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const SectionHeadingCard = ({ icon: Icon, title, description }) => {
  return (
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
  );
};

export default CompanyProfile;