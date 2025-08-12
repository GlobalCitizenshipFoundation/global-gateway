import { Toaster } from "@/components/ui/toaster";
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
import WorkflowTemplatesPage from "./pages/WorkflowTemplatesPage";
import WorkflowBuilderPage from "./pages/WorkflowBuilderPage"; // Import the new page
import { ThemeProvider } from "next-themes";

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
        <Toaster />
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

                  {/* Workflow Templates Routes */}
                  <Route path="/creator/workflow-templates" element={<WorkflowTemplatesPage />} />
                  <Route path="/creator/workflow-templates/:templateId/edit" element={<WorkflowBuilderPage />} /> {/* New route */}
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