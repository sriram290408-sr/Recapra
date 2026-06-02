import React, { useState, useEffect } from "react";
import FormInput from "../../components/FormInput";
import TextArea from "../../components/TextArea";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import axiosInstance from "../../api/axiosInstance";
import { Plus, Trash2, Edit3, Award, ExternalLink, Github } from "lucide-react";

const CandidateProjects = () => {
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals / Toasts
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProjId, setSelectedProjId] = useState(null);

  // Form Drawer state
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [liveDemoLink, setLiveDemoLink] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/candidate/projects");
      setProjectsList(response.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTechStack("");
    setProjectLink("");
    setGithubLink("");
    setLiveDemoLink("");
    setErrorMsg("");
    setIsEditing(false);
    setEditId(null);
  };

  const handleOpenForm = (proj = null) => {
    resetForm();

    if (proj) {
      setIsEditing(true);
      setEditId(proj.id);
      setTitle(proj.title);
      setDescription(proj.description || "");
      setTechStack(proj.tech_stack || "");
      setProjectLink(proj.project_link || "");
      setGithubLink(proj.github_link || "");
      setLiveDemoLink(proj.live_demo_link || "");
    }

    setFormOpen(true);
  };

  const validateProjForm = () => {
    if (!title.trim()) {
      setErrorMsg("Project Title is required.");
      return false;
    }

    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;

    if (projectLink && !urlPattern.test(projectLink)) {
      setErrorMsg("Please enter a valid Project URL.");
      return false;
    }

    if (githubLink && !urlPattern.test(githubLink)) {
      setErrorMsg("Please enter a valid GitHub URL.");
      return false;
    }

    if (liveDemoLink && !urlPattern.test(liveDemoLink)) {
      setErrorMsg("Please enter a valid Live Demo URL.");
      return false;
    }

    setErrorMsg("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateProjForm()) return;

    setSubmitting(true);

    try {
      const payload = {
        title,
        description: description || null,
        tech_stack: techStack || null,
        project_link: projectLink || null,
        github_link: githubLink || null,
        live_demo_link: liveDemoLink || null,
      };

      if (isEditing) {
        await axiosInstance.put(`/candidate/projects/${editId}`, payload);
        setToastType("success");
        setToastMsg("Project saved successfully!");
      } else {
        await axiosInstance.post("/candidate/projects", payload);
        setToastType("success");
        setToastMsg("Project added to profile successfully!");
      }

      setFormOpen(false);
      resetForm();
      fetchProjects();
    } catch (err) {
      setToastType("error");
      setToastMsg(
        err.response?.data?.detail || "Failed to save project details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = (id) => {
    setSelectedProjId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/candidate/projects/${selectedProjId}`);
      setToastType("success");
      setToastMsg("Project deleted successfully.");
      setDeleteModalOpen(false);
      fetchProjects();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to delete project record.");
    }
  };

  const renderTechStackBadges = (techStackValue) => {
    if (!techStackValue) return null;

    return techStackValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((tech) => (
        <span
          key={tech}
          className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700"
        >
          {tech}
        </span>
      ));
  };

  if (loading) {
    return <Loader fullPage message="Accessing project registry..." />;
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
          title="Delete Project"
          message="Are you sure you want to permanently delete this project record? This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModalOpen(false)}
        />

        {/* Page Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Award size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                My Key Projects & Work Highlights
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Add your professional projects, coding repositories, and live
                applications to strengthen your candidate profile.
              </p>
            </div>
          </div>

          {!formOpen && (
            <button
              type="button"
              onClick={() => handleOpenForm()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Plus size={16} className="shrink-0" />
              <span>Add to Profile</span>
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
                {isEditing ? "Edit Profile Project" : "Add Project to Profile"}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Add project details, technology stack, repository links, and
                live demo links in a recruiter-friendly format.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormInput
                label="Project Title"
                id="title"
                placeholder="e.g. Recapra Career Portal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
              />

              <FormInput
                label="Technology Stack"
                id="techStack"
                placeholder="e.g. React JS, FastAPI, SQLite"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                disabled={submitting}
              />

              <FormInput
                label="Project / Document Link"
                id="projectLink"
                placeholder="e.g. https://myproject-info.com"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                disabled={submitting}
              />

              <FormInput
                label="GitHub Link"
                id="githubLink"
                placeholder="e.g. https://github.com/myusername/project-repo"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                disabled={submitting}
              />

              <FormInput
                label="Live Demo Link"
                id="liveDemoLink"
                placeholder="e.g. https://recapra-demo.net"
                value={liveDemoLink}
                onChange={(e) => setLiveDemoLink(e.target.value)}
                disabled={submitting}
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Description"
                  id="description"
                  placeholder="Write a brief overview of the project objectives, features, technical responsibilities, and your contribution..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                {submitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Profile"
                    : "Add to Profile"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            {projectsList.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <EmptyState
                  title="No Projects Highlighted"
                  description="Showcasing working projects increases recruiter confidence and improves your professional profile."
                  actionText="Add to Profile"
                  onAction={() => handleOpenForm()}
                  icon={Award}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {projectsList.map((proj) => (
                  <div
                    key={proj.id}
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-100 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                          Profile Project
                        </span>

                        <h4 className="mt-3 text-lg font-bold text-slate-900">
                          {proj.title}
                        </h4>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => handleOpenForm(proj)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          title="Edit Project"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={() => handleDeletePrompt(proj.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {proj.tech_stack && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {renderTechStackBadges(proj.tech_stack)}
                      </div>
                    )}

                    {proj.description && (
                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Project Description
                        </span>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                          {proj.description}
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-5">
                      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                        {proj.project_link && (
                          <a
                            href={proj.project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            <ExternalLink size={14} />
                            <span>Project Hub</span>
                          </a>
                        )}

                        {proj.github_link && (
                          <a
                            href={proj.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            <Github size={14} />
                            <span>GitHub Repo</span>
                          </a>
                        )}

                        {proj.live_demo_link && (
                          <a
                            href={proj.live_demo_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <ExternalLink size={14} />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>

                      {!proj.project_link &&
                        !proj.github_link &&
                        !proj.live_demo_link && (
                          <div className="border-t border-slate-200 pt-4">
                            <p className="text-xs font-semibold text-slate-400">
                              No external links added for this project.
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

export default CandidateProjects;