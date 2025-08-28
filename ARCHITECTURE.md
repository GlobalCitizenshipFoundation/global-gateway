# Global Gateway Architecture Plan

This document outlines the architecture for the Global Gateway platform, designed to streamline program, fellowship, hiring, and awards management for the Global Citizenship Foundation (GCF). The architecture adheres to the principles of modularity, clean architecture, and user-centric design, leveraging the specified Next.js, TypeScript, Tailwind CSS, Shadcn/UI, and Supabase stack.

## 1. Core Modules and Interconnections

The platform is structured around key functional modules, each representing a distinct area of program management. These modules are designed to be highly cohesive and loosely coupled, facilitating independent development and maintenance.

**Core Modules:**

1.  **User & Role Management (Foundation):** Manages user accounts, authentication, authorization (RBAC), and profiles. This module underpins all other modules.
2.  **Pathway Template Management:** Allows administrators to design and manage reusable workflow templates (Pathways) composed of various phases (e.g., Application, Review, Scheduling, Decision).
3.  **Campaign Management:** Enables program managers to create live instances (Campaigns) from Pathway Templates, configure campaign-specific settings, and monitor overall progress.
4.  **Application Management:** Handles the entire application lifecycle, including dynamic form rendering, submission, document uploads, and applicant-specific data.
5.  **Evaluation & Review Management:** Provides tools for screeners and reviewers to assess applications using structured rubrics, manage assignments, and track completion.
6.  **Scheduling & Interview Coordination:** Facilitates the booking and management of interviews, allowing hosts to define availability and applicants to self-schedule.
7.  **Recommendations Management:** Manages the process of requesting and submitting recommendations, typically via secure, external links.
8.  **Decision & Status Tracking:** Orchestrates the final decision-making process, records outcomes, and updates applicant statuses.
9.  **Communication & Notifications:** Manages all internal and external communications, including email and in-app notifications triggered by workflow events.
10. **Reporting & Insights:** Provides dashboards and data export capabilities for monitoring campaign performance, diversity metrics, and overall program effectiveness.

**Interconnections:**

*   **User & Role Management** provides authentication and authorization for all interactions.
*   **Pathway Templates** are the blueprints for **Campaigns**.
*   **Campaigns** define the sequence of **Phases** (Application, Review, Scheduling, Recommendation, Decision).
*   **Application Management** feeds data into **Evaluation & Review**.
*   **Evaluation & Review** outcomes inform **Decision & Status Tracking**.
*   **Scheduling** and **Recommendations** are specific types of phases within a **Campaign**.
*   **Communication & Notifications** are triggered by events across all operational modules.
*   **Reporting & Insights** aggregate data from all modules to provide a holistic view.

## 2. Role-Based Interfaces and User Flows

The platform provides tailored experiences for different user roles, ensuring relevant information and functionalities are presented.

**Frontend Routing Structure (`src/app`):**

*   **`/(public)`:** Unauthenticated routes for marketing pages, public program listings, magic links (e.g., for recommenders), and initial sign-up/login.
*   **`/(portal)`:** Dedicated dashboard and workflows for **Applicants/Nominees/Participants**.
    *   **Flow:** View open campaigns, apply, track application status, schedule interviews, view decisions, receive notifications.
*   **`/(workbench)`:** Central hub for **Coordinators/Recruiters/Program Officers** and **Evaluators/Hiring Managers/Review Panelists**.
    *   **Coordinator Flow:** Create/manage campaigns, configure settings, assign reviewers, monitor progress, manage communications.
    *   **Evaluator Flow:** View assigned applications, score using rubrics, provide feedback, manage availability for interviews.
*   **`/(admin)`:** Exclusive console for **Admins/Platform Owners**.
    *   **Flow:** Create/edit Pathway Templates, manage user roles and permissions, configure system-wide settings, access advanced reporting.

## 3. Service Layers

The architecture employs a layered approach to ensure separation of concerns, maintainability, and scalability.

*   **Frontend (UI Layer):**
    *   **Location:** `src/app`, `src/components`, `src/features`, `src/hooks`, `src/context`.
    *   **Technologies:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn/UI.
    *   **Responsibilities:** User interface rendering, client-side state management (`useState`, `useReducer`, React Context), form handling (`react-hook-form`), interaction with backend APIs.

*   **Backend (API Layer):**
    *   **Location:** `src/app/api`.
    *   **Technologies:** Next.js API Routes (TypeScript).
    *   **Responsibilities:** Exposing RESTful endpoints for frontend consumption, input validation, orchestrating calls to the business logic layer (`src/services`), handling authentication and authorization checks.

*   **Business Logic (Service Layer):**
    *   **Location:** `src/services`.
    *   **Technologies:** TypeScript.
    *   **Responsibilities:** Encapsulating domain-specific business rules and logic for each module (e.g., `pathwayService.ts`, `campaignService.ts`, `applicationService.ts`). These services coordinate operations, interact with the data access layer, and integrate with external services.

*   **Data Access Layer (DAL):**
    *   **Location:** `src/integrations/supabase`, `src/db` (for schema/types).
    *   **Technologies:** Supabase (PostgreSQL database, Supabase client library).
    *   **Responsibilities:** Abstracting database interactions, performing CRUD operations, handling data modeling, and ensuring data integrity.

*   **Integrations Layer:**
    *   **Location:** `src/integrations`.
    *   **Technologies:** Supabase client, SendGrid API, Twilio API, Google/Outlook Calendar APIs.
    *   **Responsibilities:** Managing connections and interactions with all third-party services.

## 4. Extensibility Strategy

The platform is designed to be extensible to accommodate future features and evolving requirements.

*   **Modular `src/features` Directory:** New features (vertical slices) can be developed within their own `src/features` subdirectories, containing all related UI, logic, and data fetching, minimizing impact on existing modules.
*   **Configurable Pathway Templates:** The core concept of Pathway Templates allows for the introduction of new "Phase Types" (e.g., AI-driven evaluation, digital credentialing, external HR system sync) without requiring changes to the fundamental campaign execution logic.
*   **API-First Design:** Well-defined API routes (`src/app/api`) ensure that the backend can easily integrate with new frontend clients or external systems in the future.
*   **Supabase Ecosystem:** Leveraging Supabase's capabilities (PostgreSQL functions, Edge Functions, webhooks) provides powerful hooks for extending server-side logic, integrating with external services, or implementing complex data transformations.
*   **Service Layer Abstraction:** The `src/services` layer acts as an abstraction point, allowing underlying implementations (e.g., changing an email provider from SendGrid to another service) to be swapped out with minimal impact on the business logic.
*   **Data Model Flexibility:** A well-designed relational database schema in Supabase will allow for easy expansion to store new types of data or relationships as features are added.

## 5. Initial Implementation Steps (Vertical Slicing)

Following the Vertical Implementation Strategy, we will begin with foundational elements and then build out end-to-end slices.

1.  **Supabase Integration:** Set up Supabase for authentication and database.
2.  **Basic Layouts & Navigation:** Implement the `/(public)`, `/(portal)`, `/(workbench)`, and `/(admin)` layouts with basic navigation.
3.  **User & Role Management (Slice 0 - Foundation):** Implement user registration, login, and basic role assignment using Supabase Auth.
4.  **Pathway Template Management (Slice 1):** Develop the full vertical slice for creating, editing, and managing Pathway Templates, including the database schema, service layer, and admin UI. This will be the first demonstrable value increment.