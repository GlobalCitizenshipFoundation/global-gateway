import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import ApplyPage from "./pages/ApplyPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import CreatorDashboardPage from "./pages/CreatorDashboardPage";
import CreateProgramPage from "./pages/CreateProgramPage";
import EditProgramPage from "./pages/EditProgramPage";
import SubmissionsListPage from "./pages/SubmissionsListPage";
import SubmissionDetailPage from "./pages/SubmissionDetailPage";
import { SessionContextProvider } from "./contexts/SessionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ManageWorkflowPage from "./pages/ManageWorkflowPage";
import PipelineViewPage from "./pages/PipelineViewPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import ProgramDetailsPage from "./pages/ProgramDetailsPage";
import FormManagementPage from "./pages/FormManagementPage";
import EmailManagementPage from "./pages/EmailManagementPage"; // Ensure this is imported
import EmailComposerPage from "./pages/EmailComposerPage"; // Import the renamed composer page
import { ThemeProvider } from "next-themes"; // Import ThemeProvider

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
        {/* Removed <Toaster /> as sonner is used */}
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SessionContextProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/programs/:programId" element={<ProgramDetailsPage />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/apply/:programId" element={<ApplyPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/creator/dashboard" element={<CreatorDashboardPage />} />
                  <Route path="/creator/new-program" element={<CreateProgramPage />} />
                  <Route path="/creator/program/:programId/edit" element={<EditProgramPage />} />
                  <Route path="/creator/program/:programId/workflow" element={<ManageWorkflowPage />} />
                  <Route path="/creator/program/:programId/submissions" element={<SubmissionsListPage />} />
                  <Route path="/creator/program/:programId/pipeline" element={<PipelineViewPage />} />
                  <Route path="/creator/program/:programId/submission/:submissionId" element={<SubmissionDetailPage />} />
                  
                  {/* Form Management Routes */}
                  <Route path="/creator/forms" element={<FormManagementPage />} />
                  <Route path="/creator/forms/:formId/edit" element={<FormBuilderPage />} />

                  {/* Email Management Routes */}
                  <Route path="/creator/emails" element={<EmailManagementPage />} />
                  <Route path="/creator/emails/compose" element={<EmailComposerPage />} /> {/* New route for creating */}
                  <Route path="/creator/emails/compose/:templateId" element={<EmailComposerPage />} /> {/* New route for editing */}
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;