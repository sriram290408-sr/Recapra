import React, { useState, useEffect } from "react";
import FormInput from "../../components/FormInput";
import SelectInput from "../../components/SelectInput";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import axiosInstance from "../../api/axiosInstance";
import { Plus, X, Award, Briefcase, Settings } from "lucide-react";

const CandidateSkills = () => {
  const [skillsList, setSkillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [skillName, setSkillName] = useState("");
  const [skillType, setSkillType] = useState("technical");
  const [proficiencyLevel, setProficiencyLevel] = useState("intermediate");

  // Toasts
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/candidate/skills");
      setSkillsList(response.data);
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to load skills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();

    if (!skillName.trim()) {
      setToastType("error");
      setToastMsg("Skill Name is required.");
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.post("/candidate/skills", {
        skill_name: skillName,
        skill_type: skillType,
        proficiency_level: proficiencyLevel,
      });

      setToastType("success");
      setToastMsg(`Skill '${skillName}' added to profile successfully!`);
      setSkillName("");
      fetchSkills();
    } catch (err) {
      setToastType("error");
      setToastMsg(err.response?.data?.detail || "Failed to add skill.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (id, name) => {
    try {
      await axiosInstance.delete(`/candidate/skills/${id}`);
      setToastType("success");
      setToastMsg(`Skill '${name}' deleted successfully.`);
      fetchSkills();
    } catch (err) {
      setToastType("error");
      setToastMsg("Failed to delete skill.");
    }
  };

  const typeOptions = [
    { value: "technical", label: "Technical Skills (e.g. Python, SQL)" },
    { value: "soft", label: "Soft Skills (e.g. Communication, Leadership)" },
    { value: "tool", label: "Tools / Frameworks (e.g. Git, Docker, React)" },
  ];

  const proficiencyOptions = [
    { value: "beginner", label: "Beginner / Foundational" },
    { value: "intermediate", label: "Intermediate / Proficient" },
    { value: "advanced", label: "Advanced / Expert" },
  ];

  const technicalSkills = skillsList.filter((s) => s.skill_type === "technical");
  const softSkills = skillsList.filter((s) => s.skill_type === "soft");
  const toolSkills = skillsList.filter((s) => s.skill_type === "tool");

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case "advanced":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "intermediate":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "beginner":
        return "border-amber-200 bg-amber-50 text-amber-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const renderSkillGroup = (title, icon, skills) => {
    const Icon = icon;

    if (skills.length === 0) return null;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon size={19} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">{title}</h4>
              <p className="text-xs font-medium text-slate-500">
                {skills.length} skill{skills.length > 1 ? "s" : ""} added
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {skills.map((s) => (
            <div
              key={s.id}
              className="group inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm transition hover:border-brand-200 hover:bg-white"
            >
              <span className="max-w-[180px] truncate text-sm font-bold text-slate-800">
                {s.skill_name}
              </span>

              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${getLevelBadgeClass(
                  s.proficiency_level
                )}`}
              >
                {s.proficiency_level}
              </span>

              <button
                onClick={() => handleDeleteSkill(s.id, s.skill_name)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                title="Delete skill"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loader fullPage message="Analyzing skillset profile..." />;
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Page Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Award size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                My Skill Portfolio
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Add your technical skills, soft skills, tools, and proficiency
                level to make your candidate profile stronger for recruiters.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Form Panel */}
          <div className="xl:col-span-4">
            <form
              onSubmit={handleAddSkill}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-6"
            >
              <div className="mb-5 border-b border-slate-200 pb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Add Skill to Profile
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Choose the skill category and proficiency level before adding
                  it to your profile.
                </p>
              </div>

              <div className="space-y-5">
                <FormInput
                  label="Skill Name"
                  id="skillName"
                  placeholder="e.g. React JS, Python, Scrum"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  required
                  disabled={submitting}
                />

                <SelectInput
                  label="Skill Category"
                  id="skillType"
                  options={typeOptions}
                  value={skillType}
                  onChange={(e) => setSkillType(e.target.value)}
                  required
                  disabled={submitting}
                />

                <SelectInput
                  label="Proficiency Level"
                  id="proficiencyLevel"
                  options={proficiencyOptions}
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  required
                  disabled={submitting}
                />

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                >
                  <Plus size={16} />
                  <span>{submitting ? "Adding..." : "Add to Profile"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Display Panel */}
          <div className="xl:col-span-8">
            {skillsList.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <EmptyState
                  title="No Skills Added"
                  description="Listing your professional skill sets makes it easier for companies to match you with suitable job posts."
                  actionText="Add Skill to Profile"
                  icon={Award}
                />
              </div>
            ) : (
              <div className="space-y-5">
                {renderSkillGroup(
                  "Technical & Hard Skills",
                  Settings,
                  technicalSkills
                )}

                {renderSkillGroup(
                  "Tools, Frameworks & Libraries",
                  Briefcase,
                  toolSkills
                )}

                {renderSkillGroup(
                  "Soft & Professional Skills",
                  Award,
                  softSkills
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateSkills;