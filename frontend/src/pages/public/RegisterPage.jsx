import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormInput from "../../components/FormInput";
import Toast from "../../components/Toast";
import Loader from "../../components/Loader";
import Button from "../../components/Button";
import { ShieldCheck, Info, Briefcase, Lock, Check } from "lucide-react";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("candidate"); // default to candidate
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setToastType("error");
      setToastMsg("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setToastType("error");
      setToastMsg("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setToastType("error");
      setToastMsg("You must agree to the Terms and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, role);
      setToastType("success");
      setToastMsg("Registration successful! Redirecting to login...");
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setToastType("error");
      setToastMsg(err.message || "Registration failed. Email might already be taken.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem-3.5rem)] w-full bg-[#f5f7fb] flex flex-col justify-center items-center py-10 px-4">
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg("")} />

      {/* Recapra Header Logo */}
      <div className="flex flex-col items-center gap-1.5 mb-8">
        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-500/25">
          <Briefcase size={24} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recapra</h1>
        <p className="text-xs font-semibold text-slate-500 tracking-wide">Rebuild Your Professional Journey</p>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Create an Account</h2>
          <p className="text-xs text-slate-500 font-medium">Select your role to get started with Recapra</p>
        </div>

        {/* Custom Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
          <button
            type="button"
            onClick={() => setRole("candidate")}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              role === "candidate"
                ? "bg-white text-brand-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setRole("company")}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              role === "company"
                ? "bg-white text-brand-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Company
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label={role === "candidate" ? "FULL NAME" : "COMPANY / BUSINESS NAME"}
            id="name"
            type="text"
            placeholder={role === "candidate" ? "John Doe" : "Acme Corp"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />

          <FormInput
            label="EMAIL ADDRESS"
            id="recapra_register_email"
            name="recapra_register_email"
            type="email"
            placeholder="john@example.com"
            autoComplete="new-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="PHONE NUMBER"
              id="phone"
              type="text"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
            />
            <FormInput
              label="LOCATION"
              id="location"
              type="text"
              placeholder="New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="PASSWORD"
              id="recapra_register_password"
              name="recapra_register_password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
            <FormInput
              label="CONFIRM PASSWORD"
              id="recapra_register_confirm_password"
              name="recapra_register_confirm_password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer py-1 select-none">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
              disabled={submitting}
            />
            <span className="text-xs font-semibold text-slate-500 leading-snug">
              I agree to the <span className="text-brand-600 font-bold hover:underline">Terms of Service</span> and <span className="text-brand-600 font-bold hover:underline">Privacy Policy</span>.
            </span>
          </label>

          {/* Registration Note Card */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-700">
            <Info size={18} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold">Registration Note</h4>
              <p className="text-[11px] font-medium leading-relaxed opacity-90">
                Your profile will remain private until you choose to apply for specific roles or allow verified company headhunting.
              </p>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="w-full mt-2 font-bold py-2.5 text-xs bg-brand-600 hover:bg-brand-700 rounded-xl"
          >
            {submitting ? "Creating Account..." : `Register as ${role === "candidate" ? "Candidate" : "Company"}`}
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs font-semibold text-slate-500">
            Already have an account? <Link to="/login" className="text-brand-600 font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </div>

      {/* Encryption & Certificates */}
      <div className="flex items-center gap-6 mt-6 text-[10px] font-bold text-slate-400 select-none">
        <span className="flex items-center gap-1.5 uppercase tracking-wide">
          <ShieldCheck size={14} />
          End-to-End Encrypted
        </span>
      </div>
    </div>
  );
};

export default RegisterPage;
