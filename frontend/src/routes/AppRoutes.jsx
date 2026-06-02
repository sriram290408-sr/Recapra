import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import CandidateLayout from "../layouts/CandidateLayout";
import CompanyLayout from "../layouts/CompanyLayout";
import AdminLayout from "../layouts/AdminLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";

// Public Pages
import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import UnauthorizedPage from "../pages/public/UnauthorizedPage";
import NotFoundPage from "../pages/public/NotFoundPage";

// Common Pages
import NotificationsPage from "../pages/public/NotificationsPage";

// Candidate Pages
import CandidateDashboard from "../pages/candidate/CandidateDashboard";
import CandidateProfile from "../pages/candidate/CandidateProfile";
import CandidateEducation from "../pages/candidate/CandidateEducation";
import CandidateSkills from "../pages/candidate/CandidateSkills";
import CandidateExperience from "../pages/candidate/CandidateExperience";
import CandidateDocuments from "../pages/candidate/CandidateDocuments";
import CandidateProjects from "../pages/candidate/CandidateProjects";
import CompaniesAndJobs from "../pages/candidate/CompaniesAndJobs";
import JobDetails from "../pages/candidate/JobDetails";
import MyApplications from "../pages/candidate/MyApplications";
import CandidateProfilePreview from "../pages/candidate/CandidateProfilePreview";
import CandidateInterviews from "../pages/candidate/CandidateInterviews";

// Company Pages
import CompanyDashboard from "../pages/company/CompanyDashboard";
import CompanyProfile from "../pages/company/CompanyProfile";
import CompanyVerification from "../pages/company/CompanyVerification";
import PostJob from "../pages/company/PostJob";
import ManageJobs from "../pages/company/ManageJobs";
import Applicants from "../pages/company/Applicants";
import CompanyPublicProfile from "../pages/company/CompanyPublicProfile";
import CompanyInterviews from "../pages/company/CompanyInterviews";
// ATSRanking page removed — ATS is now integrated into Applicants.jsx

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import CompanyVerificationManagement from "../pages/admin/CompanyVerificationManagement";
import AdminInsights from "../pages/admin/AdminInsights";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Public Company Profile */}
        <Route
          path="/company/public/:companyId"
          element={<CompanyPublicProfile />}
        />
      </Route>

      {/* Candidate Pages */}
      <Route
        path="/candidate"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["candidate"]}>
              <CandidateLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CandidateDashboard />} />
        <Route path="profile" element={<CandidateProfile />} />
        <Route path="education" element={<CandidateEducation />} />
        <Route path="skills" element={<CandidateSkills />} />
        <Route path="experience" element={<CandidateExperience />} />
        <Route path="documents" element={<CandidateDocuments />} />
        <Route path="projects" element={<CandidateProjects />} />
        <Route path="jobs" element={<CompaniesAndJobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="profile-preview" element={<CandidateProfilePreview />} />
        <Route path="interviews" element={<CandidateInterviews />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Company Pages */}
      <Route
        path="/company"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["company"]}>
              <CompanyLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CompanyDashboard />} />
        <Route path="profile" element={<CompanyProfile />} />
        <Route path="verification" element={<CompanyVerification />} />
        <Route path="post-job" element={<PostJob />} />
        <Route path="jobs" element={<ManageJobs />} />
        {/* ATS Ranking moved into Applicants page — no separate route needed */}
        <Route path="applicants/:jobId" element={<Applicants />} />

        {/* Company-side candidate profile preview */}
        <Route
          path="candidates/:candidateId/preview"
          element={<CandidateProfilePreview />}
        />

        <Route path="interviews" element={<CompanyInterviews />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Admin Pages */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route
          path="company-verification"
          element={<CompanyVerificationManagement />}
        />
        <Route path="insights" element={<AdminInsights />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;