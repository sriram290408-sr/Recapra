import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";
import {
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Compass,
  Users,
  Briefcase,
  CheckCircle2,
  Award,
  Zap,
  Lock,
  FileText,
  Building2,
  CalendarCheck,
  Search,
} from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();

  const getStartedLink = () => {
    if (!user) return "/register";
    return `/${user.role}/dashboard`;
  };

  const skills = ["React", "TypeScript", "Tailwind CSS"];

  const steps = [
    {
      number: "01",
      title: "Register",
      text: "Create a profile with the right candidate or company role.",
    },
    {
      number: "02",
      title: "Verify",
      text: "Validate candidate readiness or company business credentials.",
    },
    {
      number: "03",
      title: "Match",
      text: "Connect candidates with relevant verified hiring teams.",
    },
    {
      number: "04",
      title: "Hire",
      text: "Manage applications, interviews, and hiring decisions clearly.",
    },
  ];

  const featureCards = [
    {
      icon: ShieldCheck,
      title: "Verified Profiles",
      text: "Trusted profiles and verified companies improve hiring confidence.",
    },
    {
      icon: Award,
      title: "Credentials Checklist",
      text: "Quickly review education, skills, experience, and project readiness.",
    },
    {
      icon: Users,
      title: "Team Matching",
      text: "Connect candidates with companies looking for relevant talent.",
    },
    {
      icon: HeartHandshake,
      title: "Empathetic Hiring",
      text: "Support career transitions, layoffs, and professional rebuilding.",
    },
    {
      icon: Compass,
      title: "Application Tracking",
      text: "Candidates and companies can track hiring progress from one place.",
    },
    {
      icon: Zap,
      title: "Faster Hiring Flow",
      text: "Structured applications, shortlisting, and interviews reduce delays.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-indigo-50/70" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-100/80 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-brand-700 shadow-sm">
              <Lock size={13} />
              Rebuild Careers With Confidence
            </span>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Rebuild Your Career.
                <br />
                <span className="text-brand-600">
                  Get Matched
                </span>{" "}
                With Better Opportunities.
              </h1>

              <p className="max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
                Recapra is a career rebuilding platform for professionals
                navigating transitions, layoffs, or career gaps, helping them
                connect with compassionate and verified employers.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to={getStartedLink()}>
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full rounded-xl bg-brand-600 px-6 py-3 text-xs font-bold text-white hover:bg-brand-700 sm:w-auto"
                >
                  Find a Vetted Job
                </Button>
              </Link>

              <Link to="/register">
                <Button
                  variant="secondary"
                  className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  Join as Company
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <TrustBadge text="Verified Companies Only" />
              <TrustBadge text="Secure Profile Data" />
            </div>
          </div>

          {/* Hero Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-sm font-black text-brand-700">
                    AR
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Alex Rivera
                    </h4>
                    <p className="text-xs font-semibold text-slate-500">
                      Senior Frontend Engineer
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
                  96% Match
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <span className="block text-[10px] font-black uppercase tracking-wide text-amber-700">
                    Transition Context
                  </span>

                  <p className="mt-1 text-xs font-semibold leading-6 text-amber-800">
                    Laid off due to global restructuring. Took 6 months to build
                    cloud and frontend engineering skills.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Hiring Progress
                    </p>
                    <Briefcase size={16} className="text-brand-600" />
                  </div>

                  <Progress label="Profile Ready" value={92} />
                  <Progress label="Shortlisted" value={76} />
                  <Progress label="Interview Scheduled" value={48} />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-900">
                    Company Verified
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Admin-approved employer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          <TrustItem icon={ShieldCheck} text="Verified employer ecosystem" />
          <TrustItem icon={Lock} text="Secure candidate profile data" />
          <TrustItem icon={HeartHandshake} text="Career transition friendly" />
        </div>
      </section>

      {/* Bridging Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-wide text-brand-600">
            Why Recapra
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Bridging the gap in modern hiring
          </h2>

          <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
            Recapra builds a trusted, empathetic gateway for professionals to
            return to work and for companies to find motivated talent.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AudienceCard
            icon={Compass}
            title="For Candidates"
            description="Rebuild your career profile, highlight your strengths, explain your transition context, and apply to vetted jobs with confidence."
            points={[
              "Build a comprehensive profile",
              "Share your story on your terms",
              "Apply to verified companies",
            ]}
            tone="rose"
          />

          <AudienceCard
            icon={Users}
            title="For Vetted Companies"
            description="Access motivated talent, review complete profiles, manage applicants, and schedule interviews inside a trusted hiring workflow."
            points={[
              "Post active job listings",
              "Verify your business documents",
              "Review detailed candidate profiles",
            ]}
            tone="brand"
          />
        </div>
      </section>

      {/* Candidate Feature */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-brand-700">
              Candidates First
            </span>

            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950">
              Your professional identity, verified and ready.
            </h2>

            <p className="text-sm font-medium leading-7 text-slate-500">
              Showcase education, skills, career experience, projects, resume,
              portfolio, and career gap context in one professional profile.
            </p>

            <Link to={getStartedLink()}>
              <Button
                variant="secondary"
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Explore Profile Builder
              </Button>
            </Link>
          </div>

          <VisualCard
            icon={Award}
            title="Dynamic Career Profile"
            text="Track education, experience gaps, projects, documents, and career readiness in one workspace."
          />
        </div>
      </section>

      {/* Company Feature */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <VisualCard
            icon={ShieldCheck}
            title="Employer Verification Hub"
            text="Admin approval of business credentials keeps hiring authentic and trustworthy."
            tone="emerald"
            className="lg:order-first order-last"
          />

          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-brand-700">
              Recruiters Hub
            </span>

            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950">
              Hire faster with verified intelligence.
            </h2>

            <p className="text-sm font-medium leading-7 text-slate-500">
              Verify company legitimacy, post jobs, review applicants, shortlist
              candidates, and manage interview schedules from one portal.
            </p>

            <Link to="/register">
              <Button
                variant="primary"
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700"
              >
                Register Your Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-wide text-brand-600">
              Platform Flow
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              How Recapra works
            </h2>

            <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
              A clear four-step pathway between career-ready candidates and
              verified companies.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center"
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-brand-100 bg-white text-xs font-black text-brand-600 shadow-sm">
                  {step.number}
                </span>

                <h3 className="mt-4 text-xs font-black uppercase tracking-wide text-slate-800">
                  {step.title}
                </h3>

                <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-wide text-brand-600">
            Platform Features
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Powerful features for modern hiring
          </h2>

          <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
            Everything needed to support career transitions, verified hiring,
            and structured applicant management.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <feature.icon size={21} />
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {feature.title}
                  </h4>

                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">
                    {feature.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-2xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-brand-300">
                Ready to move forward?
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Rebuild careers and hire better talent.
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-300">
                Join candidates and verified employers using Recapra to simplify
                career rebuilding and structured hiring.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={getStartedLink()}>
                <Button
                  variant="primary"
                  className="w-full rounded-xl bg-brand-600 px-6 py-3 text-xs font-black text-white hover:bg-brand-700 sm:w-auto"
                >
                  Find a Vetted Job
                </Button>
              </Link>

              <Link to="/register">
                <Button
                  variant="outline"
                  className="w-full rounded-xl border border-white/30 px-6 py-3 text-xs font-black text-white hover:bg-white/10 sm:w-auto"
                >
                  Register Business
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const TrustBadge = ({ text }) => (
  <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 shadow-sm backdrop-blur">
    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
    {text}
  </span>
);

const TrustItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
      <Icon size={18} />
    </div>

    <p className="text-sm font-bold text-slate-700">{text}</p>
  </div>
);

const AudienceCard = ({ icon: Icon, title, description, points, tone }) => {
  const iconTone =
    tone === "rose"
      ? "bg-rose-50 text-rose-600"
      : "bg-brand-50 text-brand-600";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${iconTone}`}>
        <Icon size={24} />
      </div>

      <h3 className="text-xl font-black text-slate-950">{title}</h3>

      <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
        {description}
      </p>

      <div className="mt-5 space-y-3">
        {points.map((point) => (
          <div key={point} className="flex items-start gap-2">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-emerald-500"
            />
            <span className="text-sm font-semibold text-slate-600">
              {point}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const VisualCard = ({ icon: Icon, title, text, tone = "brand", className = "" }) => {
  const iconTone =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600"
      : "bg-brand-50 text-brand-600";

  return (
    <div
      className={`flex aspect-video items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-xl ${className}`}
    >
      <div className="max-w-sm text-center">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconTone}`}>
          <Icon size={30} />
        </div>

        <h4 className="text-base font-black text-slate-900">{title}</h4>

        <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
};

const Progress = ({ label, value }) => (
  <div className="mb-3 last:mb-0">
    <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
      <span>{label}</span>
      <span>{value}%</span>
    </div>

    <div className="h-2 rounded-full bg-white">
      <div
        className="h-2 rounded-full bg-brand-600"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default LandingPage;