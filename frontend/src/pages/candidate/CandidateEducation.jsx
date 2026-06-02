import React, { useState, useEffect } from "react";
import FormInput from "../../components/FormInput";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import axiosInstance from "../../api/axiosInstance";
import { Plus, Trash2, Edit3, Award } from "lucide-react";

const CandidateEducation = () => {
  const [educationList, setEducationList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals / Toasts
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEduId, setSelectedEduId] = useState(null);

  // Form Drawer state
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fields
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [yearOfPassing, setYearOfPassing] = useState("");
  const [marksPercentage, setMarksPercentage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchEducation = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/candidate/education");
      setEducationList(response.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load education details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, []);

  const resetForm = () => {
    setInstitution("");
    setDegree("");
    setFieldOfStudy("");
    setStartDate("");
    setEndDate("");
    setYearOfPassing("");
    setMarksPercentage("");
    setErrorMsg("");
    setIsEditing(false);
    setEditId(null);
  };

  const handleOpenForm = (edu = null) => {
    resetForm();

    if (edu) {
      setIsEditing(true);
      setEditId(edu.id);
      setInstitution(edu.institution);
      setDegree(edu.degree);
      setFieldOfStudy(edu.field_of_study);
      setStartDate(edu.start_date || "");
      setEndDate(edu.end_date || "");
      setYearOfPassing(
        edu.year_of_passing !== null ? edu.year_of_passing.toString() : ""
      );
      setMarksPercentage(
        edu.marks_percentage !== null ? edu.marks_percentage.toString() : ""
      );
    }

    setFormOpen(true);
  };

  const validateEduForm = () => {
    if (
      !institution.trim() ||
      !degree.trim() ||
      !fieldOfStudy.trim() ||
      !marksPercentage
    ) {
      setErrorMsg("All mandatory fields marked with * must be filled.");
      return false;
    }

    const pct = Number(marksPercentage);

    if (isNaN(pct) || pct < 0 || pct > 100) {
      setErrorMsg("Marks percentage must be a valid number between 0 and 100.");
      return false;
    }

    if (
      yearOfPassing &&
      (isNaN(Number(yearOfPassing)) || Number(yearOfPassing) < 1900)
    ) {
      setErrorMsg("Please enter a valid year of passing.");
      return false;
    }

    setErrorMsg("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEduForm()) return;

    setSubmitting(true);

    try {
      const payload = {
        institution,
        degree,
        field_of_study: fieldOfStudy,
        start_date: startDate || null,
        end_date: endDate || null,
        year_of_passing: yearOfPassing ? parseInt(yearOfPassing) : null,
        marks_percentage: parseFloat(marksPercentage),
      };

      if (isEditing) {
        await axiosInstance.put(`/candidate/education/${editId}`, payload);
        setToastType("success");
        setToastMsg("Education record updated successfully!");
      } else {
        await axiosInstance.post("/candidate/education", payload);
        setToastType("success");
        setToastMsg("Education record added successfully!");
      }

      setFormOpen(false);
      resetForm();
      fetchEducation();
    } catch (err) {
      setToastType("error");
      setToastMsg(
        err.response?.data?.detail || "Failed to save education details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = (id) => {
    setSelectedEduId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/candidate/education/${selectedEduId}`);
      setToastType("success");
      setToastMsg("Education record deleted successfully.");
      setDeleteModalOpen(false);
      fetchEducation();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to delete education record.");
    }
  };

  if (loading) {
    return <Loader fullPage message="Fetching academic history..." />;
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
          title="Delete Education History"
          message="Are you sure you want to permanently delete this academic record? This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModalOpen(false)}
        />

        {/* Page Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Award size={20} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Education & Academic Credentials
            </h2>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Provide details about your graduation, degrees, marks percentage,
              and institutions.
            </p>
          </div>

          {!formOpen && (
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Plus size={16} />
              <span>Add Education</span>
            </button>
          )}
        </div>

        {formOpen ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-1 border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Academic Record" : "Add New Academic Record"}
              </h3>

              <p className="text-sm font-medium text-slate-500">
                Fill the required fields carefully. Marks percentage must be
                between 0 and 100.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormInput
                label="Institution / University Name"
                id="institution"
                placeholder="e.g. Stanford University"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
                disabled={submitting}
              />

              <FormInput
                label="Degree"
                id="degree"
                placeholder="e.g. Bachelor of Science"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
                disabled={submitting}
              />

              <FormInput
                label="Field of Study / Major"
                id="fieldOfStudy"
                placeholder="e.g. Computer Science"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                required
                disabled={submitting}
              />

              <FormInput
                label="Marks Percentage (%)"
                id="marksPercentage"
                placeholder="e.g. 85.5"
                value={marksPercentage}
                onChange={(e) => setMarksPercentage(e.target.value)}
                required
                disabled={submitting}
              />

              <FormInput
                label="Start Date / Year"
                id="startDate"
                placeholder="e.g. 2018 or September 2018"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
              />

              <FormInput
                label="End Date / Year"
                id="endDate"
                placeholder="e.g. 2022 or June 2022"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={submitting}
              />

              <FormInput
                label="Year of Passing"
                id="yearOfPassing"
                placeholder="e.g. 2022"
                value={yearOfPassing}
                onChange={(e) => setYearOfPassing(e.target.value)}
                disabled={submitting}
              />
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
            {educationList.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <EmptyState
                  title="No Academic History"
                  description="Listing your education credentials increases profile completeness and matches you with correct job roles."
                  actionText="Add Academic History"
                  onAction={() => handleOpenForm()}
                  icon={Award}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {educationList.map((edu) => (
                  <div
                    key={edu.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-100 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                          {edu.degree} in {edu.field_of_study}
                        </span>

                        <h4 className="mt-3 text-lg font-bold text-slate-900">
                          {edu.institution}
                        </h4>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => handleOpenForm(edu)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          title="Edit Record"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={() => handleDeletePrompt(edu.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Timeline
                        </span>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {edu.start_date || "?"} — {edu.end_date || "?"}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Year of Passing
                        </span>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {edu.year_of_passing || "Not entered"}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Marks Percentage
                        </span>
                        <p className="mt-1 text-sm font-bold text-brand-700">
                          {edu.marks_percentage}%
                        </p>
                      </div>
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

export default CandidateEducation;