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
    *   **`src/app/(portal)/dashboard/page.tsx`**: A placeholder for applicants, displaying a welcome message and links to their applications. It enforces that only 'applicant' roles (or higher roles that can access portal) can view it.
    *   **`src/app/(workbench)/dashboard/page.tsx`**: A placeholder for managers, reviewers, and screeners, offering a welcome and role-specific links (e.g., "Manage Campaigns," "View Assignments"). It restricts access to these specific roles.
    *   **`src/app/(admin)/dashboard/page.tsx`**: **(Implemented)** This page now features an M3-compliant dashboard with overview cards for "Total Users," "Active Campaigns," "Pending Applications," and "System Status." It also includes a "Quick Actions" section with `tonal` buttons linking to user management, system settings, and pathway templates. Access is strictly limited to the 'admin' role.
    *   Each dashboard page uses `createClient` from `src/integrations/supabase/server` to perform server-side user authentication and role verification, redirecting unauthorized users.
*   **Authentication Middleware (`middleware.ts`):**
    *   A Next.js middleware has been implemented to centralize authentication and authorization logic.
    *   It protects all routes except static assets and explicitly public pages (`/`, `/login`).
    *   It redirects unauthenticated users to `/login`.
    *   It enforces role-based access control, ensuring users can only access routes corresponding to their assigned roles (e.g., only 'admin' can access `/admin` routes).
    *   It also handles redirection for logged-in users attempting to access public pages, sending them to their appropriate dashboard.
*   **Public Homepage (`src/app/page.tsx`):**
    *   The public homepage has been enhanced with a welcoming message, a description of Global Gateway's offerings (Programs, Hiring, Awards), and clear calls to action for new and returning users. It uses `Card` components and Lucide icons for a visually appealing layout, adhering to M3 design principles, and now utilizes the new `onPrimary` button variant in the hero section.
*   **Error Handling (`src/app/error.tsx` and `src/app/(public)/error-pages/[code]/page.tsx`):**
    *   A global client-side error boundary (`src/app/error.tsx`) has been implemented to catch unexpected React errors and provide a user-friendly fallback.
    *   Dynamic error pages (`src/app/(public)/error-pages/[code]/page.tsx`) have been created to handle specific HTTP status codes (401, 403, 404, 500) with tailored messages, icons, and actionable buttons, ensuring a consistent and helpful user experience during errors.
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
*   **Backend (Next.js Server Actions - `src/features/programs/actions.ts`):**
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

---<dyad-problem-report summary="8 problems">
<problem file="src/features/campaigns/actions.ts" line="237" column="37" code="1005">',' expected.</problem>
<problem file="src/features/campaigns/actions.ts" line="237" column="61" code="1005">',' expected.</problem>
<problem file="src/features/campaigns/actions.ts" line="237" column="65" code="1002">Unterminated string literal.</problem>
<problem file="src/features/campaigns/actions.ts" line="238" column="7" code="1005">',' expected.</problem>
<problem file="src/features/campaigns/actions.ts" line="238" column="35" code="1005">')' expected.</problem>
<problem file="src/features/campaigns/actions.ts" line="237" column="37" code="2304">Cannot find name 'FailedToRetrieveCampaign'.</problem>
<problem file="src/features/campaigns/actions.ts" line="237" column="61" code="2554">Expected 1-2 arguments, but got 4.</problem>
<problem file="src/features/programs/actions.ts" line="3" column="26" code="2459">Module '&quot;./services/program-service&quot;' declares 'Program' locally, but it is not exported.</problem>
</dyad-problem-report><think>**Fixing the Redirect**

I'm currently addressing the 8 TypeScript compile-time errors. The first 7 all originate from a problematic `redirect` statement at lines 237-238 in `src/features/campaigns/actions.ts`. I need to reconstruct the statement properly.


**Resolving Compile Issues**

I've identified the root cause of the errors. Errors 1-7 in `actions.ts` resulted from an incorrect conditional statement within a redirect. I'll correct the faulty logic.  Error 8 is confusing, but I've traced the issue to an improper import in  `program-service.ts`.


**Debugging Imports**

I've made progress. The incorrect `redirect` statement is now fixed in `actions.ts`, correcting errors 1-7. The problem with `Program` is also resolved. I've adjusted the import in `actions.ts` to correctly point to `campaign-service.ts`, solving error 8.  I believe the code is now ready for a clean compile.


</think>You're absolutely right to highlight these errors! It looks like there was a copy-paste mistake in the `campaigns/actions.ts` file, leading to a malformed `redirect` call and subsequent TypeScript errors. Additionally, the `Program` interface was being imported incorrectly in `programs/actions.ts`.

I've corrected both issues:

1.  **`src/features/campaigns/actions.ts`**: I've fixed the `redirect` statement in the `catch` block to correctly handle the "FailedToRetrieveCampaign" error.
2.  **`src/features/programs/actions.ts`**: I've updated the import for the `Program` interface to correctly reference it from `src/features/campaigns/services/campaign-service.ts`, where it is defined and exported.

Here are the corrected files:

<dyad-write path="src/features/campaigns/actions.ts" description="Corrected error handling in updateCampaignAction and fixed redirect paths.">
"use server";

import { campaignService, Campaign, CampaignPhase } from "@/features/campaigns/services/campaign-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { programService } from "@/features/programs/services/program-service"; // Import programService

// Helper function to check user authorization for a campaign
async function authorizeCampaignAction(campaignId: string, action: 'read' | 'write'): Promise<{ user: any; campaign: Campaign | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let campaign: Campaign | null = null;
  if (campaignId) {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, programs(creator_id)") // Fetch program creator_id for authorization
      .eq("id", campaignId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found for eq filter
        throw new Error("CampaignNotFound");
      }
      console.error(`Error fetching campaign ${campaignId} for authorization:`, error.message);
      throw new Error("FailedToRetrieveCampaign");
    }
    campaign = data;
  }

  if (!campaign && campaignId) {
    throw new Error("CampaignNotFound");
  }

  // Authorization logic
  const isCampaignCreator = user.id === campaign?.creator_id;
  const isProgramCreator = campaign?.program_id && user.id === campaign?.programs?.creator_id;
  const isPublicCampaign = campaign?.is_public;

  if (action === 'read') {
    if (!isAdmin && !isCampaignCreator && !isProgramCreator && !isPublicCampaign) {
      throw new Error("UnauthorizedAccessToPrivateCampaign");
    }
  } else if (action === 'write') { // For 'write' actions (update, delete)
    if (!isAdmin && !isCampaignCreator && !isProgramCreator) {
      throw new Error("UnauthorizedToModifyCampaign");
    }
  }

  return { user, campaign, isAdmin };
}

export async function getCampaignsAction(): Promise<Campaign[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  const { data, error } = await supabase
    .from("campaigns")
    .select("*, pathway_templates(id, name, description, is_private), programs(id, name, creator_id)") // Select program data
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error.message);
    return null;
  }

  const filteredData = data.filter(campaign =>
    isAdmin ||
    campaign.creator_id === user.id ||
    campaign.is_public ||
    (campaign.program_id && campaign.programs?.creator_id === user.id) // Program creator can see campaigns in their programs
  );
  return filteredData as Campaign[];
}

export async function getCampaignByIdAction(id: string): Promise<Campaign | null> {
  try {
    const { campaign } = await authorizeCampaignAction(id, 'read');
    return campaign;
  } catch (error: any) {
    console.error("Error in getCampaignByIdAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivateCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createCampaignAction(formData: FormData): Promise<Campaign | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const pathway_template_id = formData.get("pathway_template_id") as string | null;
  const start_date = formData.get("start_date") as string | null;
  const end_date = formData.get("end_date") as string | null;
  const is_public = formData.get("is_public") === "on";
  const status = formData.get("status") as Campaign['status'];
  const config = JSON.parse(formData.get("config") as string || '{}');
  const program_id = formData.get("program_id") as string | null; // Get program_id from form data

  if (!name || !status) {
    throw new Error("Campaign name and status are required.");
  }

  // Additional authorization check for program_id (since RLS is simplified)
  if (program_id) {
    const userRole: string = user.user_metadata?.role || '';
    const isAdmin = userRole === 'admin';
    const program = await programService.getProgramById(program_id);

    if (!program) {
      throw new Error("Linked program not found.");
    }
    if (!isAdmin && program.creator_id !== user.id) {
      throw new Error("Unauthorized to link campaign to this program.");
    }
  }

  let newCampaign: Campaign | null = null;
  try {
    newCampaign = await campaignService.createCampaign(
      name,
      description,
      pathway_template_id,
      start_date,
      end_date,
      is_public,
      status,
      config,
      user.id,
      program_id // Pass program_id to service
    );

    // If a pathway template was selected, deep copy its phases to campaign_phases
    if (newCampaign && pathway_template_id) {
      await campaignService.deepCopyPhasesFromTemplate(newCampaign.id, pathway_template_id);
    }

    revalidatePath("/workbench/campaigns");
    if (program_id) {
      revalidatePath(`/workbench/programs/${program_id}`); // Revalidate parent program page
    }
    return newCampaign;
  } catch (error: any) {
    console.error("Error in createCampaignAction:", error.message);
    // If phase copying fails, consider rolling back campaign creation or logging for manual intervention
    if (newCampaign) {
      // Optionally delete the campaign if phase copying fails
      // await campaignService.deleteCampaign(newCampaign.id);
      console.warn(`Campaign ${newCampaign.id} created but phases failed to copy. Manual intervention may be needed.`);
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function updateCampaignAction(id: string, formData: FormData): Promise<Campaign | null> {
  try {
    const { user, campaign, isAdmin } = await authorizeCampaignAction(id, 'write'); // Authorize before update

    if (!campaign) {
      throw new Error("CampaignNotFound");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const pathway_template_id = formData.get("pathway_template_id") as string | null;
    const start_date = formData.get("start_date") as string | null;
    const end_date = formData.get("end_date") as string | null;
    const is_public = formData.get("is_public") === "on";
    const status = formData.get("status") as Campaign['status'];
    const config = JSON.parse(formData.get("config") as string || '{}');
    const program_id = formData.get("program_id") as string | null; // Get program_id from form data

    if (!name || !status) {
      throw new Error("Campaign name and status are required.");
    }

    // Additional authorization check if program_id is being changed or set
    if (program_id !== campaign.program_id) {
      if (program_id) { // If linking to a new program
        const program = await programService.getProgramById(program_id);
        if (!program) {
          throw new Error("Linked program not found.");
        }
        if (!isAdmin && program.creator_id !== user.id) {
          throw new Error("Unauthorized to link campaign to this program.");
        }
      } else { // If unlinking from a program
        // No specific check needed, as unlinking is generally allowed if user can modify campaign
      }
    }

    const updatedCampaign = await campaignService.updateCampaign(
      id,
      { name, description, pathway_template_id, start_date, end_date, is_public, status, config, program_id } // Pass program_id to service
    );

    revalidatePath("/workbench/campaigns");
    revalidatePath(`/workbench/campaigns/${id}`);
    if (campaign.program_id) {
      revalidatePath(`/workbench/programs/${campaign.program_id}`); // Revalidate old parent program page
    }
    if (program_id) {
      revalidatePath(`/workbench/programs/${program_id}`); // Revalidate new parent program page
    }
    return updatedCampaign;
  } catch (error: any) {
    console.error("Error in updateCampaignAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function deleteCampaignAction(id: string): Promise<boolean> {
  try {
    const { campaign } = await authorizeCampaignAction(id, 'write'); // Authorize before delete

    if (!campaign) {
      throw new Error("CampaignNotFound");
    }

    const success = await campaignService.deleteCampaign(id);

    revalidatePath("/workbench/campaigns");
    if (campaign.program_id) {
      revalidatePath(`/workbench/programs/${campaign.program_id}`); // Revalidate parent program page
    }
    return success;
  } catch (error: any) {
    console.error("Error in deleteCampaignAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

// --- Campaign Phase Management Server Actions ---

export async function getCampaignPhasesAction(campaignId: string): Promise<CampaignPhase[] | null> {
  try {
    await authorizeCampaignAction(campaignId, 'read'); // User must have read access to the parent campaign
    const phases = await campaignService.getCampaignPhasesByCampaignId(campaignId);
    return phases;
  } catch (error: any) {
    console.error("Error in getCampaignPhasesAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivateCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createCampaignPhaseAction(campaignId: string, formData: FormData): Promise<CampaignPhase | null> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const order_index = parseInt(formData.get("order_index") as string);
    const original_phase_id = formData.get("original_phase_id") as string | null;
    const config = JSON.parse(formData.get("config") as string || '{}');

    if (!name || !type || isNaN(order_index)) {
      throw new Error("Campaign phase name, type, and order index are required.");
    }

    const newPhase = await campaignService.createCampaignPhase(
      campaignId,
      name,
      type,
      order_index,
      description,
      config,
      original_phase_id
    );

    revalidatePath(`/workbench/campaigns/${campaignId}`);
    return newPhase;
  } catch (error: any) {
    console.error("Error in createCampaignPhaseAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    throw error; // Re-throw to be caught by client-side toast for form errors
  }
}

export async function updateCampaignPhaseAction(phaseId: string, campaignId: string, formData: FormData): Promise<CampaignPhase | null> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const config = JSON.parse(formData.get("config") as string || '{}');

    if (!name || !type) {
      throw new Error("Campaign phase name and type are required.");
    }

    const updatedPhase = await campaignService.updateCampaignPhase(
      phaseId,
      { name, type, description, config }
    );

    revalidatePath(`/workbench/campaigns/${campaignId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("Error in updateCampaignPhaseAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function updateCampaignPhaseConfigAction(phaseId: string, campaignId: string, configUpdates: Record<string, any>): Promise<CampaignPhase | null> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    const updatedPhase = await campaignService.updateCampaignPhase(
      phaseId,
      { config: configUpdates }
    );

    revalidatePath(`/workbench/campaigns/${campaignId}`);
    return updatedPhase;
  } catch (error: any) {
    console.error("Error in updateCampaignPhaseConfigAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function deleteCampaignPhaseAction(phaseId: string, campaignId: string): Promise<boolean> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    const success = await campaignService.deleteCampaignPhase(phaseId);

    revalidatePath(`/workbench/campaigns/${campaignId}`);
    return success;
  } catch (error: any) {
    console.error("Error in deleteCampaignPhaseAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function reorderCampaignPhasesAction(campaignId: string, phases: { id: string; order_index: number }[]): Promise<boolean> {
  try {
    await authorizeCampaignAction(campaignId, 'write'); // User must have write access to the parent campaign

    // Perform updates in a transaction if possible, or sequentially
    for (const phase of phases) {
      await campaignService.updateCampaignPhase(phase.id, { order_index: phase.order_index });
    }

    revalidatePath(`/workbench/campaigns/${campaignId}`);
    return true;
  } catch (error: any) {
    console.error("Error in reorderCampaignPhasesAction:", error.message);
    if (error.message === "UnauthorizedToModifyCampaign") {
      redirect("/error-pages/403");
    } else if (error.message === "CampaignNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveCampaign") {
      redirect("/error-pages/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}