import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import Toast from "../../components/Toast";
import axiosInstance from "../../api/axiosInstance";
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  FileText,
  Globe,
  Linkedin,
  Github,
  MapPin,
  Phone,
  Clock,
  Edit3,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

const CandidateProfilePreview = () => {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const url = candidateId 
        ? `/candidate/profile-preview/${candidateId}` 
        : "/candidate/profile";
      const response = await axiosInstance.get(url);
      setProfile(response.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [candidateId]);

  const formatStatus = (status) => {
    if (!status) return "Not specified";
    return status.replace(/_/g, " ").toUpperCase();
  };

  const getSafeList = (list) => {
    return Array.isArray(list) ? list : [];
  };

  const renderLinkButton = (href, label, Icon) => {
    if (!href) return null;

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
      >
        <Icon size={15} />
        <span>{label}</span>
        <ExternalLink size={12} className="text-slate-400" />
      </a>
    );
  };

  if (loading) {
    return <Loader fullPage message="Assembling profile preview..." />;
  }

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Profile details are not available.
          </p>
        </div>
      </div>
    );
  }

  const education = getSafeList(profile.education);
  const experiences = getSafeList(profile.experiences);
  const skills = getSafeList(profile.skills);
  const projects = getSafeList(profile.projects);
  const documents = getSafeList(profile.documents);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Page Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <User size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {candidateId ? "Candidate Profile Preview" : "Profile Preview Mode"}
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                {candidateId 
                  ? "Review candidate credentials, work experiences, education history, relevant projects, and resume."
                  : "This is how verified recruiters can understand your candidate profile, skills, experience, projects, and resume readiness."}
              </p>
            </div>
          </div>

          <div className="flex w-full justify-start sm:w-auto sm:justify-end">
            {candidateId ? (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                <ArrowLeft size={16} />
                <span>Back to Applicants</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/candidate/profile")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:w-auto"
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Preview Sheet */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Profile Header */}
          <div className="border-b border-slate-200 bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  {profile.full_name || "Candidate Name"}
                </h1>

                {profile.target_job_role && (
                  <p className="mt-2 text-base font-bold text-brand-700">
                    {profile.target_job_role}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                  {profile.location && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {profile.location}
                    </span>
                  )}

                  {profile.phone && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                      <Phone size={14} className="text-slate-400" />
                      {profile.phone}
                    </span>
                  )}

                  {profile.notice_period && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                      <Clock size={14} className="text-slate-400" />
                      Notice: {profile.notice_period}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {renderLinkButton(profile.linkedin_url, "LinkedIn", Linkedin)}
                {renderLinkButton(profile.github_url, "GitHub", Github)}
                {renderLinkButton(profile.portfolio_url, "Portfolio", Globe)}
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-8">
            {/* Professional Summary */}
            <PreviewSection
              icon={User}
              title="Professional Summary"
              emptyText="No professional summary added yet."
            >
              {profile.bio && (
                <p className="text-sm font-medium leading-7 text-slate-700">
                  {profile.bio}
                </p>
              )}
            </PreviewSection>

            {/* Rebuilding Story */}
            <PreviewSection
              icon={Award}
              title="Rebuilding Story & Gap Statement"
              titleClassName="text-brand-700"
            >
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                    Career Status Indicator
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm">
                    {formatStatus(profile.career_status)}
                  </span>
                </div>

                {profile.job_loss_reason ? (
                  <p className="text-sm font-semibold italic leading-7 text-slate-700">
                    "{profile.job_loss_reason}"
                  </p>
                ) : (
                  <p className="text-sm font-medium text-slate-500">
                    No gap explanation statement entered yet.
                  </p>
                )}
              </div>
            </PreviewSection>

            {/* Education */}
            <PreviewSection
              icon={GraduationCap}
              title="Education History"
              emptyText="No academic records added."
              isEmpty={education.length === 0}
            >
              <div className="space-y-4">
                {education.map((edu) => (
                  <div
                    key={edu.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {edu.degree} in {edu.field_of_study}
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {edu.institution}
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                        {edu.start_date || "?"} -{" "}
                        {edu.end_date || edu.year_of_passing || "?"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Marks:{" "}
                      <span className="font-black text-brand-700">
                        {edu.marks_percentage}%
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </PreviewSection>

            {/* Experience */}
            <PreviewSection
              icon={Briefcase}
              title="Work Experience Timeline"
              emptyText="No work experience listed."
              isEmpty={experiences.length === 0}
            >
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                          {exp.employment_type === "fresher"
                            ? "Fresher"
                            : "Experienced"}
                        </span>

                        <h4 className="mt-3 text-sm font-bold text-slate-900">
                          {exp.employment_type === "fresher"
                            ? "Entering Workforce"
                            : `${exp.job_title} at ${exp.company_name}`}
                        </h4>
                      </div>

                      {exp.employment_type === "experienced" && (
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                          {exp.start_date || "?"} - {exp.end_date || "?"}
                        </span>
                      )}
                    </div>

                    {exp.description && (
                      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
                        {exp.description}
                      </p>
                    )}

                    {exp.career_gap_reason && (
                      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                        <p className="text-sm font-medium italic leading-7 text-slate-700">
                          <strong className="text-indigo-700">
                            Gap Context:
                          </strong>{" "}
                          "{exp.career_gap_reason}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PreviewSection>

            {/* Skills */}
            <PreviewSection
              icon={Code}
              title="Key Skills Portfolio"
              emptyText="No skills listed."
              isEmpty={skills.length === 0}
            >
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm font-bold text-slate-800">
                      {skill.skill_name}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
                      {skill.proficiency_level}
                    </span>
                  </div>
                ))}
              </div>
            </PreviewSection>

            {/* Projects */}
            <PreviewSection
              icon={Award}
              title="Key Projects Showcase"
              emptyText="No projects listed."
              isEmpty={projects.length === 0}
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <h4 className="text-sm font-bold text-slate-900">
                      {project.title}
                    </h4>

                    {project.tech_stack && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-brand-700">
                        Stack: {project.tech_stack}
                      </p>
                    )}

                    {project.description && (
                      <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                        {project.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </PreviewSection>

            {/* Documents */}
            <PreviewSection icon={FileText} title="Resume Vault Files">
              {documents.length === 0 ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    No resume document uploaded yet. Recruiters will not be able
                    to download a PDF resume.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <FileText
                      className="mt-0.5 shrink-0 text-emerald-600"
                      size={20}
                    />
                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      Resume file{" "}
                      <strong>
                        "{documents[0]?.original_file_name || "Uploaded file"}"
                      </strong>{" "}
                      is active and linked to your application pathway.
                    </p>
                  </div>
                </div>
              )}
            </PreviewSection>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewSection = ({
  icon: Icon,
  title,
  children,
  emptyText,
  isEmpty = false,
  titleClassName = "",
}) => {
  const shouldShowEmpty = isEmpty || (!children && emptyText);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon size={19} />
        </div>

        <h3
          className={`text-base font-bold text-slate-900 ${titleClassName}`}
        >
          {title}
        </h3>
      </div>

      {shouldShowEmpty ? (
        <p className="text-sm font-medium text-slate-500">{emptyText}</p>
      ) : (
        children
      )}
    </section>
  );
};

export default CandidateProfilePreview;