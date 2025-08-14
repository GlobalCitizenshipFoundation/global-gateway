import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LayoutWithSidebar from "./components/common/LayoutWithSidebar";
import LoginPage from "./pages/auth/LoginPage";
import ApplyPage from "./pages/applications/ApplyPage";
import DashboardPage from "./pages/applications/DashboardPage";
import ProfilePage from "./pages/user/ProfilePage";
import CreatorDashboardPage from "./pages/programs/CreatorDashboardPage";
import CreateProgramPage from "./pages/programs/CreateProgramPage";
import EditProgramPage from "./pages/programs/EditProgramPage";
import SubmissionsListPage from "./pages/review/SubmissionsListPage";
import SubmissionDetailPage from "./pages/review/SubmissionDetailPage";
import { SessionContextProvider } from "./contexts/auth/SessionContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CreatorProtectedRoute from "./components/auth/CreatorProtectedRoute";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import ReviewerProtectedRoute from "./components/auth/ReviewerProtectedRoute";
import SuperAdminProtectedRoute from "./components/auth/SuperAdminProtectedRoute";
import ManageWorkflowPage from "./pages/workflow/ManageWorkflowPage";
import PipelineViewPage from "./pages/workflow/PipelineViewPage";
import FormBuilderPage from "./pages/forms/FormBuilderPage";
import ProgramDetailsPage from "./pages/programs/ProgramDetailsPage";
import FormManagementPage from "./pages/forms/FormManagementPage";
import EmailManagementPage from "./pages/emails/EmailManagementPage";
import EmailComposerPage from "./pages/emails/EmailComposerPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import AccountDeletionPage from "./pages/admin/AccountDeletionPage";
import { ThemeProvider } from "next-themes";
import WorkflowManagementPage from "./pages/workflow/WorkflowManagementPage";
import WorkflowBuilderPage from "./pages/workflow/WorkflowBuilderPage";
import ReviewerDashboardPage from "@/pages/reviewer/ReviewerDashboardPage";
import EditApplicationPage from "./pages/applications/EditApplicationPage";
import EvaluationTemplatesPage from "./pages/evaluation/EvaluationTemplatesPage";
import EditEvaluationTemplatePage from "./pages/evaluation/EditEvaluationTemplatePage";
import TagManagementPage from "./pages/admin/TagManagementPage";
import EmailLogsPage from "./pages/emails/EmailLogsPage"; // Import new EmailLogsPage


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Sonner position="top-right" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SessionContextProvider>
            <LayoutWithSidebar>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/programs/:programId" element={<ProgramDetailsPage />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/apply/:programId" element={<ApplyPage />} />
                  <Route path="/application/:applicationId/edit" element={<EditApplicationPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  
                  <Route element={<ReviewerProtectedRoute />}>
                    <Route path="/reviewer/dashboard" element={<ReviewerDashboardPage />} />
                  </Route>

                  <Route element={<CreatorProtectedRoute />}>
                    <Route path="/creator/dashboard" element={<CreatorDashboardPage />} />
                    <Route path="/creator/new-program" element={<CreateProgramPage />} />
                    <Route path="/creator/program/:programId/edit" element={<EditProgramPage />} />
                    <Route path="/creator/program/:programId/workflow" element={<ManageWorkflowPage />} />
                    <Route path="/creator/program/:programId/submissions" element={<SubmissionsListPage />} />
                    <Route path="/creator/program/:programId/pipeline" element={<PipelineViewPage />} />
                    <Route path="/creator/program/:programId/submission/:submissionId" element={<SubmissionDetailPage />} />
                    
                    <Route path="/creator/forms" element={<FormManagementPage />} />
                    <Route path="/creator/forms/:formId/edit" element={<FormBuilderPage />} />

                    <Route path="/creator/workflows" element={<WorkflowManagementPage />} />
                    <Route path="/creator/workflows/:workflowId/edit" element={<WorkflowBuilderPage />} />

                    <Route path="/creator/emails" element={<EmailManagementPage />} />
                    <Route path="/creator/emails/compose" element={<EmailComposerPage />} />
                    <Route path="/creator/emails/compose/:templateId" element={<EmailComposerPage />} />

                    <Route path="/creator/evaluation-templates" element={<EvaluationTemplatesPage />} />
                    <Route path="/creator/evaluation-templates/:templateId/edit" element={<EditEvaluationTemplatePage />} />
                  </Route>

                  <Route element={<AdminProtectedRoute />}>
                    <Route path="/admin/user-management" element={<UserManagementPage />} />
                    <Route path="/admin/tags" element={<TagManagementPage />} />
                    <Route path="/admin/email-logs" element={<EmailLogsPage />} /> {/* New: Email Logs Route */}
                  </Route>

                  <Route element={<SuperAdminProtectedRoute />}>
                    <Route path="/admin/account-deletion" element={<AccountDeletionPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </LayoutWithSidebar>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;