# Product Requirement Document (Revised - PRD_Enhance1)

## 1. Introduction and Strategic Importance

The Global Gateway platform is designed to streamline the management of diverse programs, including fellowships, hiring, awards, and grants. This revised Product Requirement Document outlines an expanded vision for the platform, transforming its core Pathway Template Management module into a sophisticated, dynamic, and visual workflow builder. This enhancement is critical for enabling intelligent automation, adaptive applicant journeys, and comprehensive process orchestration, ensuring consistency, reducing manual overhead, and accelerating the launch of new initiatives, fostering positive change through global certification and accreditation.

## 2. Core Capabilities and User Value (Enhanced)

This revised scope will deliver the following core capabilities, providing significant value to creators, administrators, applicants, and reviewers:

*   **Intuitive Visual Workflow Design:** A highly interactive, drag-and-drop visual canvas for constructing and visualizing multi-step program pathways, including clear representations of start/end points and conditional branching.
*   **Dynamic Conditional Logic:** The ability to define sophisticated rules that dynamically alter workflow paths based on data inputs, decisions, or review outcomes, creating truly adaptive applicant journeys.
*   **Granular Phase Task Management:** A system to define and assign sub-tasks within *any* phase, complete with assignees (roles or specific users), optional due dates, and basic tracking.
*   **Advanced Form Customization:** Enhanced "Form" phase configuration supporting conditional field display, logical field grouping/sections, and advanced validation rules (e.g., regex, min/max).
*   **Richer Review Processes:** Implementation of multi-round reviews, detailed rubrics with weighting, and a comprehensive system for managing reviewer assignments and their progress.
*   **Automated & Personalized Communication:** Robust dynamic email content generation with placeholders and conditional blocks, coupled with advanced triggers based on various workflow events.
*   **Integrated Scheduling System:** Tools for internal users to manage their availability, and a dedicated applicant portal for self-scheduling interviews, including automated meeting link generation.
*   **Intelligent Decision Automation:** Capabilities to define complex decision rules that automatically set outcomes based on aggregated data and trigger sophisticated downstream actions.
*   **Comprehensive Recommendation Workflows:** Automated request generation, a secure public-facing portal for recommenders to submit evaluations, and detailed status tracking.
*   **Robust Template Version Control:** A system to save, retrieve, compare, and roll back different versions of pathway templates, ensuring auditability and change management.
*   **Centralized Global Defaults & Overrides:** A dedicated system for administrators to define platform-wide default configurations for phases and other entities, with clear mechanisms for inheritance and local overrides.

## 3. Granular Functional Requirements (Expanded)

### 3.1 Pathway Template Lifecycle Management (CRUD & Visuals)

*   **Create New Pathway Template:**
    *   **Interaction:** Users navigate to a dedicated creation page or trigger a modal/dialog from the template list.
    *   **Inputs:** Required text input for `Template Name`, optional multi-line text area for `Description`. A Material Design 3 `Switch` component for `Is Private` (defaulting to `FALSE`).
    *   **Validation:** Client-side (`zod`, `react-hook-form`) and server-side validation for required fields, length constraints, and uniqueness of name (within a user's templates).
    *   **Feedback:** `sonner` toast for success or validation errors.
    *   **Post-creation:** Redirect to the newly created template's detail page, which will now feature the visual workflow canvas for phase configuration.
*   **View Pathway Templates (List/Dashboard):**
    *   **Display:** A responsive grid or list view of M3-compliant `Card` components, each representing a pathway template.
    *   **Card Content:** Each card will prominently display the `Template Name` (`text-headline-small`), a truncated `Description` (`text-body-medium`), `Created At`, and `Last Updated` timestamps (`text-body-small`). A visual indicator (e.g., a lock icon) will be present for private templates.
    *   **Actions:** Each card will include M3 `Button` components for "Edit Template," "Delete Template," "View Details/Configure Phases," and "Clone Template."
        *   **Access Logic:**
            *   **Creator:** Can always see, edit, and delete their own templates.
            *   **Other Admin/Workbench Users:** Can see public templates (`is_private = FALSE`). Cannot edit or delete templates they don't own.
            *   **Super Admin (role 'admin'):** Can see, edit, and delete *all* templates, regardless of `creator_id` or `is_private` status.
    *   **Search/Filter/Sort:** A search input field to filter templates by name/description. Filter options will include "My Templates," "Public Templates," and "All Templates (Admin Only)." Dropdown menus for sorting by creation date, last updated date, or name.
    *   **Empty State:** A clear, M3-styled message and call-to-action button if no templates exist.
    *   **Loading State:** Skeleton loaders (`Skeleton` component) will be displayed while templates are being fetched.
*   **Edit Existing Pathway Template:**
    *   **Interaction:** Clicking "Edit Template" on a card or detail page will open a form (similar to creation) pre-populated with the template's current `Name`, `Description`, and `Is Private` status.
    *   **Updates:** Users can modify these fields.
    *   **Access Logic:** Only the `creator_id` or a 'super admin' can perform this action.
    *   **Validation & Feedback:** Same as creation.
    *   **Post-update:** `sonner` toast for success, update `updated_at` timestamp, and refresh the displayed information.
*   **Delete Pathway Template:**
    *   **Interaction:** Clicking "Delete Template" will trigger an M3 `AlertDialog` for confirmation.
    *   **Confirmation:** The dialog will clearly state the irreversible nature of the action, including the deletion of all associated phases.
    *   **Access Logic:** Only the `creator_id` or a 'super admin' can perform this action.
    *   **Feedback:** `sonner` toast for success or error.
    *   **Post-deletion:** Remove the template from the list and refresh the view.
*   **Template Cloning:**
    *   **Interaction:** A dedicated M3 `Button` ("Clone Template") will be available on the template list and detail pages. Clicking it will open an M3 `Dialog` prompting for a `New Template Name`.
    *   **Process:** The system will perform a deep copy of the selected pathway template, including all its phases and their `config` data. The `creator_id` of the new template will be set to the current user's ID.
    *   **Access Logic:** Any user who can *view* a template (their own, public, or any if admin) can clone it. The cloned template will be owned by the user who performed the clone.
    *   **Feedback:** `sonner` toast for success, followed by redirection to the new template's detail page.

### 3.2 Phase Management within a Pathway Template (Visual & Branching)

*   **Visual Workflow Canvas:**
    *   **Display:** The Pathway Template Detail page will feature an interactive canvas where phases are represented as M3-styled nodes.
    *   **Node Types:** Visually distinct nodes for "Start," "End," regular "Phase," and "Conditional Branch" will be rendered.
    *   **Connections:** Lines or arrows will visually connect phases, indicating the flow. Conditional branches will show diverging paths.
*   **Add New Phase:**
    *   **Interaction:** From the Pathway Template Detail page, a prominent M3 `Button` (e.g., "Add Phase") will open an M3 `Dialog` or `Sheet`.
    *   **Inputs:** `Phase Name` (text input, required), `Phase Type` (M3 `Select` dropdown, required, options: "Form", "Review", "Email", "Scheduling", "Decision", "Recommendation"), `Description` (multi-line text area, optional).
    *   **Initial State:** The `order_index` will be automatically assigned based on the current number of phases. `config` will be initialized as an empty JSON object.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can add phases.
    *   **Validation & Feedback:** Client-side and server-side validation, `sonner` toasts.
*   **View Phases (within Template Detail):**
    *   **Display:** Phases will be presented as interactive nodes on the `WorkflowCanvas`.
    *   **Node Content:** Each phase node will show `Phase Name`, `Phase Type`, and `Order Index`.
    *   **Actions:** Clicking a phase node will open a configuration dialog. Dragging a phase node will initiate reordering.
*   **Edit Phase Details (Name, Type, Description):**
    *   **Interaction:** Clicking an "Edit" button (e.g., within the phase's configuration dialog) will open a `Dialog` pre-populated with the phase's details.
    *   **Updates:** Users can modify `Phase Name`, `Phase Type`, and `Description`.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can edit phase details.
    *   **Validation & Feedback:** Same as creation.
    *   **Post-update:** `sonner` toast for success, update `updated_at` timestamp, and refresh the displayed information.
*   **Reorder Phases (Drag-and-Drop):**
    *   **Interaction:** Users can drag and drop phase nodes on the `WorkflowCanvas` to change their sequence.
    *   **Visual Feedback:** Clear visual cues (e.g., elevated shadow on drag, placeholder for drop target, subtle animation) will guide the user.
    *   **Persistence:** Upon dropping, the system will update the `order_index` for all affected phases via a Server Action.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can reorder phases.
    *   **Feedback:** `sonner` toast for successful reordering.
*   **Delete Phase:**
    *   **Interaction:** Clicking "Delete Phase" (e.g., from a phase's context menu or configuration dialog) will trigger an M3 `AlertDialog` for confirmation.
    *   **Confirmation:** The dialog will clearly confirm the deletion of the specific phase and warn about breaking connections.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can delete phases.
    *   **Feedback:** `sonner` toast for success or error.
    *   **Post-deletion:** Remove the phase from the canvas and update the `order_index` of subsequent phases.
*   **Basic Conditional Branching:**
    *   **Interaction:** For "Decision" or "Review" phase types, a dedicated "Configure Branching" option will open a `BranchingConfigDialog`.
    *   **Inputs:** Dropdowns to select the `next_phase_id` for a "success" outcome and a "failure" outcome (or similar conditional labels).
    *   **Validation:** Client-side and server-side validation to ensure selected phases are valid and within the same template.
    *   **Visual Representation:** The `WorkflowCanvas` will visually represent these conditional paths.

### 3.3 Phase-Specific Configuration (Advanced)

The `config` (JSONB) field in the `phases` table will store detailed settings for each phase type.

*   **Interaction:** Clicking "Edit Phase Configuration" on a phase node will open an M3 `Dialog` or `Sheet` containing a dynamically rendered configuration form based on the `Phase Type`.
*   **Form Phase Configuration:**
    *   **Inputs:** A dynamic list of form fields. Each field will have configurable properties: `Field Label`, `Field Type` (Text, Number, Date, Checkbox, Radio Group, File Upload, Rich Text Area, Email, URL), `Required` (M3 `Switch`), `Helper Text`, `Default Value`, `Options` (for Select, Radio, Checkbox: repeatable text inputs).
    *   **Advanced Features:**
        *   **Conditional Field Display:** Define rules (e.g., "show this field if Field X is 'Yes'") to dynamically show/hide fields.
        *   **Field Grouping/Sections:** Organize fields into collapsible sections or logical groups.
        *   **Advanced Validation:** Support for custom regex patterns, min/max length/value, and other complex validation rules.
*   **Review Phase Configuration:**
    *   **Inputs:** `Rubric Criteria` (repeatable sections with `Name`, `Description`, `Max Score`), `Scoring Scale` (M3 `Select` dropdown), `Anonymization Settings` (M3 `RadioGroup` or `Switch` components).
    *   **Advanced Features:**
        *   **Multi-Round Reviews:** Define multiple distinct review rounds within a single phase, each with its own rubric and settings.
        *   **Weighted Rubric Criteria:** Assign weights to individual rubric criteria to influence overall scores.
        *   **Reviewer Assignment Policies:** Configure policies for automatic or manual reviewer assignment (e.g., "assign 3 reviewers per application," "only assign reviewers from 'Evaluator' role").
*   **Email Phase Configuration:**
    *   **Inputs:** `Email Subject`, `Email Body` (rich text editor with dynamic placeholders), `Recipient Role(s)` (M3 `Select` dropdown, potentially multi-select), `Trigger Event` (M3 `Select` dropdown), `Selected Template ID`.
    *   **Advanced Features:**
        *   **Dynamic Content Blocks:** Ability to define conditional content within the email body (e.g., "if applicant accepted, show this paragraph").
        *   **Advanced Trigger Events:** Configure emails to send based on granular workflow events (e.g., "when Phase X is completed," "when Task Y is marked complete," "when Decision Z is made").
        *   **Placeholder Selector:** An intuitive UI to insert dynamic data placeholders (e.g., `{{applicant_name}}`, `{{campaign_name}}`) into the subject and body.
*   **Scheduling Phase Configuration:**
    *   **Inputs:** `Interview Duration`, `Buffer Time`, `Host Selection` (M3 `Select` or multi-select for internal users who can host).
    *   **Advanced Features:**
        *   **Host Availability Management:** Provide a UI for designated internal users (hosts) to set their recurring and one-off availability.
        *   **Applicant Self-Scheduling Portal:** A dedicated, secure portal for applicants to view available slots and book interviews.
        *   **Automated Meeting Links:** Automatically generate and embed meeting links (e.g., Google Meet, Zoom placeholder) into scheduled interviews and notifications.
*   **Decision Phase Configuration:**
    *   **Inputs:** `Decision Outcomes` (repeatable text inputs with `isFinal` flag), `Associated Email Template` (M3 `Select` dropdown), `Automated Next Step` (M3 `Select` dropdown).
    *   **Advanced Features:**
        *   **Decision Rule Builder:** A UI to define rules that automatically determine an application's outcome based on aggregated data (e.g., "if average review score > 4 AND all checklist items complete, then 'Accepted'").
        *   **Complex Automated Next Steps:** Trigger more sophisticated actions post-decision (e.g., "initiate onboarding sub-workflow," "update external CRM," "move to next campaign phase").
*   **Recommendation Phase Configuration:**
    *   **Inputs:** `Number of Recommenders Required`, `Recommender Information Fields` (dynamic list of fields, reusing form field logic), `Reminder Schedule`.
    *   **Advanced Features:**
        *   **Automated Request Sending:** System to automatically send recommendation requests to provided recommender emails.
        *   **Recommender Portal:** A secure, public-facing portal where recommenders can access and submit their recommendation forms.
        *   **Custom Recommender Forms:** Define the specific questions and fields recommenders need to fill out (reusing `FormPhaseConfig` field definitions).
        *   **Reminder Scheduling:** Configure automated reminders for recommenders who have not yet submitted.
*   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can modify phase configurations.
*   **Validation & Feedback:** Extensive client-side validation for configuration inputs, server-side validation for data integrity, and `sonner` toasts for all operations.

### 3.4 Generic Phase Task Management (New Section)

*   **Define Tasks:**
    *   **Interaction:** Within the `PhaseConfigurationPanel` for *any* phase type, a new section will allow adding tasks.
    *   **Inputs:** `Task Name` (text input, required), `Description` (multi-line text area, optional), `Assigned To Role` (M3 `Select` dropdown, e.g., 'applicant', 'reviewer', 'admin'), `Assigned To User` (M3 `Select` dropdown for specific users, optional), `Due Date` (M3 `Calendar` in `Popover`, optional).
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can define tasks.
*   **View & Track Tasks:**
    *   **Display:** Tasks will be listed within the `PhaseConfigurationPanel` and potentially on relevant dashboards (e.g., `ApplicationDetail` for applicant-specific tasks, `ReviewerDashboard` for reviewer tasks).
    *   **Status:** Each task will show its `status` (pending, completed) and `due_date`.
    *   **Actions:** Authorized users (assigned user, admin, template creator) can mark tasks as complete.
*   **Access Logic:**
    *   **View:** Users can view tasks if they have read access to the parent phase.
    *   **Update Status:** The assigned user, template creator, or 'super admin' can update a task's status.
    *   **Edit/Delete:** Only the template creator or 'super admin' can edit or delete tasks.

### 3.5 Template Versioning (New Section)

*   **Save New Version:**
    *   **Interaction:** A dedicated `Button` (e.g., "Save New Version") on the Pathway Template Detail page.
    *   **Process:** The system will create a snapshot of the current template (including all phases and their configurations) and store it as a new version.
    *   **Access Logic:** Only the `creator_id` of the template or a 'super admin' can save new versions.
*   **View Version History:**
    *   **Interaction:** A "Version History" tab or section on the Pathway Template Detail page.
    *   **Display:** A list of all saved versions, showing `Version Number`, `Created By`, and `Created At` timestamp.
*   **View Version Snapshot:**
    *   **Interaction:** Clicking on a version in the history will display a read-only view of the template as it existed at that version.
*   **Compare Versions:**
    *   **Interaction:** Option to select two versions and view a side-by-side comparison highlighting changes.
*   **Rollback to Version:**
    *   **Interaction:** A `Button` (e.g., "Rollback to This Version") on each version in the history, triggering an `AlertDialog` for confirmation.
    *   **Process:** The system will replace the current active template and its phases with the data from the selected version's snapshot.
    *   **Access Logic:** Only the `creator_id` of the template or a 'super admin' can perform a rollback.

### 3.6 Global Settings and Defaults (New Section)

*   **Manage Global Settings:**
    *   **Interaction:** A dedicated "Global Settings" page within the Admin Dashboard.
    *   **Inputs:** A dynamic list of configurable settings (e.g., `Default Email Subject`, `Default Review Scoring Scale`, `Default Form Field Validation Rules`). Each setting will have a `Key`, `Value` (JSONB), and `Description`.
    *   **Access Logic:** Only 'super admin' can view and modify global settings.
*   **Inheritance & Override in Phase Configuration:**
    *   **Display:** Within phase-specific configuration forms (e.g., `EmailPhaseConfig`, `ReviewPhaseConfig`), fields that have a global default will visually indicate this (e.g., a small "Inherited from Global" badge).
    *   **Interaction:** Users will have an option (e.g., a `Switch` or `Button`) to "Override Global Default" for a specific setting, allowing them to customize it at the template or phase level.
    *   **Persistence:** Overridden values will be stored in the phase's `config` JSONB.

## 4. UI/UX Design Principles (Material Design 3 Enforcement - Enhanced)

Every aspect of the Global Gateway UI will strictly adhere to Material Design 3 specifications, ensuring a cohesive, accessible, and delightful user experience. This includes:

*   **Dynamic Color Theming:** The primary seed color (`#880E4F`) will continue to drive the full M3 tonal palette, ensuring WCAG 2.1 AAA contrast ratios in both light and dark themes.
*   **Typography:** Consistent application of the M3 type scale (`display-small`, `headline-large`, `title-medium`, `body-large`, `label-large`) across all new and existing components.
*   **Elevation and Shape:** M3 `Card` components with `rounded-xl` or `rounded-md` corners and appropriate `shadow-md`/`shadow-lg` for elevation will be used for all content blocks, including new visual workflow nodes and task cards. `Dialog` and `Sheet` components will provide distinct, elevated surfaces for forms and configurations.
*   **Motion:** Smooth `transition-all duration-300` will be applied to all interactive elements.
    *   **Visual Workflow:** Drag-and-drop reordering on the canvas will feature subtle `translate-y` and `shadow` animations. Connections will animate on changes.
    *   **Dialogs/Sheets:** M3-compliant entrance and exit animations.
    *   **Feedback:** `sonner` toasts will appear with M3-consistent animations.
*   **Layout and Spacing:** Strict adherence to the 8dp grid system for all margins, paddings, and gaps. Responsive layouts will be desktop-first, adapting gracefully to tablet and mobile.
*   **Interactive Elements:**
    *   **Buttons:** M3 `Button` variants (Filled, Outlined, Tonal) will be used contextually.
    *   **Text Fields:** `Input` and `Textarea` components will use outlined or filled variants with floating labels, clear affordances, and animated focus states.
    *   **Select/Dropdowns:** M3 `Select` components for single-choice selections.
    *   **Checkboxes/Radio Buttons/Switches:** M3-compliant components with proper label alignment and accessible states.
    *   **Visual Workflow Canvas:** Interactive nodes, draggable handles, and clickable connection points will be designed for intuitive interaction.

## 5. Technical Implementation Strategy (Referencing `VIS_Enhance1.md`)

The detailed technical implementation plan, including the breakdown into vertical slices, adherence to SOLID principles and OOP concepts, database schema changes, service layer functions, Next.js Server Actions, and specific UI/UX component usage, is fully documented in `VIS_Enhance1.md`. This document serves as the comprehensive guide for the engineering team to execute the product requirements outlined herein.

## 6. User Stories (New & Enhanced)

*   **As a Program Manager,** I want to visually drag and drop phases on a canvas to design my workflow, so I can easily understand and modify the process flow.
*   **As a Program Manager,** I want to define conditional paths after a decision or review phase, so that applicants are automatically routed to the correct next step based on their outcome.
*   **As a Program Coordinator,** I want to define specific sub-tasks within any phase, assign them to roles or users, and set due dates, so that responsibilities are clear and progress can be tracked.
*   **As a Program Coordinator,** I want to create forms with conditional fields that appear or disappear based on previous answers, so that applicants only see relevant questions.
*   **As a Reviewer,** I want to participate in multi-round reviews with detailed, weighted rubrics, so that my evaluations are thorough and fair.
*   **As a Program Coordinator,** I want to manually assign reviewers to applications, so I can ensure the right expertise is applied to each review.
*   **As an Applicant,** I want to receive dynamic, personalized emails with relevant information based on my application's progress, so I stay informed.
*   **As an Applicant,** I want to self-schedule my interview from a list of available slots, so I can choose a time that works best for me.
*   **As an Internal Host,** I want to set my availability for interviews on a calendar, so that applicants can only book slots when I am free.
*   **As a Program Manager,** I want to define rules that automatically make a decision (e.g., "Accept" or "Reject") based on aggregated review scores or checklist completion, so that routine decisions are automated.
*   **As a Program Manager,** I want to automatically trigger a new sub-workflow or update an external system after a final decision is made, so that post-decision processes are seamless.
*   **As an Applicant,** I want the system to automatically send recommendation requests to my recommenders, so I don't have to manually follow up.
*   **As a Recommender,** I want to submit a recommendation through a secure, easy-to-use public portal, so I can support the applicant efficiently.
*   **As an Administrator,** I want to view the version history of a pathway template, compare different versions, and roll back to a previous version, so I can manage changes and correct errors.
*   **As an Administrator,** I want to define global default settings for phase configurations, so that all new templates and phases inherit consistent initial settings.
*   **As a Template Creator,** I want to see when a phase setting is inherited from a global default and have the option to override it, so I can customize templates while maintaining overall consistency.