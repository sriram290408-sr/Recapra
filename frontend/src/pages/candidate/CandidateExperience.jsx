import React, { useState, useEffect } from "react";
import FormInput from "../../components/FormInput";
import TextArea from "../../components/TextArea";
import SelectInput from "../../components/SelectInput";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import axiosInstance from "../../api/axiosInstance";
import { Plus, Trash2, Edit3, Briefcase } from "lucide-react";

const CandidateExperience = () => {
  const [experienceList, setExperienceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals / Toasts
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExpId, setSelectedExpId] = useState(null);

  // Form Drawer state
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fields
  const [employmentType, setEmploymentType] = useState("experienced");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [description, setDescription] = useState("");
  const [careerGapReason, setCareerGapReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchExperience = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/candidate/experience");
      setExperienceList(response.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load experience details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperience();
  }, []);

  const resetForm = () => {
    setEmploymentType("experienced");
    setCompanyName("");
    setJobTitle("");
    setStartDate("");
    setEndDate("");
    setYearsOfExperience("");
    setDescription("");
    setCareerGapReason("");
    setErrorMsg("");
    setIsEditing(false);
    setEditId(null);
  };

  const handleOpenForm = (exp = null) => {
    resetForm();

    if (exp) {
      setIsEditing(true);
      setEditId(exp.id);
      setEmploymentType(exp.employment_type || "experienced");
      setCompanyName(exp.company_name || "");
      setJobTitle(exp.job_title || "");
      setStartDate(exp.start_date || "");
      setEndDate(exp.end_date || "");
      setYearsOfExperience(
        exp.years_of_experience !== null
          ? exp.years_of_experience.toString()
          : ""
      );
      setDescription(exp.description || "");
      setCareerGapReason(exp.career_gap_reason || "");
    }

    setFormOpen(true);
  };

  const validateExpForm = () => {
    if (employmentType === "experienced") {
      if (!companyName.trim() || !jobTitle.trim() || !startDate) {
        setErrorMsg(
          "Company Name, Job Title and Start Date are required for experienced candidates."
        );
        return false;
      }

      if (
        yearsOfExperience &&
        (isNaN(Number(yearsOfExperience)) || Number(yearsOfExperience) < 0)
      ) {
        setErrorMsg("Years of experience must be a positive number.");
        return false;
      }
    }

    setErrorMsg("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateExpForm()) return;

    setSubmitting(true);

    try {
      const payload = {
        employment_type: employmentType,
        company_name: employmentType === "experienced" ? companyName : null,
        job_title: employmentType === "experienced" ? jobTitle : null,
        start_date: employmentType === "experienced" ? startDate : null,
        end_date: employmentType === "experienced" ? endDate : null,
        years_of_experience:
          employmentType === "experienced" && yearsOfExperience
            ? parseFloat(yearsOfExperience)
            : null,
        description: description || null,
        career_gap_reason: careerGapReason || null,
      };

      if (isEditing) {
        await axiosInstance.put(`/candidate/experience/${editId}`, payload);
        setToastType("success");
        setToastMsg("Experience record saved successfully!");
      } else {
        await axiosInstance.post("/candidate/experience", payload);
        setToastType("success");
        setToastMsg("Experience record added successfully!");
      }

      setFormOpen(false);
      resetForm();
      fetchExperience();
    } catch (err) {
      setToastType("error");
      setToastMsg(
        err.response?.data?.detail || "Failed to save experience details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = (id) => {
    setSelectedExpId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/candidate/experience/${selectedExpId}`);
      setToastType("success");
      setToastMsg("Experience record deleted successfully.");
      setDeleteModalOpen(false);
      fetchExperience();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to delete experience record.");
    }
  };

  const typeOptions = [
    { value: "experienced", label: "Experienced Professional" },
    { value: "fresher", label: "Fresher / Entering Workforce" },
  ];

  if (loading) {
    return <Loader fullPage message="Compiling career timeline..." />;
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Delete Experience Record"
          message="Are you sure you want to permanently delete this career record? This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModalOpen(false)}
        />

        {/* Page Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Briefcase size={20} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Work Experience & Career Gap
            </h2>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Share your professional pathway, fresher status, or describe gap
              reasons in a constructive tone.
            </p>
          </div>

          {!formOpen && (
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Plus size={16} />
              <span>Add Experience</span>
            </button>
          )}
        </div>

        {formOpen ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Career Details" : "Add Career Details"}
              </h3>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Add your work experience details or mark yourself as a fresher
                entering the workforce.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SelectInput
                label="Employment Profile Status"
                id="employmentType"
                options={typeOptions}
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                required
                disabled={submitting}
              />

              {employmentType === "experienced" && (
                <>
                  <FormInput
                    label="Company Name"
                    id="companyName"
                    placeholder="e.g. Google or Tech Startup"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    disabled={submitting}
                  />

                  <FormInput
                    label="Job Title / Designation"
                    id="jobTitle"
                    placeholder="e.g. Software Engineer II"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                    disabled={submitting}
                  />

                  <FormInput
                    label="Start Date"
                    id="startDate"
                    placeholder="e.g. August 2020"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    disabled={submitting}
                  />

                  <FormInput
                    label="End Date"
                    id="endDate"
                    placeholder="e.g. Present or March 2024"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={submitting}
                  />

                  <FormInput
                    label="Years of Experience"
                    id="yearsOfExperience"
                    placeholder="e.g. 2.5"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    disabled={submitting}
                  />
                </>
              )}

              <div className="md:col-span-2">
                <TextArea
                  label="Role & Work Description"
                  id="description"
                  placeholder="Briefly describe your responsibilities, projects, achievements, or learning journey."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Career Gap / Rebuilding Context"
                  id="careerGapReason"
                  placeholder="E.g. laid off during company downsizing, caregiving, health reasons, self-learning, etc."
                  value={careerGapReason}
                  onChange={(e) => setCareerGapReason(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Record"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            {experienceList.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <EmptyState
                  title="No Experience History"
                  description="Listing your past positions or fresh graduate status allows verified recruiters to find you."
                  actionText="Add Experience Details"
                  onAction={() => handleOpenForm()}
                  icon={Briefcase}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {experienceList.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-100 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                          {exp.employment_type === "fresher"
                            ? "Fresher Entry"
                            : `Professional Role - ${
                                exp.years_of_experience || "?"
                              } years`}
                        </span>

                        <h4 className="mt-3 text-lg font-bold text-slate-900">
                          {exp.employment_type === "fresher"
                            ? "Entering Workforce"
                            : `${exp.job_title} at ${exp.company_name}`}
                        </h4>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => handleOpenForm(exp)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          title="Edit Record"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={() => handleDeletePrompt(exp.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {exp.employment_type === "experienced" && (
                        <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Employment Period
                            </span>
                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {exp.start_date || "?"} — {exp.end_date || "?"}
                            </p>
                          </div>

                          <div>
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Experience
                            </span>
                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {exp.years_of_experience || "Not entered"} years
                            </p>
                          </div>

                          <div>
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Employment Type
                            </span>
                            <p className="mt-1 text-sm font-bold text-brand-700">
                              Experienced
                            </p>
                          </div>
                        </div>
                      )}

                      {exp.description && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Roles & Work Description
                          </span>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                            {exp.description}
                          </p>
                        </div>
                      )}

                      {exp.career_gap_reason && (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                          <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                            Career Gap / Rebuilding Context
                          </span>
                          <p className="mt-2 text-sm font-medium italic leading-6 text-slate-700">
                            "{exp.career_gap_reason}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateExperience;