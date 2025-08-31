# Global Gateway Architecture Plan (Enhanced)

## 1. Introduction

This document outlines the comprehensive and enhanced architecture plan for the Global Gateway platform. It builds upon the foundational layered design, integrating advanced features and strategic optimizations to ensure a robust, scalable, and highly performant application. The plan addresses critical areas such as dynamic visual workflows, advanced configurations, complex data interactions, real-time updates, and streamlined authorization, all while strictly adhering to SOLID principles, Object-Oriented Programming (OOP) concepts, and Material Design 3 (M3) specifications. This architecture is designed to support the platform's evolution into an intelligent workflow orchestration system, empowering users to manage diverse programs with efficiency and precision.

## 2. High-Level Architecture Overview

The Global Gateway platform employs a modern, layered architecture, leveraging Next.js as a Backend-for-Frontend (BFF) and Supabase as a powerful Backend-as-a-Service (BaaS). This structure ensures a clear separation of concerns, enabling independent development and scaling of different system parts.

*   **Client Layer:** The user-facing interface, built with React and Next.js, responsible for rendering UI, handling user interactions, and displaying dynamic content.
*   **Application Layer (Next.js BFF):** Acts as an intermediary, handling server-side rendering, API routing, Server Actions, and middleware. It orchestrates data fetching, mutation, and authorization before interacting with the core backend services.
*   **Service Layer:** Contains the core business logic, abstracting data access and enforcing domain-specific rules. It provides a clean, high-level API for the Application Layer.
*   **Data Layer (Supabase):** The persistence and authentication backbone, comprising a PostgreSQL database, Supabase Auth, Row Level Security (RLS), and Supabase Edge Functions for serverless backend logic.

**Conceptual Diagram:**

```
+-------------------+       +-----------------------+       +-------------------+       +-----------------------+
|   Client Layer    | <---> |   Application Layer   | <---> |   Service Layer   | <---> |     Data Layer        |
| (Next.js, React,  |       | (Next.js Server       |       | (Business Logic,  |       | (Supabase: PostgreSQL,|
|  Shadcn/UI, Forms)|       |  Components/Actions)  |       |  Data Abstraction)|       |  Auth, RLS, Edge Fns) |
+-------------------+       +-----------------------+       +-------------------+       +-----------------------+
       ^                               ^                               ^                               ^
       |                               |                               |                               |
       +-----------------------------------------------------------------------------------------------+
                                       User Interaction / Data Flow
```

## 3. Core Architectural Principles

The design and implementation of Global Gateway are guided by the following principles:

*   **3.1. SOLID Principles:**
    *   **Single Responsibility Principle (SRP):** Each module, component, and function has one clear reason to change. New services like `PhaseTaskService`, `SchedulingService`, `RecommendationService`, `TemplateVersioningService`, and `GlobalSettingsService` are introduced for distinct functionalities, ensuring focused responsibilities.
    *   **Open/Closed Principle (OCP):** Software entities are open for extension but closed for modification. New phase types or advanced form field types are accommodated by extending the `phases.config` JSONB schema and introducing new configuration components, rather than altering core `Phase` entities or the `PhaseConfigurationPanel`'s dispatching logic.
    *   **Liskov Substitution Principle (LSP):** Subtypes can replace their base types without altering correctness. TypeScript interfaces like `BaseConfigurableItem` ensure that both `Phase` and `CampaignPhase` can be treated uniformly where generic configuration is needed, allowing for reusable configuration components.
    *   **Interface Segregation Principle (ISP):** Clients should not be forced to depend on interfaces they do not use. Different user roles interact with distinct, tailored interfaces (e.g., `Applicant Self-Scheduling Portal`, `Recommender Portal`, `Reviewer Dashboard`), providing only the relevant functionality.
    *   **Dependency Inversion Principle (DIP):** High-level modules depend on abstractions, not concretions. UI components and Server Actions depend on abstract service interfaces (e.g., `IPhaseConfigService`, `ITaskService`) rather than direct database implementations, promoting flexibility and testability.

*   **3.2. Object-Oriented Programming (OOP) Concepts:**
    *   **Encapsulation:** Data and methods are bundled, hiding internal details. Complex configurations (e.g., decision rules, dynamic email content) are encapsulated within the `config` JSONB of a phase, exposed only through well-defined service methods. React components encapsulate their state and rendering logic.
    *   **Polymorphism:** Objects can take many forms, allowing a single interface to represent different implementations. The `WorkflowCanvas` renders various visual nodes (Start, End, Phase, Conditional Branch) based on their `type`, all adhering to a common node interface.
    *   **Abstraction:** Complex details are hidden, exposing only essential features. Service layers abstract database interactions, Shadcn/UI abstracts Radix UI primitives, and Server Actions abstract server-side logic from client components.

*   **3.3. Material Design 3 (M3) Adherence:** All UI/UX elements strictly follow M3 guidelines for dynamic color theming, typography, elevation, shape, and motion, ensuring a cohesive, accessible, and delightful user experience across the platform.

*   **3.4. Security by Design:** Row Level Security (RLS) is mandatory on all database tables. Server Actions implement robust, role-based, and ownership-based authorization checks. Input validation is performed at both client and server layers.

*   **3.5. Performance & Scalability:** Leveraging Next.js features like Server Components (RSC) for efficient data fetching and rendering, and Supabase's scalable PostgreSQL database and Edge Functions. Database optimizations like materialized views and functions are introduced to further enhance performance.

*   **3.6. Maintainability & Extensibility:** A modular feature-centric file structure (`src/features`), clear separation of concerns between layers, and strong TypeScript typing promote code quality and ease of future enhancements.

## 4. Layered Architecture Details (Enhanced)

### 4.1. Client Layer (Frontend)

*   **Framework:** Next.js (App Router), React.
*   **UI Components:** Shadcn/UI (built on Radix UI and styled with Tailwind CSS), ensuring M3 compliance.
*   **Styling:** Tailwind CSS for utility-first styling.
*   **State Management:** Primarily React Context API (`SessionContextProvider`, `LayoutContextProvider`) and local component state (`useState`, `useReducer`).
*   **Forms:** React Hook Form for state management and validation, integrated with Zod for schema definition.
*   **Interactivity:** `@hello-pangea/dnd` for drag-and-drop functionality in workflow builders. Recharts for data visualization in reports. Sonner for notifications.
*   **Key Components (New & Enhanced):**
    *   `WorkflowCanvas`: A new interactive component for visually designing and reordering phases, including conditional branching.
    *   `PhaseConfigurationPanel` and specific `phase-configs/*`: Dynamic forms for configuring various phase types (Form, Review, Email, Scheduling, Decision, Recommendation), now supporting advanced features like conditional field display, multi-round reviews, and decision rule builders.
    *   `PhaseTaskManagementPanel`: A new UI for defining and tracking tasks within any phase.
    *   `ReviewerDashboard`, `Applicant Self-Scheduling Portal`, `Recommender Portal`: Role-specific dashboards and public-facing interfaces, now integrated with real-time updates.
    *   `CloneTemplateDialog`, `BranchingConfigDialog`, `GlobalSettingsPage`, `TemplateVersionHistory`: Dialogs and pages for advanced management features, with improved version comparison.
*   **Real-time Integration:** Client components will subscribe to Supabase Realtime channels for instant updates on collaborative data (e.g., notes, application status, review assignments).
*   **Responsiveness:** Designed with a desktop-first approach, adapting layouts for tablet and mobile devices.

### 4.2. Application Layer (Next.js Backend-for-Frontend - BFF)

*   **Framework:** Next.js (App Router).
*   **Server Components:** Used for initial data fetching, rendering static or dynamic UI, and passing data to client components. Will leverage optimized data fetching from the service layer.
*   **Server Actions:** The primary mechanism for handling data mutations from the client.
    *   **Centralized Authorization:** Will utilize a new `src/lib/auth-helpers.ts` module containing generic functions like `canRead(user, entityType, entityId)`, `canWrite(user, entityType, entityId)`, `isCreator(user, entity)`, `isAdmin(user)`. This significantly reduces code duplication and improves consistency.
    *   **Validation:** Performs server-side input validation (often mirroring client-side Zod schemas) and business logic validation.
    *   **Data Transformation:** Prepares data received from the client for the service layer and formats responses for the client.
    *   **Revalidation:** Utilizes `revalidatePath` to ensure data consistency across the application after mutations.
*   **Route Handlers:** Reserved for specific API endpoints that might require custom HTTP methods or integrations not ideally suited for Server Actions (e.g., webhooks from external services, external API integrations for scheduling tools).
*   **Middleware:** `src/middleware.ts` handles initial authentication checks, session management, and high-level role-based redirection to ensure users access appropriate parts of the application. Granular entity-level authorization is delegated to Server Actions.

### 4.3. Service Layer (Business Logic)

*   **Purpose:** Encapsulates core business rules, orchestrates complex operations, and provides an abstraction layer over data persistence.
*   **Structure:** Organized into feature-centric services (e.g., `pathway-template-service`, `campaign-service`, `program-service`, `application-service`, `communication-service`, `evaluation-service`, `report-service`, `package-service`).
*   **New Services:**
    *   `src/features/pathway-templates/services/phase-task-service.ts`: Manages CRUD for generic tasks associated with phases.
    *   `src/features/scheduling/services/scheduling-service.ts`: Handles host availability, slot booking, and interview management.
    *   `src/features/recommendations/services/recommendation-service.ts`: Manages recommendation requests and submissions.
    *   `src/features/pathway-templates/services/template-versioning-service.ts`: Manages template versioning, snapshots, and rollback.
    *   `src/features/settings/services/global-settings-service.ts`: Manages platform-wide default configurations.
*   **Key Responsibilities:**
    *   Performing CRUD operations on entities, often interacting with optimized database views and functions.
    *   Executing complex database queries and joins, leveraging PostgreSQL's capabilities.
    *   Managing multi-step operations (e.g., deep copying phases from a template to a campaign, applying decision rules).
    *   Implementing core business logic (e.g., scheduling conflict detection, evaluating decision rules, generating unique recommendation tokens, sending automated communications).
    *   Error logging and handling.
    *   **Domain Event Publishing:** Services will publish lightweight domain events (e.g., `CampaignCreated`, `ApplicationSubmitted`, `PhaseCompleted`, `DecisionMade`) to a conceptual event bus.
*   **Technology:** Written in TypeScript, utilizing the `createClient` from `src/integrations/supabase/server.ts` for secure server-side Supabase interactions.

### 4.4. Data Layer (Persistence & Authentication)

*   **Database:** Supabase (PostgreSQL) serves as the primary data store.
*   **Authentication:** Supabase Auth manages user authentication, session handling, and integrates seamlessly with RLS.
*   **Row Level Security (RLS) - Enhanced:** **Mandatory** on all tables. Policies will be refined and simplified by leveraging **PostgreSQL functions** (e.g., `is_admin()`, `can_access_campaign(campaign_id, user_id)`) directly within RLS definitions. This centralizes complex access logic and improves performance.
*   **New Tables & Schema Updates (from PRD_Enhance1.md):**
    *   `public.phases`: Expanded `config` JSONB to store advanced configurations for all phase types (form fields, review rubrics, email triggers, scheduling parameters, decision rules, recommendation policies).
    *   `public.phase_tasks`: Stores generic tasks associated with any phase.
        *   Columns: `id`, `phase_id` (FK), `name`, `description`, `assigned_to_role`, `assigned_to_user_id` (FK), `due_date`, `status`, `order_index`, `created_at`, `updated_at`.
    *   `public.host_availabilities`: Manages internal host availability for scheduling.
        *   Columns: `id`, `user_id` (FK), `start_time`, `end_time`, `is_available`, `created_at`, `updated_at`.
    *   `public.scheduled_interviews`: Records booked interview slots.
        *   Columns: `id`, `application_id` (FK), `campaign_phase_id` (FK), `host_id` (FK), `applicant_id` (FK), `start_time`, `end_time`, `meeting_link`, `status`, `created_at`, `updated_at`.
    *   `public.recommendation_requests`: Manages the lifecycle of recommendation requests.
        *   Columns: `id`, `application_id` (FK), `recommender_email`, `recommender_name`, `unique_token`, `status`, `request_sent_at`, `submitted_at`, `form_data` (JSONB), `created_at`, `updated_at`.
    *   `public.pathway_template_versions`: Stores snapshots of template versions for history and rollback.
        *   Columns: `id`, `pathway_template_id` (FK), `version_number`, `snapshot` (JSONB), `created_by` (FK), `created_at`.
    *   `public.global_settings`: Stores platform-wide default configurations.
        *   Columns: `key` (PK), `value` (JSONB), `description`, `updated_at`.
    *   `public.campaigns`: `program_id` column added as a foreign key to `public.programs`.
    *   `public.applications`: `data` JSONB field for dynamic form data, `screening_status` for internal tracking.
*   **PostgreSQL Views & Materialized Views:**
    *   **Views:** Define SQL views for common, complex joins (e.g., `applications_with_details` joining `applications`, `campaigns`, `profiles`, `campaign_phases`).
    *   **Materialized Views:** Implement materialized views for frequently accessed, aggregated data, especially for reports and dashboards (e.g., `application_overview_report_mv`). These will be refreshed periodically or on demand.
*   **Database Functions (`.rpc()`):** Encapsulate complex server-side logic (e.g., calculating aggregated scores, applying decision rules, generating dynamic content context) within PostgreSQL functions.
*   **Supabase Realtime:** Integrate Realtime for instant updates on critical collaborative data (e.g., `application_notes`, `applications` status changes, `reviewer_assignments`).
*   **Edge Functions (Supabase Functions):** Utilized for complex backend logic, especially for asynchronous tasks or integrations (e.g., sending automated emails, generating meeting links, processing decision rules, handling domain events).
*   **Storage:** Supabase Storage for file uploads (e.g., in "File Upload" form fields).

## 5. Cross-Cutting Concerns

*   **Security:** Implemented through mandatory RLS, comprehensive Server Action authorization (leveraging centralized helpers), input validation at both client and server layers, secure environment variable management, and secure cookie handling via Supabase SSR client.
*   **Error Handling:** Centralized error pages (`/error/[code]`) for user-friendly feedback, `try-catch` blocks in Server Actions and services for robust error capture, and `sonner` toasts for client-side notifications.
*   **Logging:** Consistent `console.error` for server-side errors and client-side logging for debugging. Enhanced logging within Edge Functions for monitoring asynchronous processes.
*   **Accessibility:** Prioritized through strict adherence to Material Design 3 guidelines, semantic HTML, and consideration for keyboard navigation and screen reader compatibility.
*   **Internationalization (i18n):** The architecture supports future integration of i18n libraries and content management, with dynamic content fields designed to accommodate multiple languages.
*   **Testing Strategy (Conceptual):** Encompasses unit tests for services and utility functions, integration tests for Server Actions, and end-to-end (E2E) tests for critical user flows. Database functions and RLS policies will also have dedicated tests.

## 6. Deployment Strategy

*   **Frontend/Application Layer:** Deployed on Vercel, leveraging its seamless integration with Next.js for optimal performance, automatic scaling, and continuous deployment.
*   **Backend/Data Layer:** Hosted on Supabase, providing a managed PostgreSQL database, authentication, storage, and serverless Edge Functions.

## 7. Future Considerations/Roadmap

The enhanced architecture is designed to be highly extensible, allowing for future advancements such as:
*   Advanced analytics and custom reporting dashboards with drill-down capabilities.
*   Deeper integrations with external systems (CRM, HRIS, payment gateways) via Edge Functions and webhooks.
*   More complex workflow orchestration patterns (e.g., parallel phases, dynamic sub-workflows, external approvals).
*   AI-driven insights and automation for application screening, decision support, and content generation.
*   Comprehensive audit trails for all data modifications.

---

**Summary of what has been done:**
I have created the `Architecture_Enhance1.md` file and populated it with the detailed Global Gateway Architecture Plan, incorporating all the proposed enhancements and optimizations.

**What to do next:**
Based on the `Architecture.md` roadmap, the next logical step is to focus on the remaining aspects of **Vertical 3: Packages & Individual Assignments**. Specifically, we should implement the "Packages" concept, which could involve grouping multiple campaigns or pathways together, and further define "Individual Assignments" beyond just reviewer assignments, potentially for assigning specific tasks or roles to users within a program or campaign. This will involve:
1.  **Database Schema:** Defining a new table (e.g., `packages`) and potentially a `package_assignments` table.
2.  **Service Layer:** Developing new services for package and assignment management.
3.  **Backend (Server Actions):** Creating Server Actions to interact with these new services.
4.  **Frontend (UI):** Building the UI for creating, viewing, and managing packages and individual assignments.