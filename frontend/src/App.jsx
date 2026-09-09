import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AIChatDrawer from './components/AIChatDrawer';

// Entrepreneur & Shared Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BusinessProfile from './pages/BusinessProfile';
import ApprovalsList from './pages/ApprovalsList';
import ApprovalDetails from './pages/ApprovalDetails';
import DocumentVault from './pages/DocumentVault';
import DocumentPlanner from './pages/DocumentPlanner';
import ApplicationsList from './pages/ApplicationsList';
import ApplicationDetails from './pages/ApplicationDetails';
import RenewalsPage from './pages/RenewalsPage';
import SchemesPage from './pages/SchemesPage';
import GrievancesPage from './pages/GrievancesPage';
import KnowledgeBase from './pages/KnowledgeBase';
import RegulatoryRoadmap from './pages/RegulatoryRoadmap';
import ApplicationAssistant from './pages/ApplicationAssistant';
import NotFound from './pages/NotFound';

// Officer Dedicated Pages
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerApplicationReview from './pages/OfficerApplicationReview';
import OfficerQueries from './pages/OfficerQueries';
import OfficerInspections from './pages/OfficerInspections';

// Admin Dedicated Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminBusinesses from './pages/AdminBusinesses';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminAudit from './pages/AdminAudit';

function ProtectedLayout() {
  const { token, loading } = useAuth();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Dynamic Sidebar (Desktop Collapsible + Mobile Auto-Closing Drawer) */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenAI={() => setAiDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenAI={() => setAiDrawerOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Scrollable Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Routes>
            {/* Entrepreneur Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/roadmap" element={<RegulatoryRoadmap />} />
            <Route path="/roadmap/:stepId/assistant" element={<ApplicationAssistant />} />
            <Route path="/profile" element={<BusinessProfile />} />
            <Route path="/approvals" element={<ApprovalsList />} />
            <Route path="/approvals/:id" element={<ApprovalDetails />} />
            <Route path="/documents" element={<DocumentVault />} />
            <Route path="/documents/planner" element={<DocumentPlanner />} />
            <Route path="/applications" element={<ApplicationsList />} />
            <Route path="/applications/:id" element={<ApplicationDetails />} />
            <Route path="/inspections" element={<OfficerInspections />} />
            <Route path="/renewals" element={<RenewalsPage />} />
            <Route path="/schemes" element={<SchemesPage />} />
            <Route path="/grievances" element={<GrievancesPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/assistant" element={<Dashboard />} />
            <Route path="/notifications" element={<Dashboard />} />

            {/* Officer Routes */}
            <Route path="/officer" element={<OfficerDashboard />} />
            <Route path="/officer/applications" element={<OfficerDashboard />} />
            <Route path="/officer/applications/:id" element={<OfficerApplicationReview />} />
            <Route path="/officer/queries" element={<OfficerQueries />} />
            <Route path="/officer/inspections" element={<OfficerInspections />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/businesses" element={<AdminBusinesses />} />
            <Route path="/admin/approvals" element={<ApprovalsList />} />
            <Route path="/admin/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/admin/applications" element={<ApplicationsList />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/grievances" element={<GrievancesPage />} />
            <Route path="/admin/audit" element={<AdminAudit />} />

            {/* Fallback 404 Route */}
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      {/* Slide-out AI Assistant Drawer */}
      <AIChatDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </ToastProvider>
  );
}
