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
    *   **Validation & Feedback:** Client-side and server-side validation, `sonner` toasts.
*   **Reorder Phases (Drag-and-Drop):**
    *   **Interaction:** Users can drag and drop phase cards to change their sequence.
    *   **Visual Feedback:** Clear visual cues (e.g., elevated shadow on drag, placeholder for drop target, subtle animation) will guide the user.
    *   **Persistence:** Upon dropping, the system will update the `order_index` for all affected phases via a Server Action.
    *   **Access Logic:** Only the `creator_id` of the parent template or a 'super admin' can reorder phases.
    *   **Feedback:** `sonner` toast for successful reordering.
*   **Delete Phase:**
    *   **Interaction:** Clicking "Delete Phase" on a phase card will trigger an M3 `AlertDialog` for confirmation.
    *   **Confirmation:** The dialog will confirm the deletion of the specific phase.
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

*   **Data Layer (Supabase - `public.phases` table):**
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
    *   **Functions:**
        *   `getPhasesByPathwayTemplateId(pathwayTemplateId: string)`: Fetches phases for a given template.
        *   `createPhase(pathwayTemplateId: string, name: string, type: string, order_index: number, description: string | null, config: Record<string, any>)`: Inserts a new phase.
        *   `updatePhase(id: string, updates: Partial<Phase>)`: Updates phase details or `order_index`.
        *   `deletePhase(id: string)`: Deletes a phase.
*   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
    *   **Authorization Logic:** All phase-related Server Actions (`createPhaseAction`, `updatePhaseAction`, `deletePhaseAction`, `reorderPhasesAction`) will first fetch the parent `pathway_template` using `getTemplateByIdAction` to check its `creator_id` and the current user's `user_metadata.role`. They will only proceed if `auth.uid() === template.creator_id` OR `user_metadata.role === 'admin'`. This is critical for enforcing the super admin override and creator-only modification.
*   **Frontend (UI - `src/app/(workbench)/pathway-templates/[id]/page.tsx`, `src/features/pathway-templates/components/PathwayTemplateDetail.tsx`, `src/features/pathway-templates/components/PhaseCard.tsx`, `src/features/pathway-templates/components/PhaseFormDialog.tsx`):**
    *   **`src/app/(workbench)/pathway-templates/[id]/page.tsx` (Server Component):** Fetches the specific `PathwayTemplate` and its associated `Phases` using `getTemplateByIdAction` and `getPhasesByPathwayTemplateId` (or Server Actions for data fetching). Renders `PathwayTemplateDetail`.
    *   **`src/features/pathway-templates/components/PathwayTemplateDetail.tsx` (Client Component):**
        *   Displays template details and a section for phases.
        *   Manages the state of phases for drag-and-drop.
        *   Renders `PhaseCard` components.
        *   **Conditional Actions:** "Add Phase," "Edit Phase," "Delete Phase," and drag-and-drop functionality will be conditionally rendered/enabled based on the current user's ownership of the parent template or 'admin' role.
        *   Handles "Add Phase" button click (opens `PhaseFormDialog`).
        *   Implements drag-and-drop functionality (using a library like `react-beautiful-dnd` or a custom solution) to reorder `PhaseCard` components, calling `reorderPhasesAction` on drop.
    *   **`src/features/pathway-templates/components/PhaseCard.tsx` (Client Component):**
        *   Displays individual phase details.
        *   Includes a drag handle.
        *   Includes M3 `Button` components for "Edit Phase" (opens `PhaseFormDialog`) and "Delete Phase" (triggers `AlertDialog` and calls `deletePhaseAction`).
    *   **`src/features/pathway-templates/components/PhaseFormDialog.tsx` (Client Component):**
        *   An M3 `Dialog` for creating or editing phase `name`, `type`, and `description`.
        *   Uses `react-hook-form` and `zod` for validation.
        *   Submits data to `createPhaseAction` or `updatePhaseAction`.

### Vertical 1.3: Phase-Specific Configuration (Initial Form & Review)

**Objective:** Enable basic configuration for "Form" and "Review" phase types using the `config` JSONB field, respecting access rules.

*   **Data Layer:** The `config` column in `public.phases` will store JSON objects specific to each phase type.
*   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
    *   The `updatePhase` function will be extended to accept and correctly store updates to the `config` JSONB field.
*   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
    *   `updatePhaseConfigAction(phaseId: string, configUpdates: Record<string, any>)`: Will include the same authorization logic as other phase-related actions (check parent template ownership or 'admin' role).
*   **Frontend (UI - `src/features/pathway-templates/components/PhaseConfigurationPanel.tsx`, `src/features/pathway-templates/components/phase-configs/FormPhaseConfig.tsx`, `src/features/pathway-templates/components/phase-configs/ReviewPhaseConfig.tsx`):**
    *   **`src/features/pathway-templates/components/PhaseConfigurationPanel.tsx` (Client Component):**
        *   This component will be rendered within the `PathwayTemplateDetail` or a dedicated `Dialog`/`Sheet` when a user wants to configure a phase.
        *   It will dynamically render a specific configuration sub-component based on the `phase.type`.
        *   It will pass the current `phase.config` data to the sub-component and receive updated `config` data back for submission via `updatePhaseConfigAction`.
        *   **Conditional UI:** Configuration panels and their interactive elements will be conditionally enabled/disabled based on the user's authorization.
    *   **`src/features/pathway-templates/components/phase-configs/FormPhaseConfig.tsx` (Client Component):**
        *   Renders UI for defining form fields. Uses `react-hook-form` for managing a dynamic array of field objects. M3 `Input`, `Select`, `Switch` components.
    *   **`src/features/pathway-templates/components/phase-configs/ReviewPhaseConfig.tsx` (Client Component):**
        *   Renders UI for defining rubric criteria. Uses `react-hook-form` for managing a dynamic array of criteria objects. M3 `Input`, `Textarea`, `Select`, `RadioGroup`, `Switch` components.

### Vertical 1.4: Template Cloning

**Objective:** Allow users to duplicate an existing pathway template and its phases, respecting access rules.

*   **Service Layer (`src/features/pathway-templates/services/pathway-template-service.ts`):**
    *   `clonePathwayTemplate(templateId: string, newName: string, creatorId: string)`: This function will fetch the original `PathwayTemplate` and all its `Phases`, then insert a new `PathwayTemplate` record with the `newName` and `creatorId`, and for each original phase, insert a new `Phase` record, linking it to the new `pathway_template_id`, copying `name`, `type`, `description`, `order_index`, and `config`. Returns the newly created `PathwayTemplate`.
*   **Backend (Next.js Server Actions - `src/features/pathway-templates/actions.ts`):**
    *   `clonePathwayTemplateAction(templateId: string, newName: string)`:
        *   **Authorization Logic:** This action will first check if the user is authenticated. It will then call `pathwayTemplateService.clonePathwayTemplate` using the current `auth.uid()` as the `creatorId` for the new template. No specific ownership check on the *original* template is needed here, as cloning is allowed for any viewable template.
*   **Frontend (UI - `src/features/pathway-templates/components/CloneTemplateDialog.tsx`):**
    *   **Interaction:** A "Clone" M3 `Button` will be added to `PathwayTemplateList` and `PathwayTemplateDetail`. Clicking it opens `CloneTemplateDialog`.
    *   **`src/features/pathway-templates/components/CloneTemplateDialog.tsx` (Client Component):**
        *   An M3 `Dialog` with an `Input` field for the `New Template Name`.
        *   Uses `react-hook-form` and `zod` for validation.
        *   Submits the `templateId` and `newName` to `clonePathwayTemplateAction`.
        *   On success, displays a `sonner` toast and redirects to the new template's detail page.
    *   **Conditional UI:** The "Clone" button will be visible for any template that the current user has `SELECT` access to (i.e., their own, or public templates, or any template if they are an admin).

## 6. Error Handling and Security (Reinforced)

*   **Error Handling:**
    *   **Client-side:** `react-hook-form` for inline form validation errors. `sonner` for all success, warning, and error notifications from API/Server Action calls.
    *   **Server-side:** All Server Actions will include `try-catch` blocks to gracefully handle errors from the `pathwayTemplateService`. Errors will be logged (e.g., to `errors.md` during development, or a dedicated logging service in production) and returned in a standardized format.
    *   **Global:** The existing `src/app/error.tsx` and `src/app/(public)/error-pages/[code]/page.tsx` will catch unhandled client-side rendering errors and specific HTTP errors (e.g., 401, 403 if middleware redirects).
*   **Security:**
    *   **RLS:** Mandatory RLS on `pathway_templates` and `phases` tables, ensuring users only access data they are authorized to see or data associated with their owned templates.
    *   **Server Actions (Crucial for RBAC):** Explicit server-side authorization checks within *every* Server Action that performs a mutation (INSERT, UPDATE, DELETE) or fetches sensitive data. This is where the application-level `user_metadata.role` will be checked to implement the 'super admin' override and ensure only creators can modify their own non-admin-overridden templates. This layered approach (RLS + Server Actions) is robust and adheres to the "Security by Design" principle from `Architecture.md`.
    *   **Least Privilege:** Maintained by ensuring checks are granular.

## 7. Summary of Current Progress and Next Steps

**What has been done:**
Vertical 0 (Public Homepage & Role-Based Dashboards) is complete, providing a solid foundation with:
*   Full Material Design 3 styling and dynamic color theming, with the primary seed color confirmed as `#880E4F`.
*   Supabase client integration and `SessionContextProvider` for global session management.
*   A functional login page using Supabase Auth UI.
*   Role-based dashboard placeholders for `/admin`, `/workbench`, and `/portal`.
*   Robust authentication middleware (`middleware.ts`) for server-first session checks and role-based access control.
*   A public homepage (`src/app/page.tsx`) with M3 design elements.
*   Comprehensive error handling with dynamic error pages (`src/app/(public)/error-pages/[code]/page.tsx`) and a global error boundary (`src/app/error.tsx`).
*   An `authService` for common authentication operations.
*   The database schema for `pathway_templates` and `phases` is conceptually defined, and a basic `pathwayTemplateService` exists for client-side data interaction.
*   A basic `PathwayTemplateList` component is present, demonstrating the listing of templates.

**What to do next:**
The immediate next step is to fully implement **Vertical 1.1: Basic Pathway Template Management (CRUD & Listing)**, incorporating the revised access control logic. This will involve:
1.  **Database Schema Update:** Executing the SQL command to add the `is_private` column to `public.pathway_templates` and updating the RLS policies as specified in Section 5.1.
2.  **Server Actions:** Creating/updating the `createPathwayTemplateAction`, `updatePathwayTemplateAction`, `deletePathwayTemplateAction`, `getTemplatesAction`, and `getTemplateByIdAction` in `src/features/pathway-templates/actions.ts`, ensuring the new authorization logic (creator ownership OR 'admin' role) is correctly implemented.
3.  **Frontend UI:**
    *   Updating `src/features/pathway-templates/components/PathwayTemplateList.tsx` to display `is_private` status and conditionally render/enable action buttons based on the new access rules.
    *   Updating `src/features/pathway-templates/components/PathwayTemplateForm.tsx` to include the M3 `Switch` for `is_private`.
    *   Integrating these components with the updated Server Actions.
4.  **Feedback & Loading:** Ensuring all interactions provide clear `sonner` toasts and display `Skeleton` components during loading.