import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormInput from "../../components/FormInput";
import Toast from "../../components/Toast";
import Button from "../../components/Button";
import { ShieldCheck, Briefcase, Lock } from "lucide-react";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToastType("error");
      setToastMsg("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      setToastType("success");
      setToastMsg(`Welcome back, ${loggedUser.name}!`);
      
      // Target redirect (restore attempted URL if allowed, or dynamic role dashboard)
      const from = location.state?.from?.pathname || `/${loggedUser.role}/dashboard`;
      
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 800);
    } catch (err) {
      setToastType("error");
      setToastMsg(err.message || "Invalid credentials.");
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

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-xs text-slate-500 font-medium">Sign in to access your custom workspace</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="EMAIL ADDRESS"
            id="recapra_login_email"
            name="recapra_login_email"
            type="email"
            placeholder="john@example.com"
            autoComplete="new-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />

          <FormInput
            label="PASSWORD"
            id="recapra_login_password"
            name="recapra_login_password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
          />

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="w-full mt-2 font-bold py-2.5 text-xs bg-brand-600 hover:bg-brand-700 rounded-xl"
          >
            {submitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs font-semibold text-slate-500">
            Don't have an account? <Link to="/register" className="text-brand-600 font-bold hover:underline">Create account</Link>
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

export default LoginPage;
