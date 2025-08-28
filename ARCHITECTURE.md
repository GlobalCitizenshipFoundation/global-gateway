# Global Gateway Architecture Plan

This refined architecture plan builds upon the initial structure, emphasizing a lean, modular, and scalable approach. It prioritizes clear separation of concerns, efficient data flow, and a consistent user experience, all while strictly adhering to Material Design 3 specifications and robust security practices.

### 1. Core Principles & Design Philosophy

*   **Vertical Slicing (Feature-First):** Each major feature (e.g., Pathway Templates, Campaign Management) is treated as a vertical slice, encompassing its own UI, business logic, and data interactions. This promotes self-contained, independently deployable, and easily maintainable modules.
*   **API-First & Server-Centric:** While the frontend is rich, critical data operations and business logic are primarily handled on the server. This ensures security, performance, and a seamless user experience by pre-fetching data and validating actions server-side.
*   **Material Design 3 (M3) Driven:** Beyond component usage, M3 principles for dynamic color theming, elevation, shape, typography, and motion will be deeply integrated across all layers, ensuring a cohesive and accessible user interface.
*   **Security by Design:** Role-Based Access Control (RBAC) and Row Level Security (RLS) are fundamental, enforced at both the application (middleware, API routes, Server Actions) and database layers (Supabase).
*   **Efficiency & Performance:** Leverage Next.js features like Server Components, Server Actions, and intelligent caching to minimize client-side JavaScript and optimize data fetching.

### 2. Core Modules and Interconnections (Refined)

The core functional modules remain consistent, but their implementation will strongly align with the `src/features` directory structure. Each module will be a self-contained unit, reducing cross-module dependencies and promoting reusability.

1.  **User & Role Management:** (Foundation) Handles authentication, authorization, user profiles, and role assignments. This is a cross-cutting concern, integrated via middleware and shared services.
2.  **Pathway Template Management:** Design and manage reusable workflow templates.
3.  **Campaign Management:** Create live instances from Pathway Templates, configure settings, and monitor progress.
4.  **Application Management:** Dynamic forms, submission handling, document uploads, and applicant data.
5.  **Evaluation & Review Management:** Tools for screeners and reviewers, rubrics, assignments, and feedback.
6.  **Scheduling & Interview Coordination:** Availability management, booking, and calendar synchronization.
7.  **Recommendations Management:** Requesting and submitting recommendations via secure links.
8.  **Decision & Status Tracking:** Final decision-making, outcome recording, and status updates.
9.  **Communication & Notifications:** Internal and external communications, email, and in-app notifications.
10. **Reporting & Insights:** Dashboards, analytics, and data export.

**Interconnections:** Modules interact primarily through well-defined interfaces (services, API routes, Server Actions), minimizing direct coupling. User & Role Management underpins all interactions, while Pathway Templates serve as blueprints for Campaigns, which then orchestrate Phases involving Application, Evaluation, Scheduling, and Decision modules.

### 3. Role-Based Interfaces and User Flows (Reinforced)

The existing Next.js App Router structure (`/(public)`, `/(portal)`, `/(workbench)`, `/(admin)`) is ideal.

*   **`/(public)`:** Unauthenticated access for marketing, public campaign listings, and secure external links (e.g., for recommenders).
*   **`/(portal)`:** Participant-facing dashboard and workflows.
*   **`/(workbench)`:** Central hub for internal operational roles (Coordinators, Recruiters, Evaluators).
*   **`/(admin)`:** Exclusive console for platform administrators.

**Access Control:** A robust `middleware.ts` will be the primary gatekeeper, performing server-side session validation and role-based authorization *before* rendering any page content. This ensures a "server-first" session check, preventing screen flickers and unauthorized access, aligning with the seamless authentication requirement.

### 4. Service Layers (Optimized for Next.js & Supabase)

The architecture leverages Next.js's full-stack capabilities and Supabase's integrated services for a lean and efficient structure.

*   **Frontend (UI Layer):**
    *   **Location:** `src/app`, `src/components`, `src/features/[feature-name]/components`, `src/hooks`, `src/context`.
    *   **Technologies:** Next.js (Server & Client Components), React, TypeScript, Tailwind CSS, Shadcn/UI.
    *   **Responsibilities:** Rendering M3-compliant UI, client-side interactivity, local state management, and invoking Server Actions or API routes for data operations.
    *   **M3 Integration:** All UI components will strictly follow M3 specifications for dynamic color, elevation, shape, typography, and motion, ensuring a consistent and modern aesthetic.

*   **Backend (Server-Side Logic & Data Access):**
    *   **Server Actions:**
        *   **Location:** Primarily within `src/features/[feature-name]/actions.ts` or directly in Server Components.
        *   **Technologies:** Next.js Server Actions (TypeScript), Supabase client (`src/integrations/supabase/server.ts`).
        *   **Responsibilities:** Handling data mutations (create, update, delete), form submissions, and complex business logic directly on the server. This significantly reduces the need for explicit API routes for every operation, leading to a leaner and more efficient backend.
        *   **Security:** Server Actions will perform authorization checks and interact with Supabase, ensuring RLS is respected.
    *   **API Routes (`src/app/api`):**
        *   **Location:** `src/app/api/[version]/[resource]/route.ts`.
        *   **Technologies:** Next.js Route Handlers (TypeScript), Supabase client (`src/integrations/supabase/server.ts`).
        *   **Responsibilities:** Reserved for more complex data fetching, third-party integrations, or scenarios requiring a traditional RESTful endpoint (e.g., webhooks, external API consumption). They will also perform token validation and session checks.
    *   **Business Logic (Service Layer):**
        *   **Location:** `src/services` (for global/cross-cutting logic like `authService.ts`, `notificationService.ts`) and `src/features/[feature-name]/services.ts` (for feature-specific business logic).
        *   **Technologies:** TypeScript.
        *   **Responsibilities:** Encapsulating domain rules, orchestrating data operations, and integrating with external services. This clear separation ensures that business logic is reusable and testable, independent of the UI or API layer.
    *   **Data Access Layer (DAL):**
        *   **Location:** `src/integrations/supabase/client.ts` (for client-side read-only access, e.g., public data) and `src/integrations/supabase/server.ts` (for server-side authenticated access). `src/db` will contain schema definitions and types.
        *   **Technologies:** Supabase (PostgreSQL, Supabase client library).
        *   **Responsibilities:** Abstracting database interactions, performing CRUD operations, and ensuring data integrity. All database interactions will be secured by **Row Level Security (RLS)** policies, which are mandatory for every table.

*   **Integrations Layer (`src/integrations`):**
    *   **Location:** `src/integrations`.
    *   **Technologies:** Supabase client, Mailgun API, Google/Outlook Calendar APIs, etc.
    *   **Responsibilities:** Managing connections and interactions with all third-party services. This layer will also handle sensitive API tokens securely, potentially via Supabase Edge Functions for server-to-server communication.

### 5. Data Model Clarity

The data model will strictly follow the `Templates → Campaigns → Phases → Submissions → Reviews` hierarchy.

*   **Pathway Templates:** Define the structure of phases.
*   **Campaigns:** Instances of Pathway Templates, with campaign-specific configurations.
*   **Campaign Phases:** Deep-copied instances of template phases, linked to a specific campaign.
*   **Applications/Submissions:** Participant data for a specific campaign phase.
*   **Reviews:** Evaluator feedback and scores for applications.

**RLS Enforcement:** Every table will have RLS enabled with granular policies (SELECT, INSERT, UPDATE, DELETE) to ensure users can only access data they are authorized to see or modify. For instance, users can only see their own applications, and reviewers only their assigned submissions.

### 6. Error Handling Strategy

A comprehensive error handling strategy will be implemented across all layers:

*   **Server-Side (API Routes & Server Actions):**
    *   API routes and Server Actions will catch errors, log them (to `errors.md` during development, and to a robust logging service in production), and return standardized error responses (e.g., JSON with `statusCode` and `message`).
    *   Specific handling for Supabase `AuthApiError` will ensure graceful authentication error messages.
*   **Client-Side (UI Layer):**
    *   Global error boundaries will catch React rendering errors.
    *   `Sonner` toasts will display user-friendly messages for API/Server Action failures.
    *   Dedicated error pages (`src/app/(public)/error-pages/[code]/page.tsx`) will be implemented for common HTTP status codes (401, 403, 404, 500), providing clear messages and actionable next steps (e.g., "Login button" for 401, "Home/Dashboard button" for 404).
    *   Form validation errors will be handled gracefully using `react-hook-form` and `zod`, providing inline feedback.

### 7. Extensibility Strategy (Enhanced)

*   **Feature Modules (`src/features`):** New features are developed as self-contained vertical slices, minimizing impact on existing code. This is the primary mechanism for growth.
*   **Configurable Phase Types:** The system is designed to easily introduce new "Phase Types" (e.g., AI-driven evaluation, digital credentialing) without altering core campaign execution logic.
*   **Supabase Edge Functions:** For complex server-side logic, API-to-API communication, or handling sensitive secrets, Edge Functions will be utilized. This provides a scalable, performant, and secure environment for backend tasks.
*   **Webhooks:** Supabase webhooks can be used to trigger external services or internal logic in response to database changes, further enhancing automation and integration capabilities.
*   **Service Layer Abstraction:** Allows for swapping out underlying implementations (e.g., changing email providers) with minimal impact on business logic.

### 8. Initial Implementation Steps (High-Level)

This architecture supports the `VIS.md` MVP build order:

1.  **Vertical 0 (Foundation):** Public Homepage, Authentication, Role-Based Dashboards, and core M3 styling.
2.  **Vertical 1: Pathway Templates & Phase Configuration:** Database schema, services, and UI for creating and managing templates.
3.  **Vertical 2: Campaign Management & Campaign Phases:** Instantiate campaigns from templates, dashboard views.
4.  **Vertical 4: Participant Interaction & Notifications:** Form submission, status tracking, automated emails.
5.  **Vertical 5: Review & Decision Phases:** Reviewer dashboards, rubrics, decision recording.
6.  **Vertical 3: Packages & Individual Assignments:** Manage collections of pathways.
7.  **Vertical 6: Dashboard & Insights:** Analytics and reporting.
8.  **Vertical 7: Security & Access Control:** (Continuous across all verticals) RBAC, auditability, secure links.