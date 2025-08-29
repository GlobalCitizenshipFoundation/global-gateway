# Global Gateway Application Brief

This document provides a comprehensive overview of the Global Gateway platform, outlining its core features, design principles, and a Vertical Implementation Strategy (VIS) for its development. It synthesizes requirements from `PRD.md`, architectural guidelines from `Architecture.md`, and design specifications from `M3Design.md` and `AI_RULES.md`.

## 1. Global CSS Style Brief (Material Design 3 Compliance)

The Global Gateway application is designed with a strict adherence to Google's Material Design 3 (M3) specifications, ensuring a modern, consistent, accessible, and intuitive user experience.

### 1.1 Dynamic Color Theming
*   **Primary Seed Color:** The application's core aesthetic is driven by the primary seed color `#880E4F`. This color is used to generate a full tonal palette for both light and dark themes.
*   **Color Roles:** HSL (Hue, Saturation, Lightness) values are defined in `src/app/globals.css` for various color roles (e.g., `--background`, `--foreground`, `--primary`, `--secondary`, `--card`, `--popover`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, and specific `--sidebar` and `--chart` colors).
*   **Accessibility:** All color combinations are chosen to meet WCAG 2.1 AAA contrast ratios, ensuring high readability and usability for all users in both light and dark modes.
*   **Implementation:** These HSL values are mapped to Tailwind CSS custom properties in `tailwind.config.ts`, allowing for easy application across components (e.g., `bg-primary`, `text-foreground`).

### 1.2 Typography
*   **M3 Type Scale:** The application utilizes the full M3 type scale, including `display`, `headline`, `title`, `body`, and `label` categories. Each category has specific `large`, `medium`, and `small` variants.
*   **Font Sizing & Spacing:** These type scale variants are precisely defined in `tailwind.config.ts` with `rem` values for font size, `lineHeight`, and `letterSpacing` to match M3 specifications.
*   **Font Families:** The `Geist` font is used for sans-serif text, and `Geist_Mono` for monospace, as configured in `src/app/layout.tsx`.
*   **Usage:** Typography classes (e.g., `text-display-large`, `font-bold`) are applied directly to elements in components, ensuring consistent text hierarchy and readability.

### 1.3 Elevation and Shape
*   **Border Radius:** M3-compliant rounded corners are implemented using custom `borderRadius` values defined in `tailwind.config.ts` (e.g., `sm: 2px`, `md: 4px`, `lg: 8px`, `xl: 12px`, `2xl: 16px`).
*   **Elevation:** Shadow depths are achieved using Tailwind's built-in `shadow-sm`, `shadow-md`, `shadow-lg` utilities, which are visually aligned with M3's elevation system to distinguish surfaces and indicate hierarchy.

### 1.4 Motion
*   **Animations:** The `tailwindcss-animate` plugin is integrated for predefined, subtle animations.
*   **Transitions:** Custom `transition-all` and `duration-` utilities are used for smooth state changes, such as hover effects, focus states, and component interactions, adhering to M3's emphasis on meaningful motion.

### 1.5 Layout and Spacing
*   **8dp Grid System:** All spacing (margins, paddings, gaps) consistently follows the 8dp grid system, with values defined in `tailwind.config.ts` as multiples of `4px` (e.g., `p-2` for 8px, `gap-4` for 16px). This ensures visual harmony and balanced layouts.
*   **Responsiveness:** The design adopts a desktop-first approach, with responsive adjustments for tablet and mobile views using Tailwind's responsive prefixes (e.g., `md:`, `lg:`). Forms are designed to be centered with `max-width` on desktop and span edge-to-edge on mobile, maintaining balanced margins.

### 1.6 UI Components
*   **Shadcn/UI:** The primary UI component library is Shadcn/UI, built on Radix UI primitives and styled with Tailwind CSS, ensuring M3 compliance and reusability. Custom components are developed following these patterns.

---

## 2. Comprehensive Feature Requirement Brief

Global Gateway is a multi-role, single-organization platform designed to streamline the management of Programs & Fellowships, Hiring & Recruitment, and Awards & Grants. It emphasizes configurable workflows, role-based access, automation, and robust insights.

### 2.1 Personas and Roles
The platform supports distinct roles with Role-Based Access Control (RBAC) and least-privilege principles:
*   **Applicant / Nominee / Participant:** Submits applications, tracks progress.
*   **Recommender:** Submits confidential recommendations via secure links.
*   **Coordinator / Recruiter / Program Officer:** Manages campaigns, screens applications, communicates.
*   **Evaluator / Hiring Manager / Review Panelist:** Reviews and scores submissions.
*   **Admin / Platform Owner:** Configures workflows, manages roles, oversees analytics.

### 2.2 Core Modules and Features

#### 2.2.1 User & Role Management (Cross-Cutting Foundation)
*   **Authentication:** Secure login/signup, session management (server-first checks, cookie-based persistence).
*   **Authorization:** Role-based access control enforced via Next.js middleware and Server Actions.
*   **User Profiles:** Management of user data (first name, last name, avatar, role).
*   **Audit Logs:** Immutable logs of all user actions for compliance and transparency.

#### 2.2.2 Communication & Notifications (Cross-Cutting)
*   **Email/In-app Notifications:** Automated and manual notifications tied to workflow events.
*   **Template Library:** Reusable communication templates.
*   **Bulk Messaging:** Tools for sending mass updates.

#### 2.2.3 Error Handling (Cross-Cutting)
*   **Client-side:** Inline form validation, `sonner` toasts for API feedback, global error boundaries.
*   **Server-side:** Standardized error responses from Server Actions/API routes, logging to `errors.md`.
*   **Dedicated Error Pages:** User-friendly pages for 401, 403, 404, 500 errors with actionable steps.

### 2.3 Vertical Slices (Epics) - Implementation Strategy

The development follows a Vertical Slicing approach, delivering end-to-end functionality for each major feature.

#### Vertical 0: Public Homepage & Role-Based Dashboards (Completed)
*   **Objective:** Establish foundational entry points, authentication, and role-based routing.
*   **Features:** Public landing page (`/`), secure login (`/login`), role-based dashboards (`/portal/dashboard`, `/workbench/dashboard`, `/admin/dashboard`), M3 styling, Supabase integration, session context, and comprehensive error handling.

#### Vertical 1: Pathway Template Management (In Progress)
*   **Objective:** Allow Admins/Creators to design reusable multi-phase workflows.
*   **User Stories:**
    *   As a Creator, I can create, view, edit, and delete Pathway Templates.
    *   As a Creator, I can add, reorder, edit, and delete Phases within a template.
    *   As a Creator, I can configure phase-specific settings (e.g., form fields, review rubrics).
    *   As a Creator, I can clone existing Pathway Templates.
*   **Functional Requirements:**
    *   CRUD operations for `pathway_templates` and `phases` tables in Supabase.
    *   RLS policies for secure data access (creator ownership, public visibility, admin override).
    *   Next.js Server Actions for all data mutations and server-side authorization.
    *   Client-side UI for template listing, creation, editing, and detail view.
    *   Drag-and-drop interface for reordering phases.
    *   Dynamic configuration panels for different phase types (e.g., Form, Review).
    *   Template cloning functionality.

#### Vertical 2: Campaign Creation & Execution
*   **Objective:** Transform Pathway Templates into live, executable campaigns.
*   **User Stories:**
    *   As a Coordinator, I can create a Campaign from a Pathway Template.
    *   As a Coordinator, I can configure campaign-specific settings (timelines, eligibility, visibility).
    *   As a Coordinator, I can monitor active Campaigns with progress dashboards.
*   **Functional Requirements:**
    *   Instantiate campaigns from templates (deep copy of phases).
    *   Campaign-specific settings (dates, status, public/private).
    *   Dashboard views for campaign progress and metrics.

#### Vertical 3: Application Submission & Tracking
*   **Objective:** Enable Applicants to submit and track their applications.
*   **User Stories:**
    *   As an Applicant, I can complete and submit forms.
    *   As an Applicant, I can upload required documents.
    *   As an Applicant, I can see my submission status in real-time.
    *   As an Applicant, I can receive automated updates.
*   **Functional Requirements:**
    *   Dynamic form rendering based on Form Phase configurations.
    *   File upload support.
    *   Applicant dashboard showing submission status per campaign.
    *   Integration with notification system.

#### Vertical 4: Evaluation & Review
*   **Objective:** Provide structured tools for internal users to evaluate submissions.
*   **User Stories:**
    *   As a Reviewer, I can view assigned applications.
    *   As a Reviewer, I can score based on rubrics and provide feedback.
    *   As a Coordinator, I can assign/unassign reviewers and track completion.
*   **Functional Requirements:**
    *   Reviewer dashboard with assigned applications.
    *   Rubric-based scoring interface (based on Review Phase config).
    *   Configurable anonymization modes.
    *   Assignment tools for coordinators.

#### Vertical 5: Scheduling & Recommendations
*   **Objective:** Facilitate interviews and external recommendations.
*   **User Stories:**
    *   As an Applicant, I can select interview slots.
    *   As a Host, I can define availability and manage conflicts.
    *   As an Applicant, I can nominate recommenders.
    *   As a Recommender, I can securely submit a recommendation.
*   **Functional Requirements:**
    *   Availability management for interview hosts.
    *   Calendar view for applicants to book slots.
    *   Secure, tokenized links for recommenders.
    *   Recommendation status tracking.

#### Vertical 6: Decisions & Notifications
*   **Objective:** Manage final decisions and communicate outcomes.
*   **User Stories:**
    *   As a Coordinator, I can aggregate scores and record decisions.
    *   As an Applicant, I can receive final outcomes.
    *   As an Admin, I can configure automated decision emails.
*   **Functional Requirements:**
    *   Decision phase configuration.
    *   Applicant-facing decision status.
    *   Bulk/automated communication tools.

#### Vertical 7: Reporting & Analytics
*   **Objective:** Enable data-driven insights for administrators and managers.
*   **User Stories:**
    *   As an Admin, I can see dashboards on Campaign activity.
    *   As a Manager, I can export data for offline analysis.
*   **Functional Requirements:**
    *   Dashboards with KPIs (applications, completion rates, diversity metrics).
    *   CSV/Excel export functionality.
    *   Drill-down analytics by program and phase.

### 2.4 Non-Functional Requirements
*   **Performance:** Scalable to handle high concurrent usage.
*   **Security:** RBAC, RLS, encrypted data, GDPR compliance, immutable audit logs.
*   **Usability:** Intuitive UI, drag-and-drop, inline validation, clear status indicators.
*   **Scalability:** Support multiple programs, teams, and cohorts.
*   **Compatibility:** Modern browser support, responsive design.

### 2.5 Technical Stack
*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn/UI, Lucide React.
*   **Forms:** React Hook Form with Zod for validation.
*   **State Management:** React Context API, `useState`, `useReducer`.
*   **Notifications:** Sonner.
*   **Charts:** Recharts.
*   **Animation:** `tailwindcss-animate`.
*   **Backend/Database:** Supabase (Auth, PostgreSQL DB, Edge Functions, RLS).
*   **Integrations:** Native `fetch` API, Next.js Route Handlers/Server Actions.

---

## 3. Current Progress and Next Steps

**Current Progress:**
Vertical 0 (Public Homepage & Role-Based Dashboards) is fully implemented, providing a robust foundation for authentication, authorization, and M3-compliant styling. Vertical 1.1 (Basic Pathway Template Management - CRUD & Listing) is currently in progress, with the database schema, service layer, Server Actions, and initial UI components for listing, creating, and editing templates already established.

**Next Steps:**
The immediate focus is to complete **Vertical 1: Pathway Template Management**. This involves:
1.  Finalizing the database schema for `pathway_templates` and `phases` with all specified columns and RLS policies.
2.  Implementing the remaining Server Actions for phase management (create, update, delete, reorder) and template cloning, ensuring all authorization checks are in place.
3.  Developing the UI components for the Pathway Template Detail page, including phase listing, drag-and-drop reordering, and the `PhaseFormDialog` for adding/editing phases.
4.  Implementing the initial phase-specific configuration panels (`FormPhaseConfig`, `ReviewPhaseConfig`) to allow detailed settings for these phase types.
5.  Adding the "Clone Template" functionality.