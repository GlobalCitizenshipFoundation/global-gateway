# Product Requirements Document (PRD)

## 1. Introduction

### 1.1 Purpose

This document defines the requirements for the **Global Gateway platform**. It uses a **Vertical Slicing (VIS)** approach to ensure deliverables are broken into end-to-end increments that deliver immediate, demonstrable value. This PRD ensures alignment between business stakeholders, product management, and the development team.

### 1.2 Scope

Global Gateway is a **multi-role, single-organization platform** for managing:

* **Programs & Fellowships**
* **Hiring & Recruitment**
* **Awards & Grants**

The platform provides:

* Configurable **Pathways** (templates of phases)
* Executable **Campaigns** (instances of programs built from Pathways)
* Guided participation for applicants and recommenders
* Structured workflows for evaluators, recruiters, and coordinators
* System-wide administration and reporting

It supports both **internal users** (program managers, recruiters, admins) and **external users** (applicants, recommenders, evaluators) with **role-specific access and automation**.

---

## 2. Personas and Roles

The platform enforces **RBAC** (role-based access control), **least-privilege principles**, and **immutable audit logs**.

### Roles

* **Applicant / Nominee / Participant**
  Submits applications or nominations, tracks progress, schedules interviews, communicates securely.

* **Recommender**
  Submits confidential recommendations via secure, link-based workflows without requiring account creation.

* **Coordinator / Recruiter / Program Officer**
  Creates and manages campaigns, screens applications, communicates with participants, schedules interviews, monitors compliance.

* **Evaluator / Hiring Manager / Review Panelist**
  Reviews and scores assigned submissions, records feedback. May operate in anonymized or blinded modes.

* **Admin / Platform Owner**
  Configures workflows, manages roles, ensures compliance, oversees analytics, and maintains integrations.

### RBAC Principles

* **Least privilege** for all users.
* **Field-level visibility controls** to protect sensitive data.
* **Temporary secure links** for external users (e.g., recommenders).
* **Audit logs** for all user actions with timestamps.

---

## 3. Goals and Objectives

### 3.1 Business Goals

* **Standardize workflows** using Pathway Templates.
* **Automate repetitive tasks** (emails, notifications, phase transitions).
* **Ensure transparency** for all stakeholders.
* **Support flexible multi-role workflows** across diverse program types.
* **Enable robust insights** via dashboards and reporting.

### 3.2 User Goals

* **Creators/Admins**: Define scalable program structures.
* **Managers/Coordinators**: Track and manage campaigns and submissions.
* **Applicants**: Navigate, complete, and track their application journey easily.
* **Evaluators/Recommenders**: Provide structured input securely and efficiently.

---

## 4. Vertical Slices (Epics)

Each slice is **end-to-end**, covering frontend, backend, data, and role-specific views.

### 4.1 Slice 1: Pathway Template Management *(Foundation)*

Allows Admins/Creators to design reusable workflows.

**User Stories**

* As a Creator, I can create and configure Pathway Templates.
* As a Creator, I can add Phases (Form, Review, Email, Scheduling, Decision, Recommendation, etc.).
* As a Creator, I can reorder or delete Phases.
* As a Creator, I can view and edit existing Pathway Templates.

**Functional Requirements**

* CRUD operations for Pathway Templates.
* Drag-and-drop builder for Phases.
* Phase-specific configuration (forms, emails, rubrics, scheduling).
* Display and manage Pathway Template library.

---

### 4.2 Slice 2: Campaign Creation & Execution *(Operationalization)*

Transforms Pathway Templates into live campaigns.

**User Stories**

* As a Coordinator, I can create a Campaign from a Pathway Template.
* As a Coordinator, I can configure campaign-specific settings (timelines, eligibility, visibility).
* As a Coordinator, I can monitor active Campaigns with progress dashboards.

**Functional Requirements**

* Instantiate campaigns from templates.
* Track submissions by status and phase.
* Provide campaign-level reporting (applications received, phase progress).

---

### 4.3 Slice 3: Application Submission & Tracking *(External Onboarding)*

Enables Applicants to submit and track applications.

**User Stories**

* As an Applicant, I can complete and submit forms.
* As an Applicant, I can upload required documents.
* As an Applicant, I can see my submission status in real-time.
* As an Applicant, I can receive automated updates (email/in-app notifications).

**Functional Requirements**

* Dynamic form builder for Applicants.
* File upload support with validation.
* Applicant dashboard showing status per Campaign.
* Notification system tied to workflow events.

---

### 4.4 Slice 4: Evaluation & Review *(Decision Enablement)*

Structured evaluation of submissions.

**User Stories**

* As a Reviewer, I can view assigned applications.
* As a Reviewer, I can score based on rubrics and provide feedback.
* As a Coordinator, I can assign/unassign reviewers and track completion.

**Functional Requirements**

* Reviewer dashboard with assignments.
* Rubric-based scoring forms.
* Configurable anonymization modes.
* Assignment tools with workload balancing.

---

### 4.5 Slice 5: Scheduling & Recommendations *(Extended Features)*

Facilitates interviews and external recommendations.

**User Stories**

* As an Applicant, I can select interview slots.
* As a Host, I can define availability and manage conflicts.
* As an Applicant, I can nominate recommenders.
* As a Recommender, I can securely submit a recommendation.

**Functional Requirements**

* Availability manager for Hosts.
* Calendar view for Applicants.
* Secure, tokenized recommendation links.
* Recommendation status tracking.

---

### 4.6 Slice 6: Decisions & Notifications *(Outcome Delivery)*

Manages final decisions and communication.

**User Stories**

* As a Coordinator, I can aggregate scores and record decisions.
* As an Applicant, I can receive final outcomes.
* As an Admin, I can configure automated decision emails.

**Functional Requirements**

* Decision phase configuration.
* Applicant-facing decision status.
* Bulk/automated communication tools.

---

### 4.7 Slice 7: Reporting & Analytics *(Cross-Cutting)*

Enables data-driven insights.

**User Stories**

* As an Admin, I can see dashboards on Campaign activity.
* As a Manager, I can export data for offline analysis.

**Functional Requirements**

* Dashboards with KPIs (applications, completion rates, diversity metrics).
* CSV/Excel export.
* Drill-down analytics by program and phase.

---

## 5. Non-Functional Requirements

* **Performance**: Must handle 10k+ concurrent applications without degradation.
* **Security**: Role-based access, encrypted data, GDPR-compliant.
* **Usability**: Drag-and-drop, inline validation, clear status indicators.
* **Scalability**: Support multiple programs, teams, and cohorts simultaneously.
* **Compatibility**: Support all modern browsers; responsive for desktop/tablet.

---

## 6. Technical Considerations

* **Frontend**: React + Next.js + Tailwind + shadcn/ui.
* **Backend**: Next.js API Routes, Supabase (auth, DB, edge functions).
* **Data Model**: Templates → Campaigns → Phases → Submissions → Reviews.
* **Integrations**: Email (SendGrid), Calendar (Google/Outlook), SMS (Twilio).
* **Auditability**: Immutable logs of user actions.
* **Testing**: Unit + integration tests for all slices before release.

---

## 7. UI/UX Integration

* **Consistency**: Common design language across Pathways, Campaigns, and Dashboards.
* **Clarity**: Visual cues for status, progress, and role-specific tasks.
* **Accessibility**: WCAG 2.1 AA compliance.
* **Responsiveness**: Desktop-first; tablet supported; mobile optional for MVP.
* **Multi-view Layouts**: Kanban, table, and calendar views for Campaigns.

---

## 8. Other Considerations

*   Consider supporting versioning for Pathway Templates to track changes over time.
*   Explore options for cloning existing Pathway Templates to speed up creation.

# For Reference Only
@Global Gateway App 3.0

# Structure

Here's a breakdown of the proposed structure for our project:

/app (Next.js App Router): This is the core of Next.js routing.

/(public): Perfect for unauthenticated marketing pages, application forms, or magic link landing pages, ensuring a clear separation from authenticated content.
/(portal): Ideal for the participant-facing dashboard and workflows, tailored to the applicant/nominee persona.
/(workbench): Great for grouping routes for internal users like managers, coordinators, and reviewers, reflecting their specific tools and views.
/(admin): Clearly designates routes for platform owners and administrators, ensuring their specialized console is distinct.

(Example for specific dasbhoards: /auth/portal/home;
/auth/workbench/desk;
/auth/admin/console)

/api: Standard for Next.js Route Handlers, allowing for versioned RESTful APIs as needed. This directly supports our API-driven platform requirement.
/components: This will house all shared UI components.

It will contain the ui subdirectory for Shadcn/UI components and other custom, reusable presentational components that are not tied to a specific feature.
/features: This is a crucial addition that strongly supports the Vertical Implementation Strategy.

Each "vertical slice" (e.g., Pathway Templates, Campaign Management, Scheduling) can have its own directory here, encapsulating related UI, business logic, data fetching, and potentially even local API routes or hooks specific to that feature. This promotes high cohesion and low coupling.
/lib: This is the designated place for general utility functions and helpers, as per AI_RULES.md.

/services: This directory is excellent for encapsulating domain-specific business logic.

Functions here would orchestrate interactions with the database (via Supabase client), external integrations, and other parts of the application, keeping complex logic separate from UI components and API routes.
/integrations: This is where all third-party connectors will reside, including our Supabase client (src/integrations/supabase/client.ts), Mailgun, calendar integrations, etc. This makes external dependencies easy to locate and manage.

/db: This will be useful for database-related files. While Supabase handles migrations directly, this could store schema definitions, type generation scripts, or any other database-specific utilities.

/hooks: As specified in AI_RULES.md, this will contain all reusable React hooks.

/context: This is the appropriate place for global state management using React Context API, as per AI_RULES.md.

/styles: While src/app/globals.css and tailwind.config.ts are the primary styling files, this directory could be used for any additional global styling configurations or theme-related utilities if they become necessary beyond the core setup. Adhere to Material Design 3 Principles.

/tests: Standard practice for housing all unit and integration tests.

The specific dasbboards of each would be as follows
