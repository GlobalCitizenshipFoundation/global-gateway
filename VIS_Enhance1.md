# Vertical Implementation Strategy for Platform Enhancements

This document outlines a detailed Vertical Implementation Strategy to bring the envisioned enhancements to Global Gateway's Pathway Template Management to life. This strategy ensures that each development vertical delivers end-to-end functionality, builds upon previous work, and rigorously adheres to **SOLID principles** and **Object-Oriented Programming (OOP) concepts** for a maintainable, scalable, and extensible platform.

## Core Principles Guiding Vertical Implementation

1.  **Vertical Slices:** Each vertical will deliver a complete, demonstrable piece of functionality across all layers (Database, Services, Server Actions, UI/UX).
2.  **Iterative Enhancement:** Features will be introduced and refined incrementally.
3.  **SOLID & OOP First:** Every design and implementation decision will be evaluated against SRP, OCP, LSP, ISP, DIP, Encapsulation, Polymorphism, and Abstraction.
4.  **Material Design 3 (M3) Adherence:** All UI/UX elements will strictly follow M3 guidelines for consistency and accessibility.
5.  **Robust Error Handling:** Consistent error reporting and user feedback (`sonner` toasts, dedicated error pages) will be integrated from the start.
6.  **Security by Design:** RLS and Server Action authorization will be paramount in every vertical.

---

### Vertical 1: Core Visual Workflow & Basic Conditional Branching

**Objective:** Establish the interactive visual canvas for pathway design, allowing users to intuitively arrange phases and introduce the simplest form of conditional flow.

**Key Enhancements:**
*   **Visual Canvas:** Transform the phase list into an interactive, drag-and-drop visual canvas.
*   **Drag-and-Drop Reordering:** Enhance existing reordering to work visually on the canvas.
*   **Basic Conditional Branching:** Introduce the ability to define a simple "if/else" condition after a "Decision" or "Review" phase, directing the workflow to one of two subsequent phases.
*   **New Node Types:** Visually represent "Start" and "End" points, and a "Conditional Branch" node.

**Database Layer (`public.phases` table):**
*   **Schema Update:** The `config` JSONB field in the `phases` table will be extended to store basic branching logic. For a "Decision" or "Review" phase, its `config` might include `next_phase_id_on_success` and `next_phase_id_on_failure` (or similar conditional pointers).
*   **SOLID/OOP Focus:**
    *   **OCP:** The `phases` table schema remains stable, and new logic is stored within the flexible `config` JSONB, allowing for extension without modification of the table structure.
    *   **Encapsulation:** The specific details of how branching is stored are encapsulated within the `config` field, abstracted from the core `Phase` entity.

**Service Layer (`src/features/pathways/services/pathway-template-service.ts`):**
*   **New Function:** `updatePhaseBranchingConfig(phaseId: string, configUpdates: Record<string, any>)`: A dedicated function to update only the branching-related part of a phase's configuration.
*   **SOLID/OOP Focus:**
    *   **SRP:** The service functions remain focused on CRUD operations for phases and now specifically for updating *parts* of the `config`.
    *   **DIP:** The service exposes an abstract way to update configuration, not tied to specific UI elements.

**Backend (Next.js Server Actions - `src/features/pathways/actions.ts`):**
*   **New Action:** `updatePhaseBranchingAction(phaseId: string, pathwayTemplateId: string, formData: FormData)`: This action will extract branching logic from `formData` and call the new service function.
*   **Authorization:** `authorizeTemplateAction` will be used to ensure only authorized users (creator or admin) can modify the template's phases and their configurations.
*   **Validation:** Server-side validation will ensure that `next_phase_id` references valid, existing phases within the same template.
*   **Revalidation:** `revalidatePath` for the template detail page.
*   **SOLID/OOP Focus:**
    *   **SRP:** Actions remain focused on handling form data, authorization, and calling the appropriate service.
    *   **DIP:** Actions depend on the `pathways-service` abstraction.

**Frontend (UI/UX - `src/features/pathways/components/PathwayTemplateDetail.tsx`, `src/features/pathways/components/WorkflowCanvas.tsx` (new), `src/features/pathways/components/BranchingConfigDialog.tsx` (new)):**
*   **`PathwayTemplateDetail.tsx`:** Will orchestrate the `WorkflowCanvas` and related configuration dialogs.
*   **`WorkflowCanvas.tsx` (New Client Component):**
    *   Will render phases as M3-styled cards/nodes on a canvas.
    *   Will use `@hello-pangea/dnd` for visual drag-and-drop reordering.
    *   Will display visual connectors between phases, including basic conditional branches.
    *   **Interaction:** Clicking on a phase or a conditional branch will open a configuration dialog.
    *   **M3 Adherence:** Use `Card` components for phases, subtle motion for drag-and-drop, and clear visual indicators for connections.
*   **`BranchingConfigDialog.tsx` (New Client Component):**
    *   An M3 `Dialog` that appears when a conditional phase is selected.
    *   Provides simple dropdowns to select the "next phase on success" and "next phase on failure."
    *   Uses `react-hook-form` and `zod` for client-side validation.
    *   Submits data via `updatePhaseBranchingAction`.
*   **SOLID/OOP Focus:**
    *   **SRP:** `WorkflowCanvas` focuses on visualization and interaction; `BranchingConfigDialog` focuses on input and submission.
    *   **Polymorphism:** The `WorkflowCanvas` will render different visual representations for `PhaseNode`, `StartNode`, `EndNode`, and `ConditionalBranchNode` based on their underlying data structure (which extends `BaseConfigurableItem`).
    *   **Encapsulation:** Each UI component manages its own state and rendering logic.

**Edge Case Handling (within Vertical 1):**
*   **Invalid Connections:** Client-side validation in `BranchingConfigDialog` will prevent selecting non-existent phases. Server-side validation in `updatePhaseBranchingAction` will ensure the selected `next_phase_id`s are valid UUIDs and belong to the same template.
*   **Unreachable Paths:** Initially, the UI will not prevent unreachable paths, but the `BranchingConfigDialog` will ensure a default path is always selected. Future verticals will add validation for this.
*   **Deleting Connected Phases:** The existing `deletePhaseAction` will handle cascading deletion. The UI will refresh to reflect broken connections.

---

### Vertical 2: Advanced Form Builder & Generic Task Management

**Objective:** Significantly enhance the "Form" phase configuration with dynamic fields and introduce a generic task management system applicable to any phase.

**Key Enhancements:**
*   **Advanced Form Fields:** Expand `FormPhaseConfig` to support conditional field display, field grouping/sections, and advanced validation rules (regex, min/max).
*   **Generic Phase Tasks:** Introduce the ability to define sub-tasks within *any* phase, assignable to roles or specific users, with optional due dates.
*   **Task Tracking:** Basic UI for viewing and marking tasks as complete.

**Database Layer:**
*   **`public.phases` table:** `config` JSONB will store advanced form field definitions (including conditional display logic) for "Form" phases.
*   **New Table: `public.phase_tasks`:**
    *   `id`: `UUID` (Primary Key, `gen_random_uuid()` default)
    *   `phase_id`: `UUID` (NOT NULL, Foreign Key referencing `public.phases(id)` ON DELETE CASCADE)
    *   `name`: `TEXT` (NOT NULL)
    *   `description`: `TEXT` (NULLABLE)
    *   `assigned_to_role`: `TEXT` (NULLABLE, e.g., 'applicant', 'reviewer', 'admin')
    *   `assigned_to_user_id`: `UUID` (NULLABLE, Foreign Key referencing `auth.users(id)`)
    *   `due_date`: `TIMESTAMP WITH TIME ZONE` (NULLABLE)
    *   `status`: `TEXT` (NOT NULL, DEFAULT 'pending', e.g., 'pending', 'completed')
    *   `order_index`: `INTEGER` (NOT NULL, Unique constraint for `(phase_id, order_index)`)
    *   `created_at`: `TIMESTAMP WITH TIME ZONE` (DEFAULT `NOW()`)
    *   `updated_at`: `TIMESTAMP WITH TIME ZONE` (DEFAULT `NOW()`)
*   **RLS for `public.phase_tasks`:**
    *   `ALTER TABLE public.phase_tasks ENABLE ROW LEVEL SECURITY;`
    *   **SELECT Policy:** Allow users to view tasks if they can view the parent phase (via `phases` and `pathway_templates` RLS).
    *   **INSERT Policy:** Allow only `creator_id` of parent template or 'admin' to insert tasks.
    *   **UPDATE Policy:** Allow `creator_id` of parent template, 'admin', or the `assigned_to_user_id` to update tasks (e.g., mark complete).
    *   **DELETE Policy:** Allow only `creator_id` of parent template or 'admin' to delete tasks.
*   **SOLID/OOP Focus:**
    *   **SRP:** `phase_tasks` table has a single responsibility: storing task data.
    *   **OCP:** New task types or assignment methods can be added without changing the `phase_tasks` schema, using `description` or future `config` fields.
    *   **Encapsulation:** Task details are encapsulated within the `phase_tasks` table.

**Service Layer:**
*   **`src/features/pathways/services/pathway-template-service.ts`:**
    *   `updatePhaseConfig(phaseId: string, configUpdates: Record<string, any>)`: Extended to handle complex form field configurations.
*   **New Service: `src/features/pathways/services/phase-task-service.ts`:**
    *   `getPhaseTasksByPhaseId(phaseId: string)`
    *   `createPhaseTask(phaseId: string, name: string, description: string | null, assignedToRole: string | null, assignedToUserId: string | null, dueDate: string | null, orderIndex: number)`
    *   `updatePhaseTask(taskId: string, updates: Partial<Omit<PhaseTask, 'id' | 'phase_id' | 'created_at'>>)`
    *   `deletePhaseTask(taskId: string)`
*   **SOLID/OOP Focus:**
    *   **SRP:** `phase-task-service` is solely responsible for task data operations.
    *   **DIP:** Services expose high-level abstractions for task management.

**Backend (Next.js Server Actions):**
*   **`src/features/pathways/actions.ts`:**
    *   `updatePhaseConfigAction(phaseId: string, pathwayTemplateId: string, configUpdates: Record<string, any>)`: Extended to handle advanced form configurations.
*   **New Actions (`src/features/pathways/actions.ts`):**
    *   `getPhaseTasksAction(phaseId: string)`
    *   `createPhaseTaskAction(phaseId: string, formData: FormData)`
    *   `updatePhaseTaskAction(taskId: string, formData: FormData)`
    *   `deletePhaseTaskAction(taskId: string)`
*   **Authorization:** All new actions will use `authorizeTemplateAction` (for parent template access) and additional checks for `assigned_to_user_id` for task updates.
*   **Validation:** Server-side validation for task fields and assignments.
*   **Revalidation:** `revalidatePath` for relevant template/phase pages.
*   **SOLID/OOP Focus:**
    *   **SRP:** Actions remain thin wrappers around service calls with authorization.
    *   **DIP:** Actions depend on service abstractions.

**Frontend (UI/UX):**
*   **`src/features/pathways/components/phase-configs/FormPhaseConfig.tsx`:**
    *   **Overhaul:** Implement UI for conditional field display (e.g., a rule builder for each field), field grouping (e.g., using `Accordion` or nested `Card` components), and advanced validation options.
    *   **M3 Adherence:** Use `Input`, `Select`, `Switch`, `Textarea`, `Accordion` components, ensuring proper spacing and typography.
*   **`src/features/pathways/components/PhaseConfigurationPanel.tsx`:**
    *   Will be updated to include a new section for "Tasks" for *all* phase types.
*   **New Component: `src/features/pathways/components/PhaseTaskManagementPanel.tsx`:**
    *   A client component rendered within `PhaseConfigurationPanel`.
    *   Displays a list of tasks for the current phase.
    *   Provides UI for adding, editing, deleting tasks (using `Dialogs` for forms).
    *   Includes `Select` for role/user assignment and `Calendar` for due dates.
    *   **M3 Adherence:** Use `List` components, `Checkbox`, `Button` (outlined, icon), `Input`, `Select`, `Calendar` (in `Popover`).
*   **SOLID/OOP Focus:**
    *   **OCP:** `FormPhaseConfig` is extended, but the core `PhaseConfigurationPanel` remains closed to modification for new phase types.
    *   **SRP:** `PhaseTaskManagementPanel` is solely responsible for task UI.
    *   **ISP:** Different views of tasks (e.g., for an applicant vs. an admin) can be created by composing this panel or using different props.

**Edge Case Handling (within Vertical 2):**
*   **Deleting Fields with Conditional Logic:** `FormPhaseConfig` will warn users if a field used in conditional logic is deleted. Server-side validation will ensure consistency.
*   **Unassigned Tasks:** `PhaseTaskManagementPanel` will visually highlight unassigned tasks. Server-side validation in `createPhaseTaskAction` can enforce assignment for critical tasks.
*   **Deleted Roles/Users:** The UI will display "Unassigned" or "Invalid User" for tasks if the assigned role/user no longer exists.

---

### Vertical 3: Richer Review Workflows & Reviewer Assignments

**Objective:** Implement advanced review capabilities, including multi-round reviews, detailed rubrics, and a system for managing reviewer assignments.

**Key Enhancements:**
*   **Multi-Round Reviews:** Allow defining multiple review rounds within a "Review" phase.
*   **Detailed Rubrics:** Enhance rubric criteria with more options (e.g., weighting).
*   **Reviewer Assignment Management:** UI for assigning reviewers to applications (manual assignment initially).
*   **Reviewer Dashboard Integration:** Display assigned reviews and their status on the `ReviewerDashboard`.

**Database Layer:**
*   **`public.phases` table:** `config` JSONB for "Review" phases will store multi-round review definitions, detailed rubric criteria (including weighting), and reviewer assignment policies.
*   **`public.reviewer_assignments` table:** (Already exists) Will be actively used.
*   **`public.reviews` table:** (Already exists) Will be actively used.
*   **SOLID/OOP Focus:**
    *   **OCP:** `phases.config` allows extending review logic without schema changes.
    *   **Encapsulation:** Review logic and assignment details are encapsulated within their respective tables and `config` fields.

**Service Layer:**
*   **`src/features/pathways/services/pathway-template-service.ts`:**
    *   `updatePhaseConfig(phaseId: string, configUpdates: Record<string, any>)`: Extended to handle multi-round review configurations.
*   **`src/features/evaluations/services/evaluation-service.ts`:** (Already exists)
    *   `getReviewerAssignments`, `createReviewerAssignment`, `updateReviewerAssignment`, `deleteReviewerAssignment`, `getReviews`, `createReview`, `updateReview`.
*   **SOLID/OOP Focus:**
    *   **SRP:** `evaluation-service` focuses solely on evaluation data.
    *   **DIP:** Services provide abstract interfaces for review and assignment management.

**Backend (Next.js Server Actions):**
*   **`src/features/pathways/actions.ts`:**
    *   `updatePhaseConfigAction`: Extended for richer review configurations.
*   **`src/features/evaluations/actions.ts`:** (Already exists)
    *   `getReviewerAssignmentsAction`, `createReviewerAssignmentAction`, `updateReviewerAssignmentAction`, `getReviewsAction`, `createReviewAction`, `updateReviewAction`.
*   **Authorization:** `authorizeTemplateAction` for phase config, `authorizeApplicationAccessForEvaluation` for assignments/reviews.
*   **Validation:** Server-side validation for rubric scores, assignment logic.
*   **Revalidation:** `revalidatePath` for relevant pages.
*   **SOLID/OOP Focus:**
    *   **SRP:** Actions handle authorization and data transformation before calling services.

**Frontend (UI/UX):**
*   **`src/features/pathways/components/phase-configs/ReviewPhaseConfig.tsx`:**
    *   **Overhaul:** Implement UI for defining multiple review rounds (e.g., using `Tabs` or `Accordion` for each round), detailed rubric criteria (with weighting inputs), and advanced reviewer assignment policies (e.g., number of reviewers per application).
    *   **M3 Adherence:** Use `Tabs`, `Accordion`, `Input`, `Select`, `Switch`, `RadioGroup`, `Button` components.
*   **`src/features/applications/components/ApplicationDetail.tsx`:**
    *   **New Section:** A dedicated section for "Reviewer Assignments" within the application detail.
    *   **UI:** Display current assignments, allow authorized users to manually assign/unassign reviewers (using a `Dialog` with a user `Select`).
    *   **M3 Adherence:** Use `Card` for the section, `Table` or `List` for assignments, `Select` for reviewer selection.
*   **`src/features/evaluations/components/ReviewerDashboard.tsx`:**
    *   **Enhancement:** Clearly display assigned applications, their current review status, and direct links to submit/edit reviews.
    *   **M3 Adherence:** Use `Card` components for assignments/reviews, `Badge` for status, `Button` for actions.
*   **`src/features/evaluations/components/ReviewForm.tsx`:**
    *   **Enhancement:** Adapt to display rubrics for specific review rounds if applicable.
    *   **M3 Adherence:** Maintain existing M3 form styling.
*   **SOLID/OOP Focus:**
    *   **SRP:** `ReviewPhaseConfig` focuses on defining review rules; `ApplicationDetail` integrates assignment management.
    *   **ISP:** `ReviewerDashboard` provides a focused view for reviewers.
    *   **Polymorphism:** `ReviewForm` can adapt to different rubric structures based on phase config.

**Edge Case Handling (within Vertical 3):**
*   **Incomplete Rubrics:** `ReviewPhaseConfig` will enforce complete rubrics via client-side validation. Server-side validation will prevent saving incomplete configurations.
*   **Reviewer Bias/Inconsistency:** Initial implementation will focus on data collection. Reporting tools for this will be in a later vertical.
*   **Changing Rubric Mid-Review:** The UI will warn administrators about the impact of changing a rubric on active reviews.

---

### Vertical 4: Dynamic Email Automation & Integrated Scheduling

**Objective:** Fully implement dynamic email content, advanced triggers, and the core scheduling system, including host availability and applicant booking.

**Key Enhancements:**
*   **Dynamic Email Content:** Implement a robust system for dynamic placeholders and conditional content blocks within email templates.
*   **Advanced Email Triggers:** Allow configuring emails to send based on various workflow events (e.g., phase entry, task completion, conditional branch outcome).
*   **Host Availability Management:** UI for internal users to set their availability for scheduling phases.
*   **Applicant Self-Scheduling Portal:** A dedicated interface for applicants to book interview slots.
*   **Automated Meeting Links:** Integration with a placeholder video conferencing tool (e.g., a generic link generator).

**Database Layer:**
*   **`public.phases` table:** `config` JSONB for "Email" phases will store dynamic content rules, advanced trigger definitions, and placeholder mappings. For "Scheduling" phases, it will store interview duration, buffer time, and host pool selection.
*   **New Table: `public.host_availabilities`:**
    *   `id`: `UUID` (Primary Key)
    *   `user_id`: `UUID` (NOT NULL, FK to `auth.users(id)`)
    *   `start_time`: `TIMESTAMP WITH TIME ZONE` (NOT NULL)
    *   `end_time`: `TIMESTAMP WITH TIME ZONE` (NOT NULL)
    *   `is_available`: `BOOLEAN` (NOT NULL, DEFAULT TRUE)
    *   `created_at`, `updated_at`
*   **New Table: `public.scheduled_interviews`:**
    *   `id`: `UUID` (Primary Key)
    *   `application_id`: `UUID` (NOT NULL, FK to `public.applications(id)`)
    *   `campaign_phase_id`: `UUID` (NOT NULL, FK to `public.campaign_phases(id)`)
    *   `host_id`: `UUID` (NOT NULL, FK to `auth.users(id)`)
    *   `applicant_id`: `UUID` (NOT NULL, FK to `auth.users(id)`)
    *   `start_time`: `TIMESTAMP WITH TIME ZONE` (NOT NULL)
    *   `end_time`: `TIMESTAMP WITH TIME ZONE` (NOT NULL)
    *   `meeting_link`: `TEXT` (NULLABLE)
    *   `status`: `TEXT` (NOT NULL, DEFAULT 'booked', e.g., 'booked', 'canceled', 'completed')
    *   `created_at`, `updated_at`
*   **RLS for new tables:** Enable RLS with appropriate policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` based on user roles (host, applicant, admin/coordinator).
*   **SOLID/OOP Focus:**
    *   **SRP:** Each new table has a single, clear responsibility.
    *   **OCP:** `phases.config` allows extending email/scheduling logic.

**Service Layer:**
*   **`src/features/pathways/services/pathway-template-service.ts`:**
    *   `updatePhaseConfig`: Extended for email/scheduling configurations.
*   **`src/features/communications/services/communication-service.ts`:**
    *   `sendAutomatedEmail(templateId: string, recipientId: string, contextData: Record<string, any>)`: New function to send emails with dynamic content.
*   **New Service: `src/features/scheduling/services/scheduling-service.ts`:**
    *   `getHostAvailabilities(userId?: string)`
    *   `createHostAvailability(userId: string, startTime: string, endTime: string)`
    *   `updateHostAvailability(id: string, updates: Partial<HostAvailability>)`
    *   `deleteHostAvailability(id: string)`
    *   `getAvailableSlots(campaignPhaseId: string, dateRange: { start: string, end: string })`
    *   `bookInterview(applicationId: string, campaignPhaseId: string, hostId: string, applicantId: string, startTime: string, endTime: string)`
    *   `cancelInterview(interviewId: string)`
*   **SOLID/OOP Focus:**
    *   **SRP:** `scheduling-service` is dedicated to scheduling logic.
    *   **DIP:** `communication-service` depends on an abstract `IContentRenderer` for dynamic content.

**Backend (Next.js Server Actions):**
*   **`src/features/pathways/actions.ts`:**
    *   `updatePhaseConfigAction`: Extended for email/scheduling configurations.
*   **`src/features/communications/actions.ts`:**
    *   `sendAutomatedEmailAction(templateId: string, recipientId: string, contextData: Record<string, any>)`: New action.
*   **New Actions (`src/features/scheduling/actions.ts`):**
    *   `getHostAvailabilitiesAction`, `createHostAvailabilityAction`, `updateHostAvailabilityAction`, `deleteHostAvailabilityAction`.
    *   `getAvailableSlotsAction`, `bookInterviewAction`, `cancelInterviewAction`.
*   **Authorization:** `authorizeTemplateAction` for phase config. `authorizeSchedulingAction` (new helper) for host/applicant access to scheduling data.
*   **Validation:** Server-side validation for time conflicts, valid host IDs.
*   **Revalidation:** `revalidatePath` for relevant pages.
*   **SOLID/OOP Focus:**
    *   **SRP:** Actions remain focused.
    *   **DIP:** Actions depend on service abstractions.

**Frontend (UI/UX):**
*   **`src/features/pathways/components/phase-configs/EmailPhaseConfig.tsx`:**
    *   **Overhaul:** Integrate a rich text editor with a placeholder selector. Implement UI for conditional content blocks (e.g., using a simple rule builder). Add options for advanced trigger events.
    *   **M3 Adherence:** Use a rich text editor component (e.g., a custom one built with `Textarea` and `Button` for placeholders), `Select` for triggers, `Switch` for conditional blocks.
*   **`src/features/pathways/components/phase-configs/SchedulingPhaseConfig.tsx`:**
    *   **Overhaul:** Implement UI for defining interview duration, buffer time, and selecting host pools.
    *   **M3 Adherence:** Use `Input` (number), `Select` for host pools.
*   **`src/app/(workbench)/scheduling/page.tsx`:**
    *   **Overhaul:** This page will become the "Scheduling Dashboard."
    *   **UI:** Display host availability calendar, list of upcoming interviews, and tools for managing host availability.
    *   **M3 Adherence:** Use `Calendar` component, `Table` for interviews, `Dialogs` for availability forms.
*   **New Component: `src/app/(portal)/my-interviews/page.tsx` (or similar):**
    *   A new page for applicants to view their scheduled interviews and self-book slots for "Scheduling" phases.
    *   **UI:** Display available slots (fetched via `getAvailableSlotsAction`), allow booking.
    *   **M3 Adherence:** Use `Calendar` for slot selection, `Button` for booking.
*   **SOLID/OOP Focus:**
    *   **SRP:** Dedicated components for email config, scheduling config, host dashboard, and applicant portal.
    *   **Polymorphism:** `EmailPhaseConfig` can render different content based on selected template.
    *   **ISP:** Different views for hosts and applicants.

**Edge Case Handling (within Vertical 4):**
*   **Missing Placeholder Data:** The `EmailPhaseConfig` will include a "Test Email" feature to preview with sample data. The `sendAutomatedEmailAction` will gracefully handle missing data (empty string).
*   **Time Zone Conflicts:** All times stored in UTC, UI will convert to local time with clear labels.
*   **Overlapping Bookings:** `scheduling-service` will enforce conflict detection during `bookInterview`.
*   **Host Unavailability:** `scheduling-service` will filter out unavailable slots. UI will reflect this.

---

### Vertical 5: Advanced Decision Automation & Recommendation Management

**Objective:** Implement complex decision rules, trigger sophisticated downstream actions, and provide a full lifecycle for managing recommendations.

**Key Enhancements:**
*   **Decision Rule Builder:** Allow defining rules that automatically set an `outcome` based on aggregated data from previous phases.
*   **Workflow Progression:** Expand "Automated Next Step" to trigger more complex actions (e.g., initiating a new sub-workflow, updating external systems).
*   **Automated Recommendation Requests:** System to automatically send requests to recommenders.
*   **Recommender Portal:** A secure, public-facing portal for recommenders to submit recommendations.
*   **Recommendation Status Tracking:** Detailed tracking of recommendation status within application details.

**Database Layer:**
*   **`public.phases` table:** `config` JSONB for "Decision" phases will store complex decision rules and advanced automated actions. For "Recommendation" phases, it will store policies (num recommenders, custom form definition, reminder schedule).
*   **New Table: `public.recommendation_requests`:**
    *   `id`: `UUID` (Primary Key)
    *   `application_id`: `UUID` (NOT NULL, FK to `public.applications(id)`)
    *   `recommender_email`: `TEXT` (NOT NULL)
    *   `recommender_name`: `TEXT` (NULLABLE)
    *   `unique_token`: `TEXT` (NOT NULL, Unique, for portal access)
    *   `status`: `TEXT` (NOT NULL, DEFAULT 'pending', e.g., 'pending', 'sent', 'viewed', 'submitted', 'overdue')
    *   `request_sent_at`: `TIMESTAMP WITH TIME ZONE`
    *   `submitted_at`: `TIMESTAMP WITH TIME ZONE` (NULLABLE)
    *   `form_data`: `JSONB` (NULLABLE, for recommender's submission)
    *   `created_at`, `updated_at`
*   **RLS for `public.recommendation_requests`:** Enable RLS with policies allowing applicants to view their own requests, recommenders to access their specific request via token, and admin/campaign creators to manage all requests.
*   **SOLID/OOP Focus:**
    *   **SRP:** `recommendation_requests` table focuses on recommendation data.
    *   **OCP:** `phases.config` allows extending decision/recommendation logic.

**Service Layer:**
*   **`src/features/pathways/services/pathway-template-service.ts`:**
    *   `updatePhaseConfig`: Extended for decision/recommendation configurations.
*   **`src/features/evaluations/services/evaluation-service.ts`:** (Already exists)
    *   `createDecision`, `updateDecision`.
*   **New Service: `src/features/recommendations/services/recommendation-service.ts`:**
    *   `createRecommendationRequest(applicationId: string, recommenderEmail: string, recommenderName: string | null)`
    *   `getRecommendationRequestByToken(token: string)`
    *   `submitRecommendation(requestId: string, formData: Record<string, any>)`
    *   `updateRecommendationRequestStatus(requestId: string, status: string)`
*   **SOLID/OOP Focus:**
    *   **SRP:** `recommendation-service` is dedicated to recommendation logic.
    *   **DIP:** Services depend on abstract communication and form-building capabilities.

**Backend (Next.js Server Actions):**
*   **`src/features/pathways/actions.ts`:**
    *   `updatePhaseConfigAction`: Extended for decision/recommendation configurations.
*   **`src/features/evaluations/actions.ts`:**
    *   `createDecisionAction`, `updateDecisionAction`.
*   **New Actions (`src/features/recommendations/actions.ts`):**
    *   `createRecommendationRequestAction(applicationId: string, formData: FormData)`
    *   `getRecommendationRequestByTokenAction(token: string)`
    *   `submitRecommendationAction(token: string, formData: FormData)`
    *   `updateRecommendationRequestStatusAction(requestId: string, status: string)`
*   **Authorization:** `authorizeTemplateAction` for phase config. `authorizeApplicationAccessForEvaluation` for decisions. `authorizeRecommendationRequest` (new helper) for recommendation requests.
*   **Validation:** Server-side validation for decision rules, recommendation form data.
*   **Revalidation:** `revalidatePath` for relevant pages.
*   **SOLID/OOP Focus:**
    *   **SRP:** Actions handle specific recommendation/decision operations.

**Frontend (UI/UX):**
*   **`src/features/pathways/components/phase-configs/DecisionPhaseConfig.tsx`:**
    *   **Overhaul:** Implement a "Decision Rule Builder" UI (e.g., using a dynamic list of conditions and outcomes). Expand "Automated Next Step" to include more complex actions.
    *   **M3 Adherence:** Use `Input`, `Select`, `Switch`, `Button` for rule building.
*   **`src/features/pathways/components/phase-configs/RecommendationPhaseConfig.tsx`:**
    *   **Overhaul:** Implement UI for defining the number of recommenders, custom recommender information fields (reusing `FormPhaseConfig` logic), and reminder schedules.
    *   **M3 Adherence:** Use `Input` (number), `Select`, `Button` for field management.
*   **`src/features/applications/components/ApplicationDetail.tsx`:**
    *   **New Section:** A dedicated section for "Recommendations" within the application detail.
    *   **UI:** Display a list of recommendation requests, their status, and actions (send reminder, view submission).
    *   **M3 Adherence:** Use `Card` for the section, `List` for requests, `Badge` for status, `Button` for actions.
*   **New Page: `src/app/(public)/recommendation/[token]/page.tsx` (Recommender Portal):**
    *   A public-facing page where recommenders can submit their forms.
    *   **UI:** Dynamically render the recommendation form based on the phase configuration.
    *   **M3 Adherence:** Use `Form` components, `Button` for submission.
*   **SOLID/OOP Focus:**
    *   **SRP:** Dedicated components for decision config, recommendation config, and the recommender portal.
    *   **Polymorphism:** Recommender portal can render different forms.

**Edge Case Handling (within Vertical 5):**
*   **Conflicting Decision Rules:** The UI will provide warnings for conflicting rules. Server-side logic will apply a defined precedence.
*   **Unintended Consequences:** A "dry run" feature for decision rules will be considered for future iterations.
*   **Recommender Spam/Abuse:** Implement basic CAPTCHA on the recommender portal.
*   **Missing Recommendation Data:** The system will gracefully handle missing data in the recommender portal.

---

### Vertical 6: Template Versioning & Global Defaults

**Objective:** Introduce robust version control for pathway templates and a centralized system for managing global settings and defaults.

**Key Enhancements:**
*   **Template Versioning:** Implement a system to save and retrieve different versions of pathway templates.
*   **Version History UI:** Display a history of template changes, allowing comparison and rollback.
*   **Global Settings Management:** A dedicated UI for administrators to define platform-wide default configurations for phases and other entities.
*   **Inheritance & Override:** Clearly indicate where a setting is inherited from a global default and allow overriding it at the template or phase level.

**Database Layer:**
*   **New Table: `public.pathway_template_versions`:**
    *   `id`: `UUID` (Primary Key)
    *   `pathway_template_id`: `UUID` (NOT NULL, FK to `public.pathway_templates(id)`)
    *   `version_number`: `INTEGER` (NOT NULL)
    *   `snapshot`: `JSONB` (Full snapshot of the template and its phases' config)
    *   `created_by`: `UUID` (FK to `auth.users(id)`)
    *   `created_at`: `TIMESTAMP WITH TIME ZONE`
*   **New Table: `public.global_settings`:**
    *   `key`: `TEXT` (Primary Key, e.g., 'default_email_subject', 'default_review_scale')
    *   `value`: `JSONB` (Stores the setting value)
    *   `description`: `TEXT` (NULLABLE)
    *   `updated_at`: `TIMESTAMP WITH TIME ZONE`
*   **RLS for new tables:** Enable RLS with policies allowing only 'admin' to manage `global_settings` and `pathway_template_versions`.
*   **SOLID/OOP Focus:**
    *   **SRP:** Each new table has a single responsibility.
    *   **OCP:** `global_settings` allows adding new settings without schema changes.

**Service Layer:**
*   **New Service: `src/features/pathways/services/template-versioning-service.ts`:**
    *   `createTemplateVersion(templateId: string, snapshot: Record<string, any>, createdBy: string)`
    *   `getTemplateVersions(templateId: string)`
    *   `getTemplateVersion(versionId: string)`
    *   `rollbackTemplateToVersion(templateId: string, versionId: string)`
*   **New Service: `src/features/settings/services/global-settings-service.ts`:**
    *   `getSetting(key: string)`
    *   `updateSetting(key: string, value: Record<string, any>)`
*   **SOLID/OOP Focus:**
    *   **SRP:** Dedicated services for versioning and global settings.
    *   **DIP:** Services depend on abstract data access.

**Backend (Next.js Server Actions):**
*   **New Actions (`src/features/pathways/actions.ts`):**
    *   `createTemplateVersionAction(templateId: string)`
    *   `getTemplateVersionsAction(templateId: string)`
    *   `rollbackTemplateAction(templateId: string, versionId: string)`
*   **New Actions (`src/features/settings/actions.ts`):**
    *   `getGlobalSettingAction(key: string)`
    *   `updateGlobalSettingAction(key: string, formData: FormData)`
*   **Authorization:** `authorizeTemplateAction` for versioning. `authorizeAdminAction` (new helper) for global settings.
*   **Validation:** Server-side validation for version data, settings keys/values.
*   **Revalidation:** `revalidatePath` for relevant pages.
*   **SOLID/OOP Focus:**
    *   **SRP:** Actions handle specific versioning/settings operations.

**Frontend (UI/UX):**
*   **`src/features/pathways/components/PathwayTemplateDetail.tsx`:**
    *   **New Tab/Section:** A "Version History" tab or section.
    *   **UI:** Display a list of versions (date, author, version number). Buttons for "View Snapshot," "Compare," "Rollback."
    *   **M3 Adherence:** Use `Table` for history, `Dialogs` for comparison/rollback confirmation.
*   **New Page: `src/app/(admin)/settings/global/page.tsx` (Global Settings Page):**
    *   **Overhaul:** This page will become the "Global Settings" dashboard.
    *   **UI:** Display configurable settings (e.g., default email subject, default review scale) with input fields.
    *   **M3 Adherence:** Use `Form` components, `Input`, `Select`, `Switch`.
*   **`src/features/pathways/components/phase-configs/*.tsx`:**
    *   **Enhancement:** UI elements will indicate when a value is inherited from a global default and provide an option to override it.
    *   **M3 Adherence:** Subtle visual cues (e.g., a small "inherited" badge, a reset button).
*   **SOLID/OOP Focus:**
    *   **SRP:** Dedicated components for version history and global settings.
    *   **DIP:** UI components depend on `ISettingsProvider` abstraction.

**Edge Case Handling (within Vertical 6):**
*   **Large History:** Implement pagination or lazy loading for version history.
*   **Conflicting Global/Local Settings:** The `HierarchicalSettingsProvider` (conceptual) will ensure correct precedence. UI will clearly show overrides.
*   **Invalid Defaults:** Client-side and server-side validation will prevent saving invalid global settings.