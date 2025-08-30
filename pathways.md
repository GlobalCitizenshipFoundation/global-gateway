# Pathway Template Management Implementation Plan

This document outlines the comprehensive plan for implementing the **Pathway Template Management** feature, aligning strictly with the `AI_RULES.md`, `PRD.md`, `Architecture.md`, `M3Design.md`, and `errors.md` files. It details functional requirements, UI/UX design, technical strategy, and access control mechanisms.

## 1. Introduction and Strategic Importance

The Pathway Template Management module is the foundational component of the Global Gateway platform. It empowers administrators and creators to define, standardize, and reuse complex multi-phase workflows for any program type – be it fellowships, hiring, awards, or grants. By abstracting these workflows into configurable templates, the platform ensures consistency, reduces manual setup, and enables rapid deployment of new initiatives. This module is critical for achieving the platform's goals of standardizing workflows, automating tasks, and supporting flexible multi-role processes, as outlined in `PRD.md`.

## 2. Core Capabilities and User Value

This module will provide the following core capabilities, delivering significant value to creators and administrators:

*   **Intuitive Template Design:** A user-friendly interface for constructing and visualizing multi-step program pathways.
*   **Flexible Phase Configuration:** The ability to define diverse phase types (e.g., forms, reviews, emails, scheduling) and customize their specific settings.
*   **Efficient Workflow Iteration:** Tools for easily reordering, duplicating, and managing phases within a template.
*   **Centralized Template Library:** A single source of truth for all reusable program blueprints, promoting organizational knowledge sharing and consistency.
*   **Rapid Program Launch:** By providing robust templates, the system significantly accelerates the creation of new campaigns.

## 3. Granular Functional Requirements

### 3.1 Pathway Template Lifecycle Management (CRUD)

This section details the creation, viewing, editing, and deletion of pathway templates, incorporating the revised access control rules.

*   **Create New Pathway Template:**
    *   **Interaction:** Users will navigate to a dedicated creation page or trigger a modal/dialog from the template list.
    *   **Inputs:** A required text input for `Template Name`, and an optional multi-line text area for `Description`. A Material Design 3 `Switch` component for `Is Private` (defaulting to `FALSE`).
    *   **Validation:** Client-side validation (using `zod` and `react-hook-form`) for required fields and length constraints. Server-side validation (in Server Action) for uniqueness of name (within a user's templates) and data integrity.
    *   **Feedback:** `sonner` toast for success or validation errors.
    *   **Post-creation:** Redirect to the newly created template's detail page for phase configuration.
*   **View Pathway Templates (List/Dashboard):**
    *   **Display:** A responsive grid or list view of M3-compliant `Card` components, each representing a pathway template.
    *   **Card Content:** Each card will prominently display the `Template Name` (using `text-headline-small`), a truncated `Description` (using `text-body-medium`), `Created At`, and `Last Updated` timestamps (using `text-body-small`). A visual indicator (e.g., a lock icon) will be present for private templates.
    *   **Actions:** Each card will include M3 `Button` components for "Edit Template," "Delete Template," and "View Details/Configure Phases."
        *   **Access Logic:** These buttons will be conditionally rendered or enabled based on the user's role and ownership:
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

### 3.2 Phase Management within a Pathway Template

This section details the management of phases within a specific pathway template, with access control.

*   **Add New Phase:**
    *   **Interaction:** From the Pathway Template Detail page, a prominent M3 `Button` (e.g., "Add Phase") will open an M3 `Dialog` or `Sheet`.
    *   **Inputs:** `Phase Name` (text input, required), `Phase Type` (M3 `Select` dropdown, required, options: "Form", "Review", "Email", "Scheduling", "Decision", "Recommendation"), `Description` (multi-line text area, optional).
    *   **Initial State:** The `order_index` will be automatically assigned based on the current number of phases. `config` will be initialized as an empty JSON object.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can add phases.
    *   **Validation & Feedback:** Client-side and server-side validation, `sonner` toasts.
*   **View Phases (within Template Detail):**
    *   **Display:** Phases will be presented as a vertically ordered list of M3 `Card` components or within an M3 `Accordion` structure.
    *   **Card Content:** Each phase card will show `Phase Name`, `Phase Type`, `Description`, and `Order Index`.
    *   **Actions:** Each phase card will include M3 `Button` components for "Edit Phase Configuration," "Delete Phase," and a drag handle for reordering.
    *   **Access Logic:** All users who can view the parent template can view its phases.
*   **Edit Phase Details (Name, Type, Description):**
    *   **Interaction:** Clicking an "Edit" button on a phase card will open a `Dialog` pre-populated with the phase's details.
    *   **Updates:** Users can modify `Phase Name`, `Phase Type`, and `Description`.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can edit phase details.
    *   **Validation & Feedback:** Same as creation.
    *   **Post-update:** `sonner` toast for success, update `updated_at` timestamp, and refresh the displayed information.
*   **Reorder Phases (Drag-and-Drop):**
    *   **Interaction:** Users can drag and drop phase cards to change their sequence.
    *   **Visual Feedback:** Clear visual cues (e.g., elevated shadow on drag, placeholder for drop target, subtle animation) will guide the user.
    *   **Persistence:** Upon dropping, the system will update the `order_index` for all affected phases via a Server Action.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can reorder phases.
    *   **Feedback:** `sonner` toast for successful reordering.
*   **Delete Phase:**
    *   **Interaction:** Clicking "Delete Phase" on a phase card will trigger an M3 `AlertDialog` for confirmation.
    *   **Confirmation:** The dialog will clearly confirm the deletion of the specific phase.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can delete phases.
    *   **Feedback:** `sonner` toast for success or error.
    *   **Post-deletion:** Remove the phase from the list and update the `order_index` of subsequent phases.

### 3.3 Phase-Specific Configuration

The `config` (JSONB) field in the `phases` table will store detailed settings for each phase type.

*   **Interaction:** Clicking "Edit Phase Configuration" on a phase card will open an M3 `Dialog` or `Sheet` containing a dynamically rendered configuration form based on the `Phase Type`.
*   **Form Phase Configuration:**
    *   **Inputs:** A dynamic list of form fields. Each field will have configurable properties: `Field Label`, `Field Type` (Text, Number, Date, Checkbox, Radio Group, File Upload, Rich Text Area, Email, URL), `Required` (M3 `Switch`), `Helper Text`, `Default Value`, `Options` (for Select, Radio, Checkbox: repeatable text inputs).
*   **Review Phase Configuration:**
    *   **Inputs:** `Rubric Criteria` (repeatable sections with `Name`, `Description`, `Max Score`), `Scoring Scale` (M3 `Select` dropdown), `Anonymization Settings` (M3 `RadioGroup` or `Switch` components).
*   **Email Phase Configuration:**
    *   **Inputs:** `Email Subject`, `Email Body` (rich text editor with dynamic placeholders), `Recipient Role(s)` (M3 `Select` dropdown), `Trigger Event` (M3 `Select` dropdown).
*   **Scheduling Phase Configuration:**
    *   **Inputs:** `Interview Duration`, `Buffer Time`, `Host Selection` (M3 `Select` or multi-select for internal users who can host).
*   **Decision Phase Configuration:**
    *   **Inputs:** `Decision Outcomes` (repeatable text inputs), `Associated Email Template` (M3 `Select` dropdown), `Automated Next Step` (M3 `Select` dropdown).
*   **Recommendation Phase Configuration:**
    *   **Inputs:** `Number of Recommenders Required`, `Recommender Information Fields` (dynamic list of fields), `Reminder Schedule`.
*   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can modify phase configurations.
*   **Validation & Feedback:** Extensive client-side validation for configuration inputs, server-side validation for data integrity, and `sonner` toasts for all operations.

### 3.4 Template Cloning

*   **Interaction:** A dedicated M3 `Button` (e.g., "Clone Template") will be available on the template list and detail pages.
*   **Input:** Clicking "Clone" will open an M3 `Dialog` prompting the user for a `New Template Name`.
*   **Process:** The system will perform a deep copy of the selected pathway template, including all its phases and their `config` data. The `creator_id` of the new template will be set to the current user's ID.
*   **Access Logic:** Any user who can *view* a template (their own, public, or any if admin) can clone it. The cloned template will be owned by the user who performed the clone.
*   **Feedback:** `sonner` toast for success, followed by redirection to the new template's detail page.

## 4. UI/UX Design Principles (Material Design 3 Enforcement)

Every aspect of the Pathway Template Management UI will strictly adhere to Material Design 3 specifications, ensuring a cohesive, accessible, and delightful user experience, as detailed in `M3Design.md`.

*   **Dynamic Color Theming:**
    *   The primary seed color for the application is **`#880E4F`**. This will drive the generation of the full M3 tonal palette, as currently configured in `src/app/globals.css` and `tailwind.config.ts`. All derived colors (primary, on-primary, primary-container, etc.) will consistently reflect this seed.
    *   **Accessibility:** Color choices will be rigorously checked for WCAG 2.1 AAA contrast ratios, ensuring readability in both light and dark themes.
*   **Typography:**
    *   **Hierarchy:** The M3 type scale (defined in `tailwind.config.ts`) will be applied consistently: `text-display-small` or `text-headline-large` for page titles, `text-headline-small` or `text-title-large` for section headers, `text-title-medium` for card titles, `text-body-large` for main content text and form labels, `text-body-medium` for descriptions and helper text, `text-label-large` for button text and small labels.
    *   **Font Families:** `Geist` (sans-serif) and `Geist_Mono` (monospace) will be used as defined in `src/app/layout.tsx`.
*   **Elevation and Shape:**
    *   **Surfaces:** M3 `Card` components will be used for individual templates and phases, featuring `rounded-xl` (12px) or `rounded-md` (4px/8px) corners and appropriate `shadow-md` or `shadow-lg` for elevation.
    *   **Dialogs/Sheets:** Configuration forms will appear in M3 `Dialog` or `Sheet` components, which inherently provide elevation and distinct backgrounds.
    *   **Interactive Elements:** Buttons will have M3-defined rounded corners (`rounded-md` or `rounded-full`) and subtle elevation changes on hover/press.
*   **Motion:**
    *   **Transitions:** Smooth `transition-all duration-300` will be applied to hover states, focus states, and layout changes.
    *   **Drag-and-Drop:** When reordering phases, elements will exhibit subtle `translate-y` and `shadow` animations to indicate dragging and dropping.
    *   **Dialogs/Sheets:** M3-compliant entrance and exit animations will be used for modals and side sheets.
    *   **Feedback:** `sonner` toasts will appear with M3-consistent animations.
*   **Layout and Spacing:**
    *   **8dp Grid System:** All margins, paddings, and gaps will be multiples of `8px` (e.g., `p-4` for 16px, `gap-6` for 24px), ensuring visual harmony.
    *   **Responsiveness:** Layouts will be desktop-first, using Tailwind's responsive prefixes (`md:`, `lg:`) to adapt gracefully to tablet and potentially simplified mobile views. Forms will center with `max-w-screen-lg` on desktop and span edge-to-edge on mobile, ensuring balanced margins and paddings as requested in `Inputs.md`.
*   **Interactive Elements:**
    *   **Buttons:** M3 `Button` variants (Filled, Outlined, Tonal) will be used appropriately.
    *   **Text Fields:** `Input` and `Textarea` components will use outlined or filled variants with floating labels, clear affordances, and animated focus states.
    *   **Select/Dropdowns:** M3 `Select` components will be used for single-choice selections.
    *   **Checkboxes/Radio Buttons/Switches:** M3-compliant components with proper label alignment and accessible states.

## 5. Technical Implementation Strategy (Vertical Slices)

The implementation will proceed in distinct vertical slices, ensuring end-to-end functionality at each step, as per `Architecture.md` and `PRD.md`.

### Vertical 1.1: Basic Pathway Template Management (CRUD & Listing)

**Objective:** Enable users to create, view, edit, and delete pathway templates, respecting the new access rules.

*   **Data Layer (Supabase - `public.pathway_templates` table):**
    *   **Schema:**
        *   `id`: `UUID` (Primary Key, `gen_random_uuid()` default)
        *   `creator_id`: `UUID` (NOT NULL, Foreign Key referencing `auth.users(id)` ON DELETE CASCADE)
        *   `name`: `TEXT` (NOT NULL, Unique constraint for `(creator_id, name)`)
        *   `description`: `TEXT` (NULLABLE)
        *   `is_private`: `BOOLEAN` (NOT NULL, DEFAULT `FALSE`)
        *   `created_at`: `TIMESTAMP WITH TIME ZONE` (DEFAULT `NOW()`)
        *   `updated_at`: `TIMESTAMP WITH TIME ZONE` (DEFAULT `NOW()`)
    *   **Row Level Security (RLS):**
        *   `ALTER TABLE public.pathway_templates ENABLE ROW LEVEL SECURITY;`
        *   **Revised SELECT Policy:**
            ```sql
            CREATE POLICY "Allow authenticated users to view their own or public pathway templates"
            ON public.pathway_templates FOR SELECT TO authenticated
            USING ( (auth.uid() = creator_id) OR (is_private = FALSE) );
            ```
            *   **Note on Super Admin RLS:** Directly checking `user_metadata.role` in RLS is complex without custom database functions. For super admin override, we will rely on **Server Actions** to perform the elevated access checks. The RLS will provide a baseline of security, and Server Actions will layer on the application-level role logic.
        *   **INSERT Policy:**
            ```sql
            CREATE POLICY "Allow authenticated users to create pathway templates"
            ON public.pathway_templates FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = creator_id);
            ```
        *   **Revised UPDATE Policy:**
            ```sql
            CREATE POLICY "Allow authenticated users to update their own pathway templates"
            ON public.pathway_templates FOR UPDATE TO authenticated
            USING (auth.uid() = creator_id);
            ```
        *   **Revised DELETE Policy:**
            ```sql
            CREATE POLICY "Allow authenticated users to delete their own pathway templates"
            ON public.pathway_templates FOR DELETE TO authenticated
            USING (auth.uid() = creator_id);
            ```
*   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
    *   **Functions:**
        *   `getPathwayTemplates()`: Fetches templates.
        *   `getPathwayTemplateById(id: string)`: Fetches a single template.
        *   `createPathwayTemplate(name: string, description: string | null, is_private: boolean, creator_id: string)`: Inserts a new template.
        *   `updatePathwayTemplate(id: string, updates: Partial<PathwayTemplate>)`: Updates an existing template.
        *   `deletePathwayTemplate(id: string)`: Deletes a template.
    *   **Error Handling:** Each function will include `console.error` for logging and `toast.error` for user feedback.
*   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
    *   **Purpose:** These actions will be the primary interface for client-side mutations, ensuring server-side validation, authorization, and direct database interaction via the `pathwayTemplateService`.
    *   **Actions:**
        *   `createPathwayTemplateAction(formData: FormData)`: Extracts `name`, `description`, `is_private` from `formData`. Gets `creator_id` from session. Calls `pathwayTemplateService.createPathwayTemplate`.
        *   `updatePathwayTemplateAction(id: string, formData: FormData)`: Extracts `name`, `description`, `is_private`.
            *   **Authorization Logic:** Before calling `pathwayTemplateService.updatePathwayTemplate`, it will:
                1.  Get the current user's `auth.uid()` and `user_metadata.role`.
                2.  Fetch the existing template to get its `creator_id`.
                3.  Allow update if `auth.uid() === template.creator_id` OR `user_metadata.role === 'admin'`. Otherwise, throw an authorization error.
        *   `deletePathwayTemplateAction(id: string)`:
            *   **Authorization Logic:** Similar to `updatePathwayTemplateAction`, it will check if `auth.uid() === template.creator_id` OR `user_metadata.role === 'admin'` before calling `pathwayTemplateService.deletePathwayTemplate`.
        *   `getTemplatesAction()`: (For Server Components) Calls `pathwayTemplateService.getPathwayTemplates`.
        *   `getTemplateByIdAction(id: string)`: (For Server Components) Calls `pathwayTemplateService.getPathwayTemplateById`.
            *   **Authorization Logic:** After fetching the template, it will check if `(template.creator_id === auth.uid()) OR (template.is_private === FALSE) OR (user_metadata.role === 'admin')`. If none of these are true, it will return `null` or throw an error, ensuring the UI doesn't display unauthorized private templates.
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

### Vertical 1.2: Basic Phase Management (Add, Delete, Reorder)

**Objective:** Allow users to add, remove, and reorder phases within a selected pathway template, respecting access rules.

*   **Data Layer (Supabase - `public.phases`):**
    *   **Schema:**
        *   `id`: `UUID` (Primary Key, `gen_random_uuid()` default)
        *   `pathway_template_id`: `UUID` (NOT NULL, Foreign Key referencing `public.pathway_templates(id)` ON DELETE CASCADE)
        *   `name`: `TEXT` (NOT NULL)
        *   `type`: `TEXT` (NOT NULL, e.g., 'Form', 'Review', 'Email')
        *   `description`: `TEXT` (NULLABLE)
        *   `order_index`: `INTEGER` (NOT NULL, Unique constraint for `(pathway_template_id, order_index)`)
        *   `config`: `JSONB` (DEFAULT `'{}'::jsonb`)
        *   `created_at`: `TIMESTAMP WITH TIME ZONE` (DEFAULT `NOW()`)
        *   `updated_at`: `TIMESTAMP WITH TIME ZONE` (DEFAULT `NOW()`)
    *   **Row Level Security (RLS):**
        *   `ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;`
        *   **Revised SELECT Policy:**
            ```sql
            CREATE POLICY "Allow authenticated users to view phases of their own or public templates"
            ON public.phases FOR SELECT TO authenticated
            USING (EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND (pathway_templates.creator_id = auth.uid() OR pathway_templates.is_private = FALSE)));
            ```
        *   **UPDATE Policy:**
            ```sql
            CREATE POLICY "Allow authenticated users to update phases of their own templates"
            ON public.phases FOR UPDATE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND pathway_templates.creator_id = auth.uid()));
            ```
        *   **DELETE Policy:**
            ```sql
            CREATE POLICY "Allow authenticated users to delete phases of their own templates"
            ON public.phases FOR DELETE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND pathway_templates.creator_id = auth.uid()));
            ```
        *   **INSERT Policy (Relies on Server Action for full check, as per `errors.md`):**
            ```sql
            CREATE POLICY "Allow authenticated users to create phases for their own templates"
            ON public.phases FOR INSERT TO authenticated
            WITH CHECK (true);
            ```
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
*   **Dashboard Access Control (`src/app/(admin)/console/page.tsx`, `src/app/(portal)/dashboard/page.tsx`, `src/app/(workbench)/desk/page.tsx`):**
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

**What to do next:**
Based on the `Architecture.md` roadmap, the next logical step is to focus on the remaining aspects of **Vertical 3: Packages & Individual Assignments**. Specifically, we should implement the "Packages" concept, which could involve grouping multiple campaigns or pathways together, and further define "Individual Assignments" beyond just reviewer assignments, potentially for assigning specific tasks or roles to users within a program or campaign. This will involve:
1.  **Database Schema:** Defining a new table (e.g., `packages`) and potentially a `package_assignments` table.
2.  **Service Layer:** Developing new services for package and assignment management.
3.  **Backend (Server Actions):** Creating Server Actions to interact with these new services.
4.  **Frontend (UI):** Building the UI for creating, viewing, and managing packages and individual assignments.