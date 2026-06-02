import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import FormInput from "../../components/FormInput";
import TextArea from "../../components/TextArea";
import SelectInput from "../../components/SelectInput";
import Toast from "../../components/Toast";
import axiosInstance from "../../api/axiosInstance";
import {
  PlusCircle,
  AlertTriangle,
  Briefcase,
  ClipboardList,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  ShieldCheck,
  ArrowLeft,
  Send,
} from "lucide-react";

const PostJob = () => {
  const navigate = useNavigate();

  const outletContext = useOutletContext();
  const isVerified = outletContext?.isVerified ?? false;

  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [requirements, setRequirements] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [educationRequired, setEducationRequired] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("remote");
  const [jobType, setJobType] = useState("full-time");
  const [salaryRange, setSalaryRange] = useState("");
  const [openingsCount, setOpeningsCount] = useState("1");
  const [lastDateToApply, setLastDateToApply] = useState("");
  const [interviewMode, setInterviewMode] = useState("online");
  const [selectionProcess, setSelectionProcess] = useState("");

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const temp = {};

    if (!title.trim()) {
      temp.title = "Job Title is required.";
    }

    if (!description.trim()) {
      temp.description = "Job Description is required.";
    }

    if (
      !openingsCount ||
      isNaN(Number(openingsCount)) ||
      Number(openingsCount) <= 0
    ) {
      temp.openingsCount = "Openings must be a positive integer.";
    }

    if (lastDateToApply) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const applyDate = new Date(lastDateToApply);
      applyDate.setHours(0, 0, 0, 0);

      if (applyDate < today) {
        temp.lastDateToApply = "Last date to apply must be today or a future date.";
      }
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isVerified) {
      setToastType("error");
      setToastMsg("Only verified companies can post job openings.");
      return;
    }

    if (!validateForm()) {
      setToastType("error");
      setToastMsg("Please correct the highlighted fields before posting.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        required_skills: requiredSkills || null,
        requirements: requirements || null,
        experience_required: experienceRequired || null,
        education_required: educationRequired || null,
        location: location || null,
        work_mode: workMode,
        job_type: jobType,
        salary_range: salaryRange || null,
        openings_count: parseInt(openingsCount),
        last_date_to_apply: lastDateToApply || null,
        interview_mode: interviewMode || null,
        selection_process: selectionProcess || null,
      };

      await axiosInstance.post("/jobs", payload);

      setToastType("success");
      setToastMsg("Job opening posted successfully! Redirecting to jobs page...");

      setTimeout(() => {
        navigate("/company/jobs");
      }, 1500);
    } catch (err) {
      setToastType("error");
      setToastMsg(
        err.response?.data?.detail || "Failed to post job. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const workModeOptions = [
    { value: "remote", label: "Remote Work" },
    { value: "hybrid", label: "Hybrid Setup" },
    { value: "onsite", label: "Onsite / Office" },
  ];

  const typeOptions = [
    { value: "full-time", label: "Full-Time Position" },
    { value: "part-time", label: "Part-Time Position" },
    { value: "internship", label: "Internship Opening" },
    { value: "contract", label: "Contract Assignment" },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => setToastMsg("")}
        />

        {/* Main Header Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                  <PlusCircle size={24} />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                    <Briefcase size={14} />
                    Job Posting
                  </div>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    Post a New Career Opening
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                    Create a verified job opportunity for candidates looking to
                    rebuild their professional pathway.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/company/jobs")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:w-auto"
              >
                <ArrowLeft size={16} />
                Manage Jobs
              </button>
            </div>
          </div>
        </div>

        {!isVerified && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h4 className="text-base font-bold text-amber-900">
                  Hiring Disabled
                </h4>
                <p className="mt-1 text-sm font-medium leading-6 text-amber-800">
                  Your company account is unverified. You cannot post job
                  openings or contact candidates until an admin approves your
                  verification credentials.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/company/verification")}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700"
                >
                  <ShieldCheck size={16} />
                  Complete Verification
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Basics */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeadingCard
              icon={Briefcase}
              title="Job Basics"
              description="Define the role title, required skills, work model, and employment type."
            />

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormInput
                  label="Job Title"
                  id="title"
                  placeholder="e.g. Frontend Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                  required
                  disabled={submitting || !isVerified}
                  icon={Briefcase}
                />

                <FormInput
                  label="Required Technical Skills"
                  id="requiredSkills"
                  placeholder="e.g. React, JavaScript, Tailwind CSS"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  disabled={submitting || !isVerified}
                  icon={ClipboardList}
                />

                <SelectInput
                  label="Work Mode"
                  id="workMode"
                  options={workModeOptions}
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  required
                  disabled={submitting || !isVerified}
                />

                <SelectInput
                  label="Employment Type"
                  id="jobType"
                  options={typeOptions}
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  required
                  disabled={submitting || !isVerified}
                />

                <FormInput
                  label="Salary Range"
                  id="salaryRange"
                  placeholder="e.g. ₹4 LPA - ₹7 LPA"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  disabled={submitting || !isVerified}
                  icon={IndianRupee}
                />

                <FormInput
                  label="Job Location"
                  id="location"
                  placeholder="e.g. Chennai, Bengaluru, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={submitting || !isVerified}
                  icon={MapPin}
                />

                <FormInput
                  label="Number of Openings"
                  id="openingsCount"
                  type="number"
                  placeholder="e.g. 2"
                  value={openingsCount}
                  onChange={(e) => setOpeningsCount(e.target.value)}
                  error={errors.openingsCount}
                  required
                  disabled={submitting || !isVerified}
                  icon={Users}
                />

                <FormInput
                  label="Last Date to Apply"
                  id="lastDateToApply"
                  type="date"
                  value={lastDateToApply}
                  onChange={(e) => setLastDateToApply(e.target.value)}
                  error={errors.lastDateToApply}
                  disabled={submitting || !isVerified}
                  icon={Calendar}
                />
              </div>
            </div>
          </section>

          {/* Description & Requirements */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeadingCard
              icon={ClipboardList}
              title="Description & Requirements"
              description="Explain responsibilities, requirements, experience, and education expectations."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <TextArea
                label="Job Description"
                id="description"
                placeholder="Provide a detailed role description, responsibilities, daily tasks, and expected outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={errors.description}
                required
                disabled={submitting || !isVerified}
              />

              <TextArea
                label="Technical Requirements & Vetting Criteria"
                id="requirements"
                placeholder="Mention required experience, technical depth, academic background, certifications, or important tools..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                disabled={submitting || !isVerified}
              />

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormInput
                  label="Experience Required"
                  id="experienceRequired"
                  placeholder="e.g. 1-3 years"
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                  disabled={submitting || !isVerified}
                />

                <FormInput
                  label="Education Required"
                  id="educationRequired"
                  placeholder="e.g. BCA, B.Sc CS, BE CSE or equivalent"
                  value={educationRequired}
                  onChange={(e) => setEducationRequired(e.target.value)}
                  disabled={submitting || !isVerified}
                />
              </div>
            </div>
          </section>

          {/* Interview Process */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeadingCard
              icon={Send}
              title="Interview & Selection Process"
              description="Set the interview mode and explain how candidates will be evaluated."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <FormInput
                label="Interview Mode"
                id="interviewMode"
                placeholder="e.g. Online, Phone call, In-person, Technical round"
                value={interviewMode}
                onChange={(e) => setInterviewMode(e.target.value)}
                disabled={submitting || !isVerified}
              />

              <TextArea
                label="Selection Process"
                id="selectionProcess"
                placeholder="Example: Resume screening → Technical discussion → HR discussion → Offer decision"
                value={selectionProcess}
                onChange={(e) => setSelectionProcess(e.target.value)}
                disabled={submitting || !isVerified}
              />
            </div>
          </section>

          {/* Submit Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ready to Publish This Job?
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Review all details before posting. Only verified companies
                  can publish active openings.
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={submitting || !isVerified}
              >
                <PlusCircle size={16} />
                <span>{submitting ? "Posting Opening..." : "Post Job Opening"}</span>
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

export default PostJob;