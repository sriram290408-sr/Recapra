import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/StatCard";
import Loader from "../../components/Loader";
import Toast from "../../components/Toast";
import Button from "../../components/Button";
import axiosInstance from "../../api/axiosInstance";
import {
  FileText,
  Link as LinkIcon,
  Award,
  Send,
  Compass,
  UserCheck,
  ArrowRight,
  Zap,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

const CandidateDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [dashboardResponse, profileResponse] = await Promise.all([
        axiosInstance.get("/candidate/dashboard"),
        axiosInstance.get("/candidate/profile"),
      ]);

      setStats(dashboardResponse.data);
      setProfile(profileResponse.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const educationCount = Array.isArray(profile?.education)
    ? profile.education.length
    : 0;

  const skillsCount = Array.isArray(profile?.skills)
    ? profile.skills.length
    : 0;

  const hasEducation = educationCount > 0;
  const hasSkills = skillsCount > 0;

  const profileCompletion = Number(stats?.profile_completion_pct || 0);
  const isProfileComplete = profileCompletion >= 100;

  if (loading) {
    return <Loader fullPage message="Fetching dashboard metrics..." />;
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Welcome & Intro */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Candidate Dashboard
            </h1>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Monitor your profile completeness, application pathways, and next
              rebuilding milestones.
            </p>
          </div>

          <div className="flex w-full justify-start lg:w-auto lg:justify-end">
            <Button
              onClick={() => navigate("/candidate/profile")}
              variant="primary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              className="w-full justify-center rounded-lg bg-brand-600 text-xs font-bold text-white shadow-sm hover:bg-brand-700 sm:w-auto"
            >
              {isProfileComplete ? "View Profile" : "Complete Your Profile"}
            </Button>
          </div>
        </div>

        {stats && (
          <>
            {/* Profile completion visual meter - hidden after 100% */}
            {!isProfileComplete && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-800">
                    <CheckCircle2 size={16} className="text-brand-600" />
                    Profile Completion Meter
                  </h3>

                  <span className="inline-flex w-fit items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-extrabold text-brand-600">
                    {profileCompletion}%
                  </span>
                </div>

                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>

                <p className="mt-4 flex items-start gap-2 text-sm font-semibold leading-6 text-slate-500">
                  <Zap size={16} className="mt-1 shrink-0 text-amber-500" />
                  <span>
                    <strong className="text-slate-700">
                      Next Suggested Step:
                    </strong>{" "}
                    {stats.next_step}
                  </span>
                </p>
              </div>
            )}

            {/* Grid of Dashboard Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard
                title="Completeness"
                value={`${profileCompletion}%`}
                subtext={
                  isProfileComplete
                    ? "Profile fully completed"
                    : "Profile parameters filled"
                }
                icon={UserCheck}
                variant={isProfileComplete ? "success" : "brand"}
                onClick={() => navigate("/candidate/profile")}
              />

              <StatCard
                title="Resume"
                value={stats.resume_uploaded ? "ACTIVE" : "MISSING"}
                subtext={
                  stats.resume_uploaded
                    ? "Ready to apply"
                    : "Upload resume to apply"
                }
                icon={FileText}
                variant={stats.resume_uploaded ? "success" : "danger"}
                onClick={() => navigate("/candidate/documents")}
              />

              <StatCard
                title="Portfolio"
                value={stats.portfolio_added ? "LINKED" : "MISSING"}
                subtext={
                  stats.portfolio_added
                    ? "Showcasing projects"
                    : "Add portfolio link"
                }
                icon={LinkIcon}
                variant={stats.portfolio_added ? "success" : "neutral"}
                onClick={() => navigate("/candidate/profile")}
              />

              <StatCard
                title="Projects"
                value={(stats.projects_count || 0).toString()}
                subtext="Technical skill items"
                icon={Award}
                variant="info"
                onClick={() => navigate("/candidate/projects")}
              />

              <StatCard
                title="Applied Jobs"
                value={(stats.applied_jobs_count || 0).toString()}
                subtext="Total transitions sent"
                icon={Send}
                variant="info"
                onClick={() => navigate("/candidate/applications")}
              />

              <StatCard
                title="Latest Status"
                value={
                  stats.current_status === "no_applications"
                    ? "NONE"
                    : (stats.current_status || "none")
                        .replace(/_/g, " ")
                        .toUpperCase()
                }
                subtext="Recruitment pipeline stage"
                icon={Compass}
                variant="brand"
                onClick={() => navigate("/candidate/applications")}
              />
            </div>

            {/* Education & Skills Helper Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Education Card */}
              <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      hasEducation
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    {hasEducation ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <GraduationCap size={24} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                        Education & Qualifications
                      </h4>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                          hasEducation
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {hasEducation ? "Completed" : "Pending"}
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-6 text-slate-500">
                      {hasEducation
                        ? `${educationCount} education record${
                            educationCount > 1 ? "s" : ""
                          } added to your profile. You can update or add more qualifications anytime.`
                        : "Add your degree, institution, marks percentage, and passing year to improve your profile strength."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/candidate/education")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:w-auto"
                  >
                    <span>
                      {hasEducation ? "Update Education" : "Add Education"}
                    </span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Skills Card */}
              <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      hasSkills
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    {hasSkills ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <Award size={24} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                        Skill Verification Checklist
                      </h4>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                          hasSkills
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {hasSkills ? "Completed" : "Pending"}
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-6 text-slate-500">
                      {hasSkills
                        ? `${skillsCount} skill${
                            skillsCount > 1 ? "s" : ""
                          } added to your profile. Keep your technical, soft skill, and tool list updated.`
                        : "Add technical skills, soft skills, and tools so companies can match you with relevant job roles."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/candidate/skills")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:w-auto"
                  >
                    <span>{hasSkills ? "Update Skills" : "Add Skills"}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboard;