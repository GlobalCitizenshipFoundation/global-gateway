# Project Documentation

This document provides an overview of the project's architecture, key features, and implementation details. It is intended to be a living document that evolves with the project.

## Table of Contents

*   [Project Structure](#project-structure)
*   [Vertical 0: Public Homepage & Role-Based Dashboards](#vertical-0-public-homepage--role-based-dashboards)
*   [Vertical 1: Pathway Templates & Phase Configuration](#vertical-1-pathway-templates--phase-configuration)
*   [Vertical 2: Campaign Management & Campaign Phases](#vertical-2-campaign-management--campaign-phases)
*   [Vertical 4: Application Management & Screening Phase](#vertical-4-application-management--screening-phase)

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
│   ├── features/             # Vertical feature modules (e.g., pathway-templates, campaign-management)
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
    *   **Frontend (UI):**
        *   `src/app/(workbench)/pathway-templates/page.tsx` renders `PathwayTemplateList`.
        *   `src/features/pathway-templates/components/PathwayTemplateList.tsx` (Client Component) fetches templates, renders M3 `Card` components, displays `is_private` status with icons, and conditionally enables "Edit" and "Delete" buttons based on authorization. Includes search, filter, and loading skeletons.
        *   `src/app/(workbench)/pathway-templates/new/page.tsx` and `src/app/(workbench)/pathway-templates/[id]/edit/page.tsx` render `PathwayTemplateForm`.
        *   `src/features/pathway-templates/components/PathwayTemplateForm.tsx` (Client Component) uses `react-hook-form` with `zod` for validation, renders M3 `Input`, `Textarea`, and `Switch` components, and submits data via Server Actions.
*   **Vertical 1.2: Basic Phase Management (Add, Delete, Reorder)**
    *   **Database Schema (`public.phases`):**
        *   Table created with `id`, `pathway_template_id`, `name`, `type`, `description`, `order_index`, `config` (JSONB), `created_at`, `updated_at` columns.
        *   **Row Level Security (RLS)** enabled with policies for `SELECT` (phases of own or public templates), `UPDATE` (phases of own templates), `DELETE` (phases of own templates). `INSERT` policy is set to `true` with full authorization handled by Server Actions (as per `errors.md`).
    *   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
        *   Functions `getPhasesByPathwayTemplateId`, `createPhase`, `updatePhase`, `deletePhase` are implemented.
    *   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
        *   Server Actions `getPhasesAction`, `createPhaseAction`, `updatePhaseAction`, `deletePhaseAction`, `reorderPhasesAction` are implemented.
        *   All phase-related Server Actions include authorization checks against the parent `pathway_template`'s `creator_id` and the user's `role`.
    *   **Frontend (UI):**
        *   `src/app/(workbench)/pathway-templates/[id]/page.tsx` renders `PathwayTemplateDetail`.
        *   `src/features/pathway-templates/components/PathwayTemplateDetail.tsx` (Client Component) displays template details, manages phase state, and integrates drag-and-drop using `@hello-pangea/dnd`. It conditionally renders "Add Phase" and "Edit Template Details" buttons.
        *   `src/features/pathway-templates/components/PhaseCard.tsx` (Client Component) displays individual phase details, includes a drag handle, and M3 `Button` components for "Edit Phase," "Delete Phase," and "Configure Phase."
        *   `src/features/pathway-templates/components/PhaseFormDialog.tsx` (Client Component) is an M3 `Dialog` for creating/editing phase name, type, and description, using `react-hook-form` and `zod`.
*   **Vertical 1.3: Phase-Specific Configuration (Form, Review, Email, Scheduling, Decision, Recommendation)**
    *   **Data Storage:** The `config` (JSONB) column in `public.phases` stores phase-specific settings.
    *   **Service Layer:** `pathwayTemplateService.updatePhase` is extended to handle `config` updates.
    *   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
        *   `updatePhaseConfigAction` is implemented, including authorization checks.
    *   **Frontend (UI):**
        *   `src/features/pathway-templates/components/PhaseConfigurationPanel.tsx` (Client Component) acts as a polymorphic component, dynamically rendering the correct configuration sub-component based on `phase.type`.
        *   Dedicated configuration components are implemented for each phase type:
            *   `src/features/pathway-templates/components/phase-configs/FormPhaseConfig.tsx`
            *   `src/features/pathway-templates/components/phase-configs/ReviewPhaseConfig.tsx`
            *   `src/features/pathway-templates/components/phase-configs/EmailPhaseConfig.tsx`
            *   `src/features/pathway-templates/components/phase-configs/SchedulingPhaseConfig.tsx`
            *   `src/features/pathway-templates/components/phase-configs/DecisionPhaseConfig.tsx`
            *   `src/features/pathway-templates/components/phase-configs/RecommendationPhaseConfig.tsx`
        *   All configuration components use `react-hook-form` with `zod` for validation, `useFieldArray` for dynamic lists (fields, criteria, outcomes, recommenders), and M3-compliant UI components.
        *   **Modification:** These components now accept an optional `updatePhaseConfigAction` prop to allow them to be reused for campaign phases, adhering to the Open/Closed Principle.
*   **Vertical 1.4: Template Cloning**
    *   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
        *   `clonePathwayTemplate` function is implemented to perform a deep copy of a template and its phases, assigning the new template to the cloning user.
    *   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
        *   `clonePathwayTemplateAction` is implemented, performing a read authorization check on the original template and then calling the service layer.
    *   **Frontend (UI):**
        *   `src/features/pathway-templates/components/CloneTemplateDialog.tsx` is an M3 `Dialog` for entering a new template name, integrated with `react-hook-form` and `zod`.
        *   "Clone Template" buttons are present in `PathwayTemplateList.tsx` and `PathwayTemplateDetail.tsx`, triggering the `CloneTemplateDialog`.

---

## Vertical 2: Campaign Management & Campaign Phases

**Objective:** To enable users to create live instances of pathway templates, configure campaign-specific settings, and manage their lifecycle.

**Implementation Details:**

*   **Vertical 2.1: Basic Campaign Management (CRUD & Listing)**
    *   **Database Schema (`public.campaigns`):**
        *   Table created with `id`, `pathway_template_id` (FK to `pathway_templates`), `creator_id` (FK to `auth.users`), `name`, `description`, `start_date`, `end_date`, `is_public`, `status`, `config` (JSONB), `created_at`, `updated_at` columns.
        *   **Row Level Security (RLS)** enabled with policies for `SELECT` (own or public campaigns), `INSERT` (own campaigns), `UPDATE` (own campaigns), and `DELETE` (own campaigns).
    *   **Service Layer (`src/features/campaigns/services/campaign-service.ts`):**
        *   Functions `getCampaigns`, `getCampaignById`, `createCampaign`, `updateCampaign`, `deleteCampaign` are implemented for direct database interaction, including fetching related `pathway_templates` data.
    *   **Backend (Next.js Server Actions - `src/features/campaigns/actions.ts`):**
        *   Server Actions `getCampaignsAction`, `getCampaignByIdAction`, `createCampaignAction`, `updateCampaignAction`, `deleteCampaignAction` are implemented.
        *   Server-side authorization logic (`authorizeCampaignAction`) is applied to all actions, checking `creator_id` and `user_metadata.role` (for 'admin' override) to enforce access control. Unauthorized access attempts redirect to appropriate error pages.
    *   **Frontend (UI):**
        *   `src/features/campaigns/components/CampaignList.tsx` (Client Component) fetches and displays campaigns in an M3-compliant grid of `Card` components. It includes search, filter options (all, my, public), and loading skeletons. It also displays linked pathway template names and campaign status/dates.
        *   `src/app/(workbench)/campaigns/page.tsx` renders the `CampaignList` component.
        *   `src/features/campaigns/components/CampaignForm.tsx` (Client Component) is used for creating and editing campaigns. It utilizes `react-hook-form` with `zod` for validation, renders M3 `Input`, `Textarea`, `Select`, `Switch`, `Popover` (for date pickers) components. It allows linking to an existing `PathwayTemplate` (fetched via `getTemplatesAction`).
        *   `src/app/(workbench)/campaigns/new/page.tsx` renders `CampaignForm` for new campaigns.
        *   `src/app/(workbench)/campaigns/[id]/edit/page.tsx` fetches an existing campaign via `getCampaignByIdAction` and renders `CampaignForm` for editing.
*   **Vertical 2.2: Campaign Phases Management (Deep Copy, CRUD, Reorder, Config)**
    *   **Database Schema (`public.campaign_phases`):**
        *   Table created with `id`, `campaign_id` (FK to `campaigns`), `original_phase_id` (FK to `phases`, nullable), `name`, `type`, `description`, `order_index`, `config` (JSONB), `created_at`, `updated_at` columns.
        *   **Row Level Security (RLS)** enabled with policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` based on the parent `campaign_id` and the user's ownership/public access to that campaign.
    *   **Service Layer (`src/features/campaigns/services/campaign-service.ts`):**
        *   New interface `CampaignPhase` defined, extending `BaseConfigurableItem`.
        *   Functions `getCampaignPhasesByCampaignId`, `createCampaignPhase`, `updateCampaignPhase`, `deleteCampaignPhase` are implemented.
        *   `deepCopyPhasesFromTemplate(campaignId: string, templateId: string)` function is implemented to fetch phases from a `pathway_template` and insert them as `campaign_phases` for a given `campaignId`.
    *   **Backend (Next.js Server Actions - `src/features/campaigns/actions.ts`):**
        *   `createCampaignAction` is modified to call `campaignService.deepCopyPhasesFromTemplate` if a `pathway_template_id` is provided during campaign creation.
        *   New Server Actions `getCampaignPhasesAction`, `createCampaignPhaseAction`, `updateCampaignPhaseAction`, `updateCampaignPhaseConfigAction`, `deleteCampaignPhaseAction`, `reorderCampaignPhasesAction` are implemented.
        *   All campaign phase-related Server Actions include authorization checks against the parent `campaign`'s `creator_id` and the user's `role`.
    *   **Frontend (UI):**
        *   `src/app/(workbench)/campaigns/[id]/page.tsx` is created to render `CampaignDetail`.
        *   `src/features/campaigns/components/CampaignDetail.tsx` (Client Component) displays campaign details and a section for managing `CampaignPhase`s. It integrates drag-and-drop for reordering phases and conditionally renders "Add Phase" and "Edit Campaign Details" buttons based on authorization.
        *   `src/features/campaigns/components/CampaignPhaseCard.tsx` (Client Component) displays individual campaign phase details, includes a drag handle, and M3 `Button` components for "Edit Phase," "Delete Phase," and "Configure Phase."
        *   `src/features/campaigns/components/CampaignPhaseFormDialog.tsx` (Client Component) is an M3 `Dialog` for creating/editing campaign phase name, type, and description, using `react-hook-form` and `zod`.
        *   `src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx` (Client Component) acts as a polymorphic component, dynamically rendering the correct configuration sub-component based on `phase.type`. It reuses the existing configuration components from `src/features/pathway-templates/components/phase-configs/` by passing a campaign-specific `updatePhaseConfigAction` prop.

---

## Vertical 4: Application Management & Screening Phase

**Objective:** To enable applicants to submit applications and recruiters to perform initial screening, with role-based views and internal tools.

**Implementation Details:**

*   **Vertical 4.1: Applications Table & RLS**
    *   **Database Schema (`public.applications`):**
        *   Table created with `id`, `campaign_id` (FK to `campaigns`), `applicant_id` (FK to `auth.users`), `current_campaign_phase_id` (FK to `campaign_phases`), `status` (overall application status), `screening_status` (specific to screening phase), `data` (JSONB for form data), `created_at`, `updated_at`.
        *   **Row Level Security (RLS)** enabled with policies:
            *   Applicants can `SELECT`, `INSERT`, `UPDATE` their own applications.
            *   Recruiters/Admins can `SELECT` applications within campaigns they have access to.
            *   Recruiters/Admins can `UPDATE` `screening_status` and `current_campaign_phase_id` for applications within campaigns they manage.
*   **Vertical 4.2: Application Service & Server Actions**
    *   **Feature Module (`src/features/applications/index.ts`):** Entry point created.
    *   **Service Layer (`src/features/applications/services/application-service.ts`):**
        *   New interface `Application` defined, including nested `Campaign`, `Profile`, and `ApplicationPhase` types for joined data.
        *   Functions `getApplications`, `getApplicationById`, `createApplication`, `updateApplication`, `deleteApplication` are implemented for direct database interaction.
    *   **Backend (Next.js Server Actions - `src/features/applications/actions.ts`):**
        *   Server Actions `getApplicationsAction`, `getApplicationByIdAction`, `createApplicationAction`, `updateApplicationAction`, `deleteApplicationAction` are implemented.
        *   Server-side authorization logic (`authorizeApplicationAction`) is applied to all actions, checking `applicant_id`, `campaign.creator_id`, `campaign.is_public`, and `user_metadata.role` (for 'admin' override) to enforce granular access control. Unauthorized access attempts redirect to appropriate error pages.
        *   Specific logic for `updateApplicationAction` ensures only authorized roles can modify `screening_status` and `current_campaign_phase_id`.
*   **Vertical 4.3: Screening Phase UI (Dashboard View)**
    *   **Frontend (UI):**
        *   `src/features/applications/components/ScreeningDashboard.tsx` (Client Component) is created. This component provides a dashboard view for recruiters, displaying a list of applications with filtering (by status, campaign) and search capabilities.
        *   Each application is rendered as an M3-compliant `Card` showing applicant name, campaign, current phase, and screening status with visual indicators.
        *   Action buttons allow recruiters to quickly update an application's screening status (Accept, On Hold, Deny) via `DropdownMenu` and `AlertDialog` for confirmation.
        *   `src/app/(workbench)/applications/screening/page.tsx` renders the `ScreeningDashboard` component. Access to this page is restricted to 'admin', 'coordinator', 'evaluator', and 'screener' roles.
*   **Vertical 4.4: Applicant Detail View**
    *   **Frontend (UI):**
        *   `src/app/(workbench)/applications/[id]/page.tsx` is created to serve as the entry point for a single application's detail view. It fetches the application data using `getApplicationByIdAction` and passes it to the client component.
        *   `src/features/applications/components/ApplicationDetail.tsx` (Client Component) is created. This component displays comprehensive details about the applicant and their application, including:
            *   Applicant's name, avatar, and associated campaign.
            *   Current phase and application status.
            *   Submitted application data (dynamically rendered from the `data` JSONB field), with internal screening data (`screeningChecklist`) excluded from public display.
            *   **Internal Checklist (Implemented):** The `ScreeningChecklist` component is integrated, allowing authorized users (recruiters/admins) to manage a dynamic list of checklist items with status and notes.
            *   Placeholders for "Collaborative Notes" and "Workflow Participation" sections, which will be implemented in subsequent steps.

**Next Steps:**
The immediate next steps for **Vertical 4** will involve implementing the "Collaborative Notes" section within the `ApplicationDetail` view, which will include team discussions, private comments, and an audit trail.