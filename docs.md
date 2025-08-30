# Project Documentation

This document provides an overview of the project's architecture, key features, and implementation details. It is intended to be a living document that evolves with the project.

## Table of Contents

*   [Project Structure](#project-structure)
*   [Vertical 0: Public Homepage & Role-Based Dashboards](#vertical-0-public-homepage--role-based-dashboards)
*   [Vertical 1: Pathway Templates & Phase Configuration](#vertical-1-pathway-templates--phase-configuration)
*   [Vertical 2: Campaign Management & Campaign Phases](#vertical-2-campaign-management--campaign-phases)
*   [Vertical 3: Programs & Individual Assignments](#vertical-3-programs--individual-assignments)
*   [Vertical 4: Application Management & Screening Phase](#vertical-4-application-management--screening-phase)
*   [Vertical 5: Review & Decision Phases](#vertical-5-review--decision-phases)
*   [Communication & Notifications](#communication--notifications)
*   [Reporting & Insights](#reporting--insights)
*   [User Profile Enhancements](#user-profile-enhancements)
*   [Homepage Footer & Dashboard Access Refinements](#homepage-footer--dashboard-access-refinements)

---

## Project Structure

The project follows a modular and domain-driven directory structure, aligning with the Next.js App Router and the Vertical Implementation Strategy (VIS).

```
/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (public)/         # Unauthenticated routes (marketing, apply, magic links)
│   │   ├── (portal)/         # Participant-facing portal routes
│   │   ├── (workbench)/      # Managers, coordinators, reviewers routes
│   │   ├── (admin)/          # Admin console routes
│   │   └── api/              # Versioned REST/GraphQL routes
│   ├── components/           # Shared UI components (including ui/ for Shadcn/UI)
│   ├── features/             # Vertical feature modules (e.g., pathway-templates, campaign-management, programs)
│   ├── lib/                  # Utility functions, helpers (e.g., utils.ts, schemas)
│   ├── services/             # Domain services (business logic)
│   ├── integrations/         # 3rd-party connectors (Supabase, Mailgun, etc.)
│   ├── db/                   # Database schema definitions, types
│   ├── hooks/                # Reusable React hooks
│   ├── context/              # Global state/context providers
│   └── styles/               # Additional global CSS/Tailwind config (if needed)
├── public/                   # Static assets
├── supabase/                 # Supabase functions, migrations
├── postcss.config.mjs        # PostCSS configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── components.json           # Shadcn/UI components configuration
├── LICENSE                   # Project license
├── netlify.toml              # Netlify deployment configuration
├── .gitignore                 # Git ignore rules
├── README.md                 # Project README
├── VIS.md                    # Vertical Implementation Strategy document
├── PRD.md                    # Product Requirements Document
├── AI_RULES.md               # AI Development Rules
├── M3Design.md               # Material Design 3 Specifications
├── errors.md                 # Error log
└── docs.md                   # Project documentation (this file)
```

---

## Vertical 0: Public Homepage & Role-Based Dashboards

**Objective:** To establish the foundational entry points for all users, including a public landing page and role-specific dashboards for authenticated users, with robust authentication and routing.

**Implementation Details:**

*   **Material Design 3 Styling:**
    *   The `src/app/globals.css` file has been updated to incorporate the Material Design 3 color palette, defining HSL values for both light and dark themes. This palette is derived from the primary brand seed color `#E91E63` and brand extension color `#880E4F`, ensuring M3 compliance and WCAG AA contrast ratios.
    *   `tailwind.config.ts` has been extended to map these new CSS variables to Tailwind utility classes, including primary, secondary, tertiary, destructive, card, popover, muted, accent, border, input, ring, and specific sidebar and chart colors. The `borderRadius` values have also been updated to align with M3 specifications (4px, 8px, 12px, 16px, 24px).
    *   The `src/components/ui/button.tsx` component now includes `onPrimary` and `onSecondary` variants to support text on primary and secondary color backgrounds, respectively, and the `text` variant has been enhanced with a hover underline for M3 compliance.
*   **Supabase Client Integration:**
    *   The existing `src/integrations/supabase/client.ts` is used for browser-side Supabase interactions.
    *   `@supabase/supabase-js`, `@supabase/auth-ui-react`, and `@supabase/auth-ui-shared` packages have been added to `package.json`.
*   **Session Management (`src/context/SessionContextProvider.tsx`):**
    *   A `SessionContextProvider` has been created to manage the Supabase authentication session and user state globally. It fetches the initial session and listens for authentication state changes, making `session` and `user` objects available via the `useSession` hook.
*   **Root Layout Integration (`src/app/layout.tsx`):**
    *   The `RootLayout` now wraps the application with `SessionContextProvider` to provide authentication context to all components.
    *   The `Toaster` component from `sonner` has been included for displaying consistent, non-intrusive notifications across the application.
*   **Login Page (`src/app/(public)/login/page.tsx`):**
    *   The login page now utilizes the `@supabase/auth-ui-react` component, styled with `ThemeSupa` and custom M3-compliant color variables.
    *   It includes client-side redirection logic to guide authenticated users to their respective role-based dashboards.
    *   The layout has been adjusted to ensure robust centering of the login card.
*   **Role-Based Dashboard Placeholders:**
    *   **`src/app/(admin)/dashboard/page.tsx`**: This page (formerly `console/page.tsx`) now features an M3-compliant dashboard with overview cards for "Total Users," "Active Campaigns," "Pending Applications," and "System Status." It also includes a "Quick Actions" section with `tonal` buttons linking to user management, system settings, and pathway templates. Access is strictly limited to the 'admin' role.
    *   **`src/app/(workbench)/desk/page.tsx`**: A placeholder for managers, reviewers, and screeners, offering a welcome and role-specific links (e.g., "Manage Campaigns," "View Assignments"). It restricts access to these specific roles.
    *   **`src/app/(portal)/home/page.tsx`**: This page (formerly `dashboard/page.tsx`) serves as the primary dashboard for applicants, displaying a welcome message and links to their applications and profile management. It enforces that only 'applicant' roles (or higher roles that can access portal) can view it.
    *   **`src/app/(portal)/test-page/page.tsx`**: A simple test page within the portal route group to verify routing and layout.
    *   Each dashboard page uses `createClient` from `src/integrations/supabase/server` to perform server-side user authentication and role verification, redirecting unauthorized users.
*   **Authentication Middleware (`middleware.ts`):**
    *   A Next.js middleware has been implemented to centralize authentication and authorization logic.
    *   It protects all routes except static assets and explicitly public pages (`/`, `/login`).
    *   It redirects unauthenticated users to `/login`.
    *   It enforces role-based access control, ensuring users can only access routes corresponding to their assigned roles (e.g., only 'admin' can access `/dashboard` routes).
    *   It also handles redirection for logged-in users attempting to access public pages, sending them to their appropriate dashboard.
*   **Public Homepage (`src/app/page.tsx`):**
    *   The public homepage has been enhanced with a welcoming message, a description of Global Gateway's offerings (Programs, Hiring, Awards), and clear calls to action for new and returning users. It uses `Card` components and Lucide icons for a visually appealing layout, adhering to M3 design principles, and now utilizes the new `onPrimary` button variant in the hero section.
*   **Error Handling (`src/app/error.tsx` and `src/app/(public)/error/[code]/page.tsx`):**
    *   A global client-side error boundary (`src/app/error.tsx`) has been implemented to catch unexpected React errors and provide a user-friendly fallback.
    *   Dynamic error pages (`src/app/(public)/error/[code]/page.tsx`) have been created to handle specific HTTP status codes (401, 403, 404, 500) with tailored messages, icons, and actionable buttons, ensuring a consistent and helpful user experience during errors.
*   **Authentication Service (`src/services/auth-service.ts`):**
    *   A utility service `authService` has been created to abstract common Supabase authentication operations like `signOut`, `getUser`, and `getSession`. This promotes reusability and keeps component logic clean.
*   **Header (`src/components/layout/Header.tsx`):**
    *   The universal header now displays the app title with `text-foreground` for better visual balance and includes user authentication status with a dropdown menu for logged-in users.
*   **Sign-in/Sign-up Forms (`src/features/auth/components/SignInForm.tsx`, `src/features/auth/components/SignUpForm.tsx`):**
    *   Forms have been refined with consistent M3 typography and spacing, ensuring `FormItem` elements have `space-y-2` and `FormMessage` uses `text-body-small`.

---

## Vertical 1: Pathway Templates & Phase Configuration

**Objective:** To enable administrators and creators to design, standardize, and reuse complex multi-phase workflows for any program type through configurable templates and dynamic phase settings.

**Implementation Details:**

*   **Vertical 1.1: Basic Pathway Template Management (CRUD & Listing)**
    *   **Database Schema (`public.pathway_templates`):**
        *   Table created with `id`, `creator_id`, `name`, `description`, `is_private`, `created_at`, `updated_at` columns.
        *   **Row Level Security (RLS)** enabled with policies for `SELECT` (own or public templates), `INSERT` (own templates), `UPDATE` (own templates), and `DELETE` (own templates). Super admin override is handled at the Server Action layer.
    *   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
        *   Functions `getPathwayTemplates`, `getPathwayTemplateById`, `createPathwayTemplate`, `updatePathwayTemplate`, `deletePathwayTemplate` are implemented for direct database interaction.
    *   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
        *   Server Actions `getTemplatesAction`, `getTemplateByIdAction`, `createPathwayTemplateAction`, `updatePathwayTemplateAction`, `deletePathwayTemplateAction` are implemented.
        *   Crucial server-side authorization logic (`authorizeTemplateAction`) is applied to all actions, checking `creator_id` and `user_metadata.role` (for 'admin' override) to enforce access control before database operations. Unauthorized access attempts redirect to appropriate error pages (401, 403, 404, 500).
    *   **Frontend (UI - `src/app/(workbench)/pathway-templates/page.tsx`, `src/features/pathway-templates/components/PathwayTemplateList.tsx`, `src/features/pathway-templates/components/PathwayTemplateForm.tsx`):**
        *   **`src/app/(workbench)/pathway-templates/page.tsx` (Server Component):** Responsible for initial data fetching of templates using `getTemplatesAction()` and rendering the `PathwayTemplateList` component.
        *   **`src/features/pathway-templates/components/PathwayTemplateList.tsx` (Client Component):**
            *   Fetches templates using `getTemplatesAction()` (or receives initial data from Server Component).
            *   Renders M3 `Card` components for each template.
            *   **Conditional UI:** Displays a lock icon for private templates.
            *   **Conditional Actions:** "Edit" and "Delete" buttons will be conditionally rendered/enabled based on the `creator_id` of the template and the current user's `user_metadata.role` (obtained from `useSession`).
            *   Handles "Create New Template" button click (navigates to `/workbench/pathway-templates/new`).
            *   Handles "Edit" button click (navigates to `/workbench/pathway-templates/[id]`).
            *   Handles "Delete" button click (triggers `AlertDialog` and calls `deletePathwayTemplateAction`).
            *   Implements `Skeleton` for loading states.
            *   Implements filter options for "My Templates," "Public Templates," and "All Templates (Admin Only)" (if admin).
        *   **`src/features/pathway-templates/components/PathwayTemplateForm.tsx` (Client Component):**
            *   Used for both creating (`/workbench/pathway-templates/new`) and editing (`/workbench/pathway-templates/[id]`).
            *   Utilizes `react-hook-form` with `zod` resolver for form state and validation.
            *   Renders M3 `Input` for name, `Textarea` for description, and an M3 `Switch` for `is_private`.
            *   Submits data using the appropriate Server Action (`createPathwayTemplateAction` or `updatePathwayTemplateAction`).
            *   Displays `sonner` toasts for feedback.

*   **Vertical 1.2: Basic Phase Management (Add, Delete, Reorder)**
    *   **Database Schema (`public.phases`):**
        *   Table created with `id`, `pathway_template_id`, `name`, `type`, `description`, `order_index`, `config`, `created_at`, `updated_at` columns.
        *   **Row Level Security (RLS)** enabled with policies for `SELECT` (phases of own or public templates), `UPDATE` (phases of own templates), `DELETE` (phases of own templates), and a simplified `INSERT` policy (`WITH CHECK (true)`) with full authorization handled at the Server Action layer due to Supabase RLS limitations with `NEW` in subqueries.
    *   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
        *   Functions `getPhasesByPathwayTemplateId`, `createPhase`, `updatePhase`, `deletePhase` are implemented.
    *   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
        *   Server Actions `getPhasesAction`, `createPhaseAction`, `updatePhaseAction`, `deletePhaseAction`, `reorderPhasesAction` are implemented.
        *   All phase-related Server Actions include robust authorization logic (`authorizeTemplateAction`) to ensure only the `creator_id` of the parent template or a 'super admin' can modify phases.
    *   **Frontend (UI - `src/app/(workbench)/pathway-templates/[id]/page.tsx`, `src/features/pathway-templates/components/PathwayTemplateDetail.tsx`, `src/features/pathway-templates/components/PhaseCard.tsx`, `src/features/pathway-templates/components/PhaseFormDialog.tsx`):**
        *   **`src/app/(workbench)/pathway-templates/[id]/page.tsx` (Server Component):** Fetches the specific `PathwayTemplate` and its associated `Phases` using Server Actions. Renders `PathwayTemplateDetail`.
        *   **`src/features/pathway-templates/components/PathwayTemplateDetail.tsx` (Client Component):**
            *   Displays template details and a section for phases.
            *   Manages the state of phases for drag-and-drop using `@hello-pangea/dnd`.
            *   Renders `PhaseCard` components.
            *   **Conditional Actions:** "Add Phase," "Edit Phase," "Delete Phase," and drag-and-drop functionality are conditionally rendered/enabled based on user authorization.
            *   Handles "Add Phase" button click (opens `PhaseFormDialog`).
            *   Implements drag-and-drop to reorder `PhaseCard` components, calling `reorderPhasesAction` on drop.
        *   **`src/features/pathway-templates/components/PhaseCard.tsx` (Client Component):**
            *   Displays individual phase details, includes a drag handle, and M3 `Button` components for "Edit Phase" and "Delete Phase."
        *   **`src/features/pathway-templates/components/PhaseFormDialog.tsx` (Client Component):**
            *   An M3 `Dialog` for creating or editing phase `name`, `type`, and `description`.
            *   Uses `react-hook-form` and `zod` for validation.
            *   Submits data to `createPhaseAction` or `updatePhaseAction`.

*   **Vertical 1.3: Phase-Specific Configuration (Initial Form & Review)**
    *   **Data Layer:** The `config` (JSONB) field in `public.phases` stores detailed settings for each phase type.
    *   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
        *   The `updatePhase` function is extended to correctly store updates to the `config` JSONB field.
    *   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
        *   `updatePhaseConfigAction(phaseId: string, pathwayTemplateId: string, configUpdates: Record<string, any>)` is implemented with full authorization.
    *   **Frontend (UI - `src/features/pathway-templates/components/PhaseConfigurationPanel.tsx`, and `src/features/pathway-templates/components/phase-configs/*.tsx`):**
        *   **`src/features/pathway-templates/components/PhaseConfigurationPanel.tsx` (Client Component):** Dynamically renders specific configuration sub-components (`FormPhaseConfig`, `ReviewPhaseConfig`, `EmailPhaseConfig`, `SchedulingPhaseConfig`, `DecisionPhaseConfig`, `RecommendationPhaseConfig`) based on `phase.type`. It passes `phase.config` and handles updates via `updatePhaseConfigAction`.
        *   **`src/features/pathway-templates/components/phase-configs/FormPhaseConfig.tsx` (Client Component):** UI for defining form fields with dynamic array management using `react-hook-form` and `zod`.
        *   **`src/features/pathway-templates/components/phase-configs/ReviewPhaseConfig.tsx` (Client Component):** UI for defining rubric criteria, scoring scales, and anonymization settings.
        *   **`src/features/pathway-templates/components/phase-configs/EmailPhaseConfig.tsx` (Client Component):** UI for defining email subject, body, recipient roles, and trigger events.
        *   **`src/features/pathway-templates/components/phase-configs/SchedulingPhaseConfig.tsx` (Client Component):** UI for defining interview duration, buffer time, and host selection.
        *   **`src/features/pathway-templates/components/phase-configs/DecisionPhaseConfig.tsx` (Client Component):** UI for defining decision outcomes, associated email templates, and automated next steps.
        *   **`src/features/pathway-templates/components/phase-configs/RecommendationPhaseConfig.tsx` (Client Component):** UI for defining number of recommenders, recommender information fields, and reminder schedules.

*   **Vertical 1.4: Template Cloning**
    *   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
        *   `clonePathwayTemplate(templateId: string, newName: string, creatorId: string)` is implemented to perform a deep copy of a template and its phases.
    *   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
        *   `clonePathwayTemplateAction(templateId: string, newName: string)` is implemented with authorization to ensure only authenticated users can clone viewable templates.
    *   **Frontend (UI - `src/features/pathway-templates/components/CloneTemplateDialog.tsx`):**
        *   An M3 `Dialog` (`CloneTemplateDialog`) is used for inputting the new template name.
        *   A "Clone" M3 `Button` is added to `PathwayTemplateList` and `PathwayTemplateDetail` to trigger the dialog.

---

## Vertical 2: Campaign Management & Campaign Phases

**Objective:** To enable users to create, manage, and monitor live instances of programs (campaigns) based on pathway templates, including the configuration and reordering of campaign-specific phases.

**Implementation Details:**

*   **Vertical 2.1: Basic Campaign Management (CRUD & Listing)**
    *   **Database Schema (`public.campaigns`):**
        *   Table created with `id`, `pathway_template_id`, `creator_id`, `name`, `description`, `start_date`, `end_date`, `is_public`, `status`, `config`, `created_at`, `updated_at` columns.
        *   **Row Level Security (RLS)** enabled with policies for `SELECT` (own, public, or campaigns within own programs), `INSERT` (own or within own programs), `UPDATE` (own or within own programs), and `DELETE` (own or within own programs). Admin override is handled at the Server Action layer.
    *   **Service Layer (`src/features/campaigns/services/campaign-service.ts`):**
        *   Functions `getCampaigns`, `getCampaignById`, `createCampaign`, `updateCampaign`, `deleteCampaign` are implemented.
    *   **Backend (Next.js Server Actions - `src/features/campaigns/actions.ts`):**
        *   Server Actions `getCampaignsAction`, `getCampaignByIdAction`, `createCampaignAction`, `updateCampaignAction`, `deleteCampaignAction` are implemented.
        *   Authorization logic (`authorizeCampaignAction`) is applied to all actions, checking `creator_id`, `program_id` (for program ownership), and `user_metadata.role` (for 'admin' override).
    *   **Frontend (UI - `src/app/(workbench)/campaigns/page.tsx`, `src/features/campaigns/components/CampaignList.tsx`, `src/features/campaigns/components/CampaignForm.tsx`):**
        *   **`src/app/(workbench)/campaigns/page.tsx` (Server Component):** Fetches initial campaign data and renders `CampaignList`.
        *   **`src/features/campaigns/components/CampaignList.tsx` (Client Component):**
            *   Displays M3 `Card` components for campaigns with conditional UI for public/private status.
            *   Includes search and filter options.
            *   Handles "Create New Campaign," "Edit," and "Delete" actions.
        *   **`src/features/campaigns/components/CampaignForm.tsx` (Client Component):**
            *   Used for creating and editing campaigns.
            *   Includes fields for `name`, `description`, `pathway_template_id` (using `Select` with data from `getTemplatesAction`), `start_date`, `end_date` (using `Calendar` in `Popover`), `is_public` (using `Switch`), and `status`.
            *   Submits data via `createCampaignAction` or `updateCampaignAction`.

*   **Vertical 2.2: Campaign Phase Management (Deep Copy, Add, Delete, Reorder)**
    *   **Database Schema (`public.campaign_phases`):**
        *   Table created with `id`, `campaign_id`, `original_phase_id`, `name`, `type`, `description`, `order_index`, `config`, `created_at`, `updated_at` columns.
        *   **Row Level Security (RLS)** enabled with policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` based on the parent campaign's authorization.
    *   **Service Layer (`src/features/campaigns/services/campaign-service.ts`):**
        *   Functions `getCampaignPhasesByCampaignId`, `createCampaignPhase`, `updateCampaignPhase`, `deleteCampaignPhase`, `deepCopyPhasesFromTemplate` are implemented.
    *   **Backend (Next.js Server Actions - `src/features/campaigns/actions.ts`):**
        *   Server Actions `getCampaignPhasesAction`, `createCampaignPhaseAction`, `updateCampaignPhaseAction`, `deleteCampaignPhaseAction`, `reorderCampaignPhasesAction` are implemented with full authorization checks against the parent campaign.
    *   **Frontend (UI - `src/app/(workbench)/campaigns/[id]/page.tsx`, `src/features/campaigns/components/CampaignDetail.tsx`, `src/features/campaigns/components/CampaignPhaseCard.tsx`, `src/features/campaigns/components/CampaignPhaseFormDialog.tsx`):**
        *   **`src/app/(workbench)/campaigns/[id]/page.tsx` (Server Component):** Fetches campaign and its phases. Renders `CampaignDetail`.
        *   **`src/features/campaigns/components/CampaignDetail.tsx` (Client Component):**
            *   Displays campaign details and a section for campaign phases.
            *   Implements drag-and-drop for phases using `@hello-pangea/dnd`.
            *   **Conditional Actions:** "Add New Phase," "Edit Phase," "Delete Phase," and drag-and-drop are conditional based on user authorization.
        *   **`src/features/campaigns/components/CampaignPhaseCard.tsx` (Client Component):** Displays individual campaign phase details with actions.
        *   **`src/features/campaigns/components/CampaignPhaseFormDialog.tsx` (Client Component):** M3 `Dialog` for creating/editing campaign phase details.

*   **Vertical 2.3: Campaign Phase-Specific Configuration**
    *   **Backend (Next.js Server Actions - `src/features/campaigns/actions.ts`):**
        *   `updateCampaignPhaseConfigAction(phaseId: string, campaignId: string, configUpdates: Record<string, any>)` is implemented with full authorization.
    *   **Frontend (UI - `src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx`):**
        *   **`src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx` (Client Component):** Reuses the `PhaseConfigurationPanel` and `phase-configs` components from `pathway-templates` by passing a campaign-specific `updatePhaseConfigAction` wrapper. This demonstrates the reusability of phase configuration logic.

---

## Vertical 3: Programs & Individual Assignments

**Objective:** To introduce a higher-level "Program" entity to group related campaigns and to enable the assignment of internal staff (e.g., program managers, coordinators) to these programs.

**Implementation Details:**

*   **Database Schema (`public.programs`):**
    *   Table created with `id`, `creator_id`, `name`, `description`, `start_date`, `end_date`, `status`, `created_at`, `updated_at` columns.
    *   **Row Level Security (RLS)** enabled with policies for `SELECT` (own or admin), `INSERT` (own), `UPDATE` (own or admin), and `DELETE` (own or admin).
*   **Database Schema (`public.campaigns` update):**
    *   `program_id` column added as a foreign key to `public.programs`.
    *   RLS policies for `campaigns` updated to allow program creators (and admins) to view, insert, update, and delete campaigns associated with their programs. The `INSERT` policy was simplified to work around Supabase RLS limitations with `NEW` in subqueries, with full authorization handled in Server Actions.
*   **Service Layer (`src/features/programs/services/program-service.ts`):**
    *   New service `programService` created with functions `getPrograms`, `getProgramById`, `createProgram`, `updateProgram`, `deleteProgram`.
    *   The `Program` interface is reused from `src/features/campaigns/services/campaign-service.ts` to maintain a single source of truth for the Program type.
*   **Backend (Next.js Server Actions - `src/features/programs/actions.ts`):
    *   Server Actions `getProgramsAction`, `getProgramByIdAction`, `createProgramAction`, `updateProgramAction`, `deleteProgramAction` are implemented.
    *   Authorization logic (`authorizeProgramAction`) is applied to all actions, checking `creator_id` and `user_metadata.role` (for 'admin' override).
    *   `createCampaignAction` and `updateCampaignAction` in `src/features/campaigns/actions.ts` are updated to include authorization checks for `program_id` when linking campaigns to programs.
*   **Frontend (UI - `src/app/(workbench)/programs/*`, `src/features/programs/components/ProgramList.tsx`, `src/features/programs/components/ProgramForm.tsx`, `src/features/programs/components/ProgramDetail.tsx`, `src/features/campaigns/components/CampaignListForProgram.tsx`):**
    *   **`src/app/(workbench)/programs/page.tsx` (Server Component):** Renders `ProgramList`.
    *   **`src/app/(workbench)/programs/new/page.tsx` (Server Component):** Renders `ProgramForm` for creation.
    *   **`src/app/(workbench)/programs/[id]/page.tsx` (Server Component):** Renders `ProgramDetail`.
    *   **`src/app/(workbench)/programs/[id]/edit/page.tsx` (Server Component):** Renders `ProgramForm` for editing.
    *   **`src/features/programs/components/ProgramList.tsx` (Client Component):** Displays a list of programs with CRUD actions, search, and filter by ownership.
    *   **`src/features/programs/components/ProgramForm.tsx` (Client Component):** Form for creating/editing program details, including name, description, dates, and status.
    *   **`src/features/programs/components/ProgramDetail.tsx` (Client Component):** Displays program details and includes a new `CampaignListForProgram` component to show associated campaigns. It also provides a button to "Add New Campaign" pre-filling the `programId`.
    *   **`src/features/campaigns/components/CampaignListForProgram.tsx` (Client Component):** A new component to display campaigns filtered by a specific `programId`. It reuses existing campaign card UI and actions, adapting them for display within a program's detail view.
*   **Sidebar Update (`src/components/layout/Sidebar.tsx`):**
    *   A new navigation link for "Programs" has been added under "Workbench Tools."

---

## Vertical 4: Application Management & Screening Phase

**Objective:** To enable applicants to submit applications and internal staff (recruiters/screeners) to manage and screen these applications, including internal checklists and collaborative notes, while maintaining applicant privacy.

**Implementation Details:**

*   **Database Schema (`public.applications`):**
    *   Table created with `id`, `campaign_id`, `applicant_id`, `current_campaign_phase_id`, `status`, `screening_status`, `data` (JSONB), `created_at`, `updated_at` columns.
    *   **Row Level Security (RLS)** enabled with policies for `SELECT` (applicant's own, campaign creator's, or public campaigns), `INSERT` (applicant's own), `UPDATE` (applicant's own for general data, campaign creator/admin for screening status/phase), and `DELETE` (campaign creator/admin).
*   **Database Schema (`public.application_notes`):**
    *   Table created with `id`, `application_id`, `author_id`, `content`, `created_at`, `updated_at` columns.
    *   **Row Level Security (RLS)** enabled with policies for `SELECT` (authorized users of parent application), `INSERT` (campaign creator/admin), `UPDATE` (author or admin), `DELETE` (author or admin).
*   **Service Layer (`src/features/applications/services/application-service.ts`):**
    *   New service `applicationService` created with functions for application CRUD (`getApplications`, `getApplicationById`, `createApplication`, `updateApplication`, `deleteApplication`) and collaborative notes management (`getApplicationNotes`, `createApplicationNote`, `updateApplicationNote`, `deleteApplicationNote`).
*   **Backend (Next.js Server Actions - `src/features/applications/actions.ts`):**
    *   Server Actions for application management (`getApplicationsAction`, `getApplicationByIdAction`, `createApplicationAction`, `updateApplicationAction`, `deleteApplicationAction`) and notes management (`getApplicationNotesAction`, `createApplicationNoteAction`, `updateApplicationNoteAction`, `deleteApplicationNoteAction`) are implemented.
    *   Robust authorization logic (`authorizeApplicationAction`, `authorizeNoteAction`) is applied to all actions, ensuring strict role-based access control.
*   **Frontend (UI - `src/app/(workbench)/applications/screening/page.tsx`, `src/app/(workbench)/applications/[id]/page.tsx`, `src/features/applications/components/ScreeningDashboard.tsx`, `src/features/applications/components/ApplicationDetail.tsx`, `src/features/applications/components/ScreeningChecklist.tsx`, `src/features/applications/components/CollaborativeNotes.tsx`, `src/features/applications/components/WorkflowParticipation.tsx`):**
    *   **`src/app/(workbench)/applications/screening/page.tsx` (Server Component):** Renders `ScreeningDashboard`.
    *   **`src/features/applications/components/ScreeningDashboard.tsx` (Client Component):**
        *   Displays a list of applications in a card-based layout, showing applicant name, campaign, current phase, and screening status.
        *   Includes search, filter by status, and filter by campaign.
        *   Provides quick actions to update screening status (Accept, On Hold, Deny) and view application details.
        *   Access is restricted to 'admin', 'coordinator', 'evaluator', 'screener' roles.
    *   **`src/app/(workbench)/applications/[id]/page.tsx` (Server Component):** Renders `ApplicationDetail`.
    *   **`src/features/applications/components/ApplicationDetail.tsx` (Client Component):**
        *   Displays comprehensive details of a single application, including applicant info, campaign details, and overall status.
        *   Integrates `ScreeningChecklist`, `CollaborativeNotes`, and `WorkflowParticipation` components.
        *   Conditional UI and actions based on user role (applicant, campaign creator, admin).
    *   **`src/features/applications/components/ScreeningChecklist.tsx` (Client Component):**
        *   An internal tool for recruiters/screeners to manage a dynamic checklist for each application.
        *   Uses `react-hook-form` with `useFieldArray` for repeatable checklist items.
        *   Data is stored in the `data` (JSONB) field of the `applications` table.
        *   Only visible and modifiable by authorized internal staff.
    *   **`src/features/applications/components/CollaborativeNotes.tsx` (Client Component):**
        *   Enables internal team members to add and manage private notes on an application.
        *   Displays notes chronologically with author and timestamp.
        *   Supports editing and deleting notes by the author or admin.
        *   Only visible and modifiable by authorized internal staff.
    *   **`src/features/applications/components/WorkflowParticipation.tsx` (Client Component):**
        *   Provides a visual overview of the applicant's progress through the campaign's phases.
        *   Displays each phase with an icon indicating its status (pending, in progress, completed, rejected).
        *   Dynamically fetches campaign phases and highlights the `current_campaign_phase_id`.
*   **Sidebar Update (`src/components/layout/Sidebar.tsx`):**
    *   A new navigation link for "Applications Screening" has been added under "Workbench Tools."

---

## Vertical 5: Review & Decision Phases

**Objective:** To provide tools for reviewers to submit evaluations and for authorized personnel to record final decisions for applications, integrating with the application workflow.

**Implementation Details:**

*   **Database Schema (`public.reviews`):**
    *   Table created with `id`, `application_id`, `reviewer_id`, `campaign_phase_id`, `score` (JSONB), `comments`, `status`, `created_at`, `updated_at` columns.
    *   **Row Level Security (RLS)** enabled with policies for `SELECT` (reviewer's own, campaign creator's, or admin), `INSERT` (authenticated users), `UPDATE` (reviewer's own or admin), `DELETE` (reviewer's own or admin).
*   **Database Schema (`public.reviewer_assignments`):**
    *   Table created with `id`, `application_id`, `reviewer_id`, `campaign_phase_id`, `status`, `assigned_at`, `completed_at`, `created_at`, `updated_at` columns.
    *   **Row Level Security (RLS)** enabled with policies for `SELECT` (reviewer's own, campaign creator's, or admin), `INSERT` (campaign creator/admin), `UPDATE` (reviewer's own or admin/creator), `DELETE` (admin/creator).
*   **Database Schema (`public.decisions`):**
    *   Table created with `id`, `application_id`, `campaign_phase_id`, `decider_id`, `outcome`, `notes`, `is_final`, `created_at`, `updated_at` columns.
    *   **Row Level Security (RLS)** enabled with policies for `SELECT` (applicant's final decisions, campaign creator's, or admin), `INSERT` (campaign creator/admin), `UPDATE` (campaign creator/admin), `DELETE` (campaign creator/admin).
*   **Service Layer (`src/features/evaluations/services/evaluation-service.ts`):**
    *   New service `evaluationService` created with functions for:
        *   Reviewer Assignments: `getReviewerAssignments`, `createReviewerAssignment`, `updateReviewerAssignment`, `deleteReviewerAssignment`.
        *   Reviews: `getReviews`, `createReview`, `updateReview`, `deleteReview`.
        *   Decisions: `getDecisions`, `createDecision`, `updateDecision`, `deleteDecision`.
*   **Backend (Next.js Server Actions - `src/features/evaluations/actions.ts`):**
    *   Server Actions for all evaluation-related operations are implemented.
    *   Authorization logic (`authorizeApplicationAccessForEvaluation`, `authorizeNoteAction` - for reviews/decisions on an application) is applied to ensure strict role-based access.
*   **Frontend (UI - `src/app/(workbench)/evaluations/my-reviews/page.tsx`, `src/features/evaluations/components/ReviewerDashboard.tsx`, `src/features/evaluations/components/ReviewForm.tsx`, `src/features/evaluations/components/DecisionForm.tsx`, `src/features/evaluations/components/DecisionList.tsx`):**
    *   **`src/app/(workbench)/evaluations/my-reviews/page.tsx` (Server Component):** Renders `ReviewerDashboard`.
    *   **`src/features/evaluations/components/ReviewerDashboard.tsx` (Client Component):**
        *   Provides a personalized dashboard for reviewers, displaying their assigned applications and submitted/pending reviews.
        *   Includes filters and actions to update assignment status (Accept, Decline, Complete) and initiate/edit reviews.
        *   Access is restricted to 'reviewer', 'admin', 'coordinator', 'evaluator', 'screener' roles.
    *   **`src/features/evaluations/components/ReviewForm.tsx` (Client Component):**
        *   An M3 `Dialog` for reviewers to submit or edit their evaluation.
        *   Dynamically renders rubric criteria based on the `campaign_phase` configuration.
        *   Uses `react-hook-form` for scoring and comments.
        *   Submits data via `createReviewAction` or `updateReviewAction`.
    *   **`src/features/evaluations/components/DecisionForm.tsx` (Client Component):**
        *   An M3 `Dialog` for authorized users (admin/campaign creator) to record or edit a decision.
        *   Dynamically renders decision outcomes based on the `campaign_phase` configuration.
        *   Includes fields for `outcome`, `notes`, and `is_final` (using `Switch`).
        *   Submits data via `createDecisionAction` or `updateDecisionAction`.
    *   **`src/features/evaluations/components/DecisionList.tsx` (Client Component):**
        *   Displays all recorded decisions for a given application.
        *   Includes details like outcome, decider, notes, and final status.
        *   Provides actions to edit or delete decisions for authorized users.
    *   **`src/features/applications/components/ApplicationDetail.tsx` (Client Component):**
        *   Integrated `ReviewForm` and `DecisionForm` dialogs, allowing direct interaction from the application detail view.
        *   Displays existing decisions using `DecisionList`.
*   **Sidebar Update (`src/components/layout/Sidebar.tsx`):**
    *   A new navigation link for "My Reviews" has been added under "Workbench Tools."

---

## Communication & Notifications

**Objective:** To provide a centralized system for managing reusable communication templates (email, in-app, SMS) and integrating them into various workflow phases.

**Implementation Details:**

*   **Database Schema (`public.communication_templates`):**
    *   Table created with `id`, `creator_id`, `name`, `subject`, `body`, `type` (`email`, `in-app`, `sms`), `is_public`, `created_at`, `updated_at` columns.
    *   **Row Level Security (RLS)** enabled with policies for `SELECT` (own or public templates), `INSERT` (own templates), `UPDATE` (own templates), and `DELETE` (own templates). Admin override is handled at the Server Action layer.
*   **Service Layer (`src/features/communications/services/communication-service.ts`):**
    *   New service `communicationService` created with functions `getCommunicationTemplates`, `getCommunicationTemplateById`, `createCommunicationTemplate`, `updateCommunicationTemplate`, `deleteCommunicationTemplate` for CRUD operations.
*   **Backend (Next.js Server Actions - `src/features/communications/actions.ts`):**
    *   Server Actions `getCommunicationTemplatesAction`, `getCommunicationTemplateByIdAction`, `createCommunicationTemplateAction`, `updateCommunicationTemplateAction`, `deleteCommunicationTemplateAction` are implemented.
    *   Authorization logic (`authorizeCommunicationTemplateAction`) is applied to all actions, checking `creator_id` and `user_metadata.role` (for 'admin' override).
*   **Frontend (UI - `src/app/(workbench)/communications/templates/page.tsx`, `src/app/(workbench)/communications/templates/new/page.tsx`, `src/app/(workbench)/communications/templates/[id]/edit/page.tsx`, `src/features/communications/components/CommunicationTemplateList.tsx`, `src/features/communications/components/CommunicationTemplateForm.tsx`):**
    *   **`src/app/(workbench)/communications/templates/page.tsx` (Server Component):** Renders `CommunicationTemplateList`.
    *   **`src/app/(workbench)/communications/templates/new/page.tsx` (Server Component):** Renders `CommunicationTemplateForm` for creation.
    *   **`src/app/(workbench)/communications/templates/[id]/edit/page.tsx` (Server Component):** Renders `CommunicationTemplateForm` for editing.
    *   **`src/features/communications/components/CommunicationTemplateList.tsx` (Client Component):** Displays a list of communication templates with CRUD actions, search, and filters by type and ownership.
    *   **`src/features/communications/components/CommunicationTemplateForm.tsx` (Client Component):** Form for creating/editing communication template details, including name, subject, body, type, and public/private status.
*   **Integration with Email Phase Configuration (`src/features/pathway-templates/components/phase-configs/EmailPhaseConfig.tsx`):**
    *   The `EmailPhaseConfig` component has been updated to fetch and display available `CommunicationTemplates` of type 'email'.
    *   Users can now select an existing template to pre-fill the subject and body fields of the email phase configuration.
*   **Sidebar Update (`src/components/layout/Sidebar.tsx`):**
    *   A new navigation link for "Communication Templates" has been added under "Workbench Tools."

---

## Reporting & Insights

**Objective:** To provide administrators and coordinators with dashboards and reports to monitor application and campaign performance.

**Implementation Details:**

*   **Data Layer:** Leverages existing `applications` and `campaigns` tables for data aggregation. No new database tables are created in this initial phase.
*   **Service Layer (`src/features/reports/services/report-service.ts`):**
    *   New service `reportService` created with `getApplicationOverviewReport()` function.
    *   This function queries Supabase to get counts of total applications, applications by status, and applications by campaign.
*   **Backend (Next.js Server Actions - `src/features/reports/actions.ts`):**
    *   Server Action `getApplicationOverviewReportAction()` is implemented.
    *   **Authorization Logic:** Access is restricted to users with 'admin' or 'coordinator' roles. Unauthorized users are redirected to a 403 error page.
*   **Frontend (UI - `src/app/(workbench)/reports/page.tsx`, `src/features/reports/components/ReportDashboard.tsx`):**
    *   **`src/app/(workbench)/reports/page.tsx` (Server Component):** Renders the `ReportDashboard` component.
    *   **`src/features/reports/components/ReportDashboard.tsx` (Client Component):**
        *   Fetches report data using `getApplicationOverviewReportAction()`.
        *   Displays key metrics in M3-styled `Card` components (Total Applications, Pending/In Review, Accepted, Rejected).
        *   Visualizes data using `recharts` components:
            *   A `BarChart` for "Applications by Status".
            *   A `PieChart` for "Applications by Campaign".
        *   Includes loading states with `Skeleton` components.
        *   Ensures M3 design principles for typography, colors, and component styling.
*   **Sidebar Update (`src/components/layout/Sidebar.tsx`):**
    *   A new navigation link for "Reports" has been added under "Workbench Tools."

---

## User Profile Enhancements

**Objective:** To enrich user profiles with more detailed personal and professional information and ensure this data is securely managed and displayed.

**Implementation Details:**

*   **`src/types/supabase.ts`**: The `Profile` interface has been updated to include an `email: string | null` field, allowing the user's email to be consistently typed and used across the application.
*   **`src/features/user-profile/services/profile-service.ts`**: The `getProfileById` and `updateProfile` functions have been modified to perform a join with the `auth.users` table. This allows the user's email to be fetched alongside their profile data, ensuring that the `Profile` object is complete with both custom profile fields and core authentication details.
*   **`src/features/user-profile/components/ProfileHeader.tsx`**: The component now correctly displays the user's email address (fetched from `auth.users`) in the contact information section, replacing the previous display of the user's UUID. This provides a more intuitive and complete user experience.
*   **Existing Profile Fields**: The `ProfileForm.tsx`, `ProfileBio.tsx`, and `ProfileHeader.tsx` components already support the display and editing of additional profile fields such as `job_title`, `organization`, `location`, `phone_number`, `linkedin_url`, `orcid_url`, `website_url`, and `bio`, adhering to Material Design 3 principles for input fields and layout.

---

## Homepage Footer & Dashboard Access Refinements

**Objective:** To refine the public homepage footer for better branding and to enhance dashboard access control and error handling for authenticated users, particularly administrators.

**Implementation Details:**

*   **Homepage Footer (`src/app/page.tsx`):**
    *   The footer has been restructured into a three-column layout using Tailwind CSS grid.
    *   The first column now prominently features the "Global Gateway" branding with an `Award` icon, a descriptive tagline, and an updated copyright notice (`© 2025-30 Global Citizenship Foundation. All rights reserved.`).
    *   The remaining two columns are left empty for future content.
*   **Dashboard Access Control (`src/app/(admin)/dashboard/page.tsx`, `src/app/(portal)/home/page.tsx`, `src/app/(workbench)/desk/page.tsx`):**
    *   The internal role-based authorization checks within each dashboard page have been updated.
    *   If an authenticated user attempts to access a dashboard for which they do not have the required role, they are now explicitly redirected to the `/error/403` (Forbidden) page. This ensures consistent and informative error feedback, preventing potential fallback to `/login` or unexpected 404 errors for authenticated but unauthorized users.

---

## Summary of Current Progress and Next Steps

**What has been done:**
*   **Vertical 0 (Foundation):** Public Homepage, Authentication, Role-Based Dashboards, and core M3 styling are fully implemented. This includes robust Supabase integration, session management, login/signup, role-based redirects, authentication middleware, comprehensive error handling, and the correct setup of the `(portal)` route group with its root URL paths.
*   **Vertical 1 (Pathway Templates & Phase Configuration):** Fully implemented, including CRUD for templates, phase management (add, delete, reorder), phase-specific configuration for all types (Form, Review, Email, Scheduling, Decision, Recommendation), and template cloning.
*   **Vertical 2 (Campaign Management & Campaign Phases):** Fully implemented, including CRUD for campaigns, deep copying phases from templates, campaign phase management (add, delete, reorder), and campaign phase-specific configuration.
*   **Vertical 3 (Programs):** The "Programs" entity for grouping campaigns is implemented, including CRUD operations and linking campaigns to programs. (Note: "Individual Assignments" part of this vertical is not yet explicitly implemented as a separate feature, but reviewer assignments are covered in Vertical 5).
*   **Vertical 4 (Application Management & Screening Phase):** Fully implemented, including application CRUD, internal screening checklists, collaborative notes, and workflow participation visualization.
*   **Vertical 5 (Review & Decision Phases):** Fully implemented, including reviewer assignments, review submission/editing, and decision recording/management.
*   **Communication & Notifications (Templates):** Fully implemented, including CRUD for communication templates and integration with email phase configuration.
*   **Reporting & Insights:** Fully implemented, providing an application overview dashboard with key metrics and charts.
*   **User Profile Enhancements:** Fully implemented, allowing users to manage detailed personal and professional information, including email display from `auth.users`.
*   **Homepage Footer & Dashboard Access Refinements:** Implemented for improved branding and consistent error handling.
*   **Routing Fixes:** Corrected all navigation links in the sidebar, middleware redirection logic, and client-side login redirects to align with the new root paths for Admin (`/dashboard`), Workbench (`/desk`), and Portal (`/home`) route groups. The Admin Console page has been renamed to Admin Dashboard.

**What to do next:**
Based on the `Architecture.md` roadmap, the next logical step is to focus on the remaining aspects of **Vertical 3: Packages & Individual Assignments**. Specifically, we should implement the "Packages" concept, which could involve grouping multiple campaigns or pathways together, and further define "Individual Assignments" beyond just reviewer assignments, potentially for assigning specific tasks or roles to users within a program or campaign. This will involve:
1.  **Database Schema:** Defining a new table (e.g., `packages`) and potentially a `package_assignments` table.
2.  **Service Layer:** Developing new services for package and assignment management.
3.  **Backend (Server Actions):** Creating Server Actions to interact with these new services.
4.  **Frontend (UI):** Building the UI for creating, viewing, and managing packages and individual assignments.